const fs = require('fs');
const {until} = require('selenium-webdriver');

var Tool = {
	snap : function* (driver, file, quit) {
		yield driver.takeScreenshot().then(function(v){
			var body = v.replace(/^data:image\/png;base64,/, "");
			var newBody = new Buffer(body, 'base64').toString('binary');

			var filePath = "./" + file + ".png";
			fs.writeFile(filePath, newBody, "binary");
			require('child_process').exec("open -a \"/Applications/Preview.app\" \"" + filePath + "\"");
		});

		if (!!quit) {
			yield driver.quit();
			yield driver.call(function() {
				process.exit(0);
			});
		}
	},
	
	snapNow : function(driver, file, quit) {
		driver.takeScreenshot().then(function(v){
			var body = v.replace(/^data:image\/png;base64,/, "");
			var newBody = new Buffer(body, 'base64').toString('binary');

			var filePath = "./" + file + ".png";
			fs.writeFile(filePath, newBody, "binary");
			require('child_process').exec("open -a \"/Applications/Preview.app\" \"" + filePath + "\"");
		});

		if (!!quit) {
			driver.quit();
			driver.call(function() {
				process.exit(0);
			});
		}
	},
	
	getDate : function* (driver) {
		var date = null;
		yield driver.executeScript(function() {
			var date = new Date();
			return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
		}).then(function(d) {date = d;});
		
		return date;
	},
	
	waitForLoaded : function* (driver, waitSecs) {
		if (!!!waitSecs) waitSecs = 5000;
		
		var nowUrl = '';
		yield driver.getCurrentUrl().then(function(url) {nowUrl = url;});
		
		yield driver.wait(function(){
			return driver.getCurrentUrl().then(function(url) {
				return nowUrl != url;
			})
		}, waitSecs);
		yield driver.wait(function(){
			return driver.executeScript(function() {
				return document.readyState == 'complete';
			}).then(function(r){return r;});
		}, waitSecs);
	},
	
	tryDo : function* (thenable) {
		try {
			yield thenable;
			return true;
		}
		catch(e) {
			return false;
		}
	},
	
	click : function* (driver, element) {
		
	},

	timetrans(date) {
		var date = new Date(date*1000);//如果date为10位不需要乘1000
		var Y = date.getFullYear() + '-';
		var M = (date.getMonth()+1 < 10 ? '0'+(date.getMonth()+1) : date.getMonth()+1) + '-';
		var D = (date.getDate() < 10 ? '0' + (date.getDate()) : date.getDate()) + ' ';
		var h = (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':';
		var m = (date.getMinutes() <10 ? '0' + date.getMinutes() : date.getMinutes()) + ':';
		var s = (date.getSeconds() <10 ? '0' + date.getSeconds() : date.getSeconds());
		return Y+M+D+h+m+s;
	}
};

module.exports = Tool;

