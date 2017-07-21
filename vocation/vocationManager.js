"use strict";

const cluster = require('cluster');
const _ = require('lodash');
const GlobalData = require('../globalData');
const config = require('../config');

const getNewTask = function() {
    const fromCitys = ['上海', '南宁'];
    const toCitys = [ '香港',
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
        '日内瓦',
        '基督城' ];

    function* getCityGenerator(citys) {
        for (const city of citys) yield city;
    }

    let fromCityIterator = getCityGenerator(fromCitys);
    let toCityInterator = getCityGenerator(toCitys);

    function getfromCity() {
        let ret;
        do {
            ret = fromCityIterator.next();
            if (ret.done) fromCityIterator = getCityGenerator(fromCitys);
        } while(ret.value === undefined);
        return ret.value;
    }

    let fromCity = null;
    return function() {
        if (fromCity === null) fromCity = getfromCity();

        let ret;
        do  {
            ret = toCityInterator.next();
            if (ret.done) {
                toCityInterator = getCityGenerator(toCitys);
                fromCity = getfromCity();
            }
        } while (ret.value === undefined);

        return {fromCity, toCity: ret.value};
    }
}();

// const pipeConfigForWorkers = {port : 9527, addr : '10.29.17.23'};
// const pipeConfigForWorkers = {file : './socks/pipeForWorker'};
const dataPipeForWorkers = new GlobalData();

// const pipeConfigForApp = {port: 35001, addr : '10.29.17.23'};
const dataPipeForApp = new GlobalData();

const masterInitFunc = function() {
    let cheapVocations = {};
    let ignoreIds = [];

    const initData = function() {
        dataPipeForWorkers.createPipe(config["pipe"]["manager2worker"]);
        dataPipeForApp.listenToPipe(config["pipe"]["app2manager"]);

        dataPipeForApp.recvFromPipe('ignoreIds', (data) => {
            ignoreIds = data;
        });

        dataPipeForApp.recvFromPipe('vocations', (data) => {
            cheapVocations = data;
        });

        dataPipeForApp.sendToPipe('cmd', {name:'ignoreIds'});
        dataPipeForApp.sendToPipe('cmd', {name:'vocations'});

        dataPipeForWorkers.recvFromPipe('cmd', (req) => {
            if (req.name === 'ignoreIds') {
                dataPipeForWorkers.sendToPipe('ignoreIds', ignoreIds);
            }
        })
    }();

    const listenToWorkerRet = function() {
        dataPipeForWorkers.recvFromPipe('vocationResult', function(v) {
            // console.log('!!vocationResult: ' + JSON.stringify(v));
            const key = v.fromCity + '_' + v.toCity;
            if (!v.isFound && cheapVocations[key] !== undefined) {
                delete cheapVocations[key];
                dataPipeForApp.sendToPipe('vocations', cheapVocations);
            }
            else if (v.isFound && _.find(cheapVocations, function(data) {return v.ret.id === data.ret.id}) === undefined) {
                cheapVocations[key] = v;
                dataPipeForApp.sendToPipe('vocationResult', v);
                dataPipeForApp.sendToPipe('vocations', cheapVocations);
            }
        });
    }();
};

let workerDataApi = {
    getIgnoreIds : () => {
        dataPipeForWorkers.sendToPipe('cmd', {name: 'ignoreIds'});
        return new Promise((resolve) => {
            dataPipeForWorkers.recvFromPipe('ignoreIds', (data) => resolve(data));
    })},
};
const workerInitFunc = function() {
    dataPipeForWorkers.listenToPipe(config["pipe"]["manager2worker"]);
    dataPipeForWorkers.sendToPipe('cmd', {name: 'ignoreIds'});
};

module.exports = {
    data : workerDataApi,
    run : function() {
        return  function () {
            if (cluster.isMaster) {
                console.log(`Vocation Master ${process.pid} is running`);

                cluster.on('online', (worker) => {
                    console.log(`worker ${worker.id} is online`);
                });

                cluster.on('exit', (worker) => {
                    console.log(`worker ${worker.process.pid} died`);
                    cluster.fork();
                });

                cluster.on('message', (worker, message) => {
                    if (message.cmd === 'GET_TASK') {
                        worker.send({cmd: 'NEW_TASK', task:getNewTask()});
                    }
                });

                masterInitFunc();

                for (let i = 0; i < 4; i++) {
                    cluster.fork();
                }

            } else {
                workerInitFunc();

                const mine = cluster.worker;
                const vocation = require('./vocationWorker');
                mine.on('message', (message) => {
                    if (message.cmd === 'NEW_TASK') {
                        console.log(`${mine.id} get task: ${[message.task.fromCity, message.task.toCity]}`);
                        vocation.checkFunc(message.task.fromCity, message.task.toCity).then(ret => {
                            console.log(`worker ${mine.id} ret: ${JSON.stringify(ret)}`);
                            dataPipeForWorkers.sendToPipe('vocationResult', ret);
                            mine.send({cmd:'GET_TASK'});
                        })
                    }
                });

                mine.send({cmd:'GET_TASK'});
            }
        };
    }(),
};