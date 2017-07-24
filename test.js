'use strict';

const {Builder, Capabilities} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const options = new chrome.Options();
options.addArguments("--proxy-server=socks5://127.0.0.1:1080");

const builder = new Builder;
const driver = builder
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

driver.get('http://www.ip138.com');
driver.sleep(10000);
driver.quit();
