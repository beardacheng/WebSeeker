'use strict';

const _ = require('lodash');
const GlobalData = require('../globalData');
const {redisGet, redisSet} = require('../redis');
const User = require('../user');
const httpServer = require('../httpServer');

const pipeConfigForManager = {port: 35001, addr : '10.29.17.23'};
const dataPipeForManager = new GlobalData();

const initFunc = () => {
    let cheapVocations = {};
    let ignoreIds = [];

    const initData = function() {
        dataPipeForManager.createPipe(pipeConfigForManager);

        //get data from redis
        redisGet('ignoreIds').then((v) => {
            if (v !== null) ignoreIds = v;
        });
        redisGet('vocations').then((v) => {
            if (v != null) cheapVocations = v;
        });

        //register cmd for pipe
        dataPipeForManager.recvFromPipe('cmd', (req) => {
           if (req.name === 'ignoreIds') {
               dataPipeForManager.sendToPipe('ignoreIds', ignoreIds);
           } else if (req.name === 'vocations') {
               dataPipeForManager.sendToPipe('vocations', cheapVocations);
           }
        });

        dataPipeForManager.recvFromPipe('vocationResult', (v) => {
            User.sendMessages(`发现新的行程：${v.ret.title}`, v.ret);
        });

        dataPipeForManager.recvFromPipe('vocations', (v) => {
           cheapVocations = v;
           redisSet('vocations', cheapVocations);
        });

    }();

    const registerHttpCmd = function() {

        httpServer.addCmd('ignore', function(req) {
            if (undefined === req.id) return {ret:'invalid param id'};
            let deleteId = parseInt(req.id);

            cheapVocations = _.omitBy(cheapVocations, function(v) {return v.ret.id == deleteId});
            redisSet('vocations', cheapVocations);
            dataPipeForManager.sendToPipe('vocations', cheapVocations);

            ignoreIds.push(deleteId);
            redisSet('ignoreIds', ignoreIds);
            dataPipeForManager.sendToPipe('ignoreIds', ignoreIds);

            return {ret:'ok'};
        });

        httpServer.addCmd('getList', function(req) {
            return {ret:'ok', list : _(cheapVocations).values().map('ret').value()};
        });
    }();
};

module.exports = {
    run : initFunc,
};