'use strict';

const {Builder, By, promise, until, Key} = require('selenium-webdriver');
const Tool = require('./tool');

var _ = require('lodash');

var builder = new Builder();
// builder.forBrowser('chrome');
builder.forBrowser('phantomjs');
builder.usingHttpAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36');

let result = promise.consume(function* dofunc(){
	var driver = builder.build();
	yield driver.manage().window().setSize(1602,967);
	yield driver.get('http://www.ctrip.com');

	var date = null;
	yield driver.executeScript(function() {
		var date = new Date();
		return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
	}).then(function(d) {date = d;});

	yield driver.sleep(345);
	var link = driver.findElement(By.linkText('机票'));
	yield driver.actions().mouseMove(link).click(link).perform();

	yield driver.wait(until.elementsLocated(By.id('DepartCity1TextBox')));
	yield driver.sleep(200);
	yield driver.findElement(By.id('DepartCity1TextBox')).sendKeys('sh');

	yield driver.sleep(300);
	var target = driver.findElement(By.id('ArriveCity1TextBox'));
	yield driver.actions().mouseMove(target).click(target).sendKeys('nn').perform();
	var findCss = '.poi_suggest .active .icon_city';
	yield driver.wait(until.elementLocated(By.css(findCss))).click();

	yield driver.sleep(350);
	var input = driver.findElement(By.id('DepartDate1TextBox'));
	yield driver.actions().mouseMove(input).click().perform();
	yield driver.actions().sendKeys(date).perform();

	yield driver.sleep(402);
	var button = driver.findElement(By.className('flight-tit current'));
	yield driver.actions().mouseMove(button).click().perform();

	yield driver.sleep(200);
	button = driver.findElement(By.id('search_btn'));
	yield driver.actions().mouseMove(button).click(button).perform();

	yield driver.wait(until.elementLocated(By.className('default-sort')));
	yield driver.findElement(By.id('lowestPriceLink')).click();
	
	yield driver.wait(until.elementLocated(By.css('#LowestPriceDialog [price]')), 1000);
	
	var data = [];
	yield driver.findElements(By.css('#LowestPriceDialog [price]')).then(function(arr) {
		arr.forEach(function(v) {
			var day = {};
			v.getAttribute('data-date').then(function(t){day.date = t;});
			v.getAttribute('price').then(function(t){day.price = parseInt(t)});
			data.push(day);
		})
	})
	
	console.log(_(data).sortBy('price').first());
	
	yield Tool.snap(driver, 'test');
	yield driver.quit();
	// process.exit(0);

	//yield driver.sleep(1000 * 1000);
	//yield driver.quit();
});

result.then(_ => console.log('SUCCESS!'),
            e => console.error('FAILURE: ' + e));
