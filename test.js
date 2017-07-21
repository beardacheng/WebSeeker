'use strict';

const cluster = require('cluster');
const GlobalData = require('./globalData');

const pipeConfig = {port : 35001, addr : '10.29.17.23'};

const dataPipeForManager = new GlobalData();
dataPipeForManager.listenToPipe(pipeConfig);

for (let i = 0 ; i < 100; ++i) {
    dataPipeForManager.sendToPipe('vocationResult', {fromCity: 'from' + i, toCity: 'to' + i});
}

