'use strict';

const {Builder, By, promise, until} = require('selenium-webdriver');
const Tool = require('../tool');
const _ = require('lodash');
const task = require('./vocationManager');

const builder = new Builder();
const browser = 'phantomjs';

builder.forBrowser(browser);
builder.usingHttpAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36');

let driver = null;
if (browser === 'phantomjs') {
	const capabilities = require('selenium-webdriver/lib/capabilities');

	const args = capabilities.Capabilities.phantomjs();
	args.set("phantomjs.cli.args", ['--disk-cache=true', '--disk-cache-path=/tmp/phantomjs/']);
	// args.set("phantomjs.cli.args", ['--disk-cache=true', '--disk-cache-path=/tmp/phantomjs/', '--proxy=127.0.0.1:1080', '--proxy-type=socks5']);
	driver = builder.withCapabilities(args).build();
}
else {
	driver = build.build();
}

const flow = promise.controlFlow();
const urlOrg = 'http://vacations.ctrip.com/whole-2A100047B126/?searchValue=%E6%B5%B7%E5%B2%9B&searchText=%E6%B5%B7%E5%B2%9B#_taba';

let ignoreIds = [];

// const ignoreIds = [3940876, 60841, 4726350, 1012057012, 1017231550, 3117983, 1634914, 5090235, 1013912540, 1014301126, 1014301614, 1017230155, 79169, 2483040];
// const ignoreIds = [];

class VacationResult {
    constructor() {

    }

    setTask(fromCity, toCity) {
        this.fromCity = fromCity;
        this.toCity = toCity;
    }

    found(ret) {
        this.isFound = true;
        this.ret = ret;
    }

    notFound(ret) {
        this.isFound = false;
        this.ret = ret;
    }

    toString() {
        return `${this.fromCity} => ${this.toCity} : ${this.isFound ? JSON.stringify(this.ret) : '-  (' + this.ret + ')'} `
    }

    get target()
    {
        return this.ret;
    }
}

flow.execute(function *() {
	yield driver.manage().window().setSize(1602,1010);
	console.log('get url: ' + urlOrg);
	yield driver.get(urlOrg);

	//关闭浮层
	let target = null;
	yield* Tool.tryDo(driver.findElement(By.css('.jewel_pop_box')).then(function(e) {
			console.log('try close pop box');
	 		target = e.findElement(By.css('.jewel_pop_cha'));
	 		driver.actions().mouseMove(target).click(target).perform();}
		));

	//等待浮层关闭
	if (!!target) yield driver.wait(until.elementIsNotVisible(target), 1000);
});

var checkFunc = function(from, to) {
	return function* dofunc(){
        const checkRet =  new VacationResult();

		try{
			var fromCity = from;
			var toCity = to;

            checkRet.setTask(from, to);

			yield driver.manage().window().setSize(1602,3110);

			//选择出发城市
			let isCaptchaed = false;
 			yield driver.wait(until.elementLocated(By.css('.start_city_station')), 5000).then(null, (err) => {
				console.log(`timeout : ${JSON.stringify(err)}`);
                isCaptchaed = true;

                //可能遇到了验证码
				driver.findElement(By.css('#captchaImg')).then((e) => {
                    // e.takeScreenshot().then((v) => {
                    //     var body = v.replace(/^data:image\/png;base64,/, "");
                    //     var newBody = new Buffer(body, 'base64').toString('binary');
                    //
                    //     var filePath = "./" + new Date().getTime() + ".png";
                    //     require('fs').writeFileSync(filePath, newBody, "binary");
                    // });

                    e.getSize().then(size => {
                        console.log(`${JSON.stringify(size)}`);
                    });

				});
			});

 			if (isCaptchaed) return;

			var element = yield driver.findElement(By.css('.start_city_station'));
			yield element.getText().then(function(t){
				if (!(t.indexOf(fromCity) !== -1)) {
					return driver.actions().mouseMove(element).click(element).perform();
				}
				return null;
			}).then(function(v) {
				if (!!v) {
					driver.sleep(150);
					console.log('change from city to ' + fromCity);
					var searchBox = driver.findElement(By.css('.station_search_box'));
					driver.wait(until.elementIsVisible(searchBox), 1000);
					driver.findElement(By.css('.station_search_box input')).sendKeys(fromCity);
					driver.wait(until.elementIsVisible(driver.findElement(By.css('.station_search_result'))), 1000);
					driver.findElement(By.css('.station_search_result a')).click();
				}
			})

			//输入目标城市并点击搜索
			console.log('input dest city ' + toCity);
			yield driver.sleep(100);
            yield driver.wait(until.elementLocated(By.css('.search_txt')), 1000);
			yield driver.findElement(By.css('.search_txt')).then((e) => {
				 e.clear();
                 e.sendKeys(toCity);
			});

			yield driver.sleep(100);
			yield driver.findElement(By.css('.main_search_btn')).click();
			yield* Tool.waitForLoaded(driver, 8000);
			console.log('search to city ok');

			//选择从哪里出发
			console.log('click from which city to go');
			//尝试展开'更多'
			var fromCityButton = null;
			yield promise.filter(driver.findElements(By.css('.cate_content.search_height')), function(v){
				return v.findElement(By.css('.b')).getText().then(function(t){
					if (t == '出发城市') {
						fromCityButton = v;
						return  promise.filter(v.findElements(By.css('.more_btn a')), function(bu){
							return bu.click();
						})
					}
				})
			});

			//点击出发城市
			yield fromCityButton.findElement(By.linkText(fromCity)).click();
			yield* Tool.waitForLoaded(driver, 8000);

			//点击价格排序
			console.log('click order by price');
			driver.sleep(200);
			yield driver.findElement(By.css('.sort.basefix')).findElement(By.partialLinkText("价格")).click();
			yield* Tool.waitForLoaded(driver, 8000);

			var data = [];
			var elements = yield driver.findElements(By.css('.main_mod.product_box.flag_product'));

			console.log('wait for price show');
			yield driver.wait(until.elementLocated(By.css('.sr_price strong')), 5000);

			console.log('get result count ' + _.size(elements));
			var waitMSecs = 5000;

            //同步ignoreIds
            let ignoreIds = [];
            yield task.data.getIgnoreIds().then((v) => ignoreIds = v);
            // console.log(ignoreIds);
			for (var i = 0; i < elements.length;  i++) {
				try {
					var v = elements[i];
					var line = {};

					yield driver.actions().mouseMove(v).perform();

					yield v.findElement(By.css('.product_pic em')).getText().then(function(e) {line.type = e;});
					if (line.type != '自由行') continue;

					yield v.findElement(By.css('.sr_price strong')).getText().then(function(e) {line.price = parseInt(e);});
					yield v.findElement(By.css('.product_title')).getText().then(function(e) {line.title = e;});
					yield v.findElement(By.css('.product_title a')).getAttribute('href').then(function(e) {line.url = e;});

					var obj = null;
					yield v.getAttribute('data-params').then(function(attr){ obj = JSON.parse(attr);});
					line.id = obj.Id;
                    line.foundTime = Math.floor(Date.now() / 1000);

					if (_.indexOf(ignoreIds, line.id) != -1) continue;

					data.push(line);
					if (_.size(data) > 6) {
						break;
					}

				}catch(e) {
					if (e.name == 'NoSuchElementError') {
						if (e.message.indexOf('price') != -1) {
							if (waitMSecs <= 0) continue;

							yield driver.sleep(1000);
							waitMSecs -= 1000;
							i--;
						}
					}
					else {
						console.log(e.message);
					}

					continue;
				}
			}

			data = _.sortBy(data, 'price');
			if(_.size(data) > 5) {
				var first = _.first(data);
				data = _.tail(data);

				first.from = fromCity;
				first.to = toCity;

				var price = _.first(data).price - first.price;
				if (price * 100 / first.price <= 20){
                    checkRet.notFound(`${[price, first.price]}`);
				}
				else {
					first.interval = price;
					_.each(data, function(v, i, arr) {
						if (i + 1 < _.size(data)) {
							price -= (arr[i+ 1].price - v.price);
						}

						if (price < 0) return false;
					});

					if (price > 0) {
					    checkRet.found(first);
					}
					else {
					    checkRet.notFound(`not found ${price}`);
					}
				}
			}
			else {
			    checkRet.notFound(`result low ${_.size(data)}`);
			}
		}
		catch(e) {
			console.log('ERROR: ' + e);
			// yield* Tool.snap(driver, 'error');

			yield driver.get(urlOrg);
			return yield* dofunc();
		}

		// yield driver.sleep(30000);
		return checkRet;
	};
}


var fromCitys = ['上海'];
var toCitys = [ '香港',
  '澳门',
  '台北',
  '高雄',
  '垦丁',
  '花莲',
  '阿里山',
  '台中',
  '巴厘岛',
  '新加坡',
  '塞班岛',
  '马来西亚',
  '菲律宾',
  '柬埔寨',
  '越南',
  '缅甸',
  '沙巴',
  '岘港',
  '胡志明市',
  '芽庄',
  '兰卡威',
  '吉隆坡',
  '宿雾',
  '长滩岛',
  '老挝',
  '文莱',
  '暹粒',
  '普吉岛',
  '曼谷',
  '清迈',
  '芭堤雅',
  '皮皮岛',
  '苏梅岛',
  '甲米',
  '华欣',
  '清莱',
  '大城',
  'pai县',
  '马尔代夫',
  '尼泊尔',
  '斯里兰卡',
  '印度',
  '澳大利亚',
  '新西兰',
  '斐济',
  '大溪地',
  '悉尼',
  '凯恩斯',
  '墨尔本',
  '黄金海岸',
  '皇后镇',
  '奥克兰',
  '福克斯冰河',
'基督城',
  '美国',
  '加拿大',
  '巴西',
  '阿根廷',
  '墨西哥',
  '夏威夷',
  '关岛',
  '纽约',
  '洛杉矶',
  '拉斯维加斯',
  '塞班岛',
  '旧金山',
  '华盛顿',
  '温哥华',
  '西班牙',
  '法国',
  '英国',
  '意大利',
  '希腊',
  '俄罗斯',
  '德国',
  '瑞士',
  '捷克',
  '奥地利',
  '罗马',
  '巴黎',
  '雅典',
  '伦敦',
  '爱琴海诸岛',
  '威尼斯',
  '巴塞罗那',
  '莫斯科',
  '普罗旺斯',
  '苏黎世',
  '圣托里尼',
  '米兰',
  '阿姆斯特丹',
  '法兰克福',
  '马德里',
  '日内瓦' ];
// toCitys = ['墨西哥'];
// toCitys = ['台北'];

// for (var from of fromCitys) {
// 	for (var to of toCitys) {
// 		flow.execute(checkFunc(from, to)).then(r => console.log(r));
// 	}
// }
//
// flow.execute(function* () {
// 	yield driver.quit();
// });
//

module.exports = {
	checkFunc(from, to) {
        // return flow.execute(checkFunc(from, to)).then(r => console.log(r));

		// const before = process.memoryUsage();
		// const ret = flow.execute(checkFunc(from, to));
		// const after = process.memoryUsage();
        //
		// const r = {};
		// r.rss = after.rss - before.rss;
		// r.heapTotal = after.heapTotal - before.heapTotal;
		// r.heapUsed = after.heapUsed - before.heapUsed;
		// r.external = after.external - before.external;
		// console.log(`${JSON.stringify(r)}`);
        //
		// return ret;

		return flow.execute(checkFunc(from, to));
	},
	finish() {
		driver.quit();
	}
};


