'use strict';

const _ = require('lodash');
const GlobalData = require('../globalData');
const User = require('../user');
const httpServer = require('../httpServer');
const config = require('../config');
const Tool = require('../tool');

// const pipeConfigForManager = {port: 35001, addr : '10.29.17.23'};
const dataPipeForManager = new GlobalData();

let vocations = [];
const initFunc = () => {
    const initData = function() {
        try{
            dataPipeForManager.createPipe(config["pipe"]["app2manager"]);

            dataPipeForManager.recvFromPipe('vocationResult', (v) => {
                User.sendMessages(`发现新的行程：${v.ret.title}`, v.ret);

                dataPipeForManager.sendToPipe('cmd', {name:'vocations'});
            });

            dataPipeForManager.recvFromPipe('vocations', function(data) {
                vocations = data;
                console.log(vocations);
            });

        }catch (err) {
            console.log("1" + err);
        }

    }();

    const registerHttpCmd = function() {
        try {
            httpServer.addCmd('ignore', function(req) {
                if (undefined === req.id) return {ret:'invalid param id'};
                let deleteId = parseInt(req.id);

                console.log('ignore id ' + deleteId);
                dataPipeForManager.sendToPipe('ignoreId', deleteId);
                dataPipeForManager.sendToPipe('cmd', {name:'vocations'});
                return {ret:'ok'};
            });

            httpServer.addCmd('getList', function() {
                return {ret:'ok', list:vocations, renew: Tool.timetrans(dataPipeForManager.lastHeartbeatTime)};
            });
        } catch (err) {
            console.log("2" + err);
        }

    }();
};

module.exports = {
    run : initFunc,
};