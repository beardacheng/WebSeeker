"use strict";

const httpServer = require('./httpServer');
const {redisHash, redisClient} = require('./redis');
const apn = require('./applePushMessage');
const config = require('./config');

const initFunc = function() {
    httpServer.init(config["api"]["port"]);

    httpServer.addCmd('deviceInfo', function(req) {
        // { id: 'F55C80D8-70A4-4E4A-8850-AE5B0C7E95D0',
        // token: '02392c718dbce762669f159311456dffadbc7595293493888dc54658d0313c89' }
        //用来notify
        redisClient.saddAsync('deviceToken', req.token);
        return {ret:'ok'};
    });

};

const sendApnMessages = function(alert, payload) {
    //get tokens
    redisClient.smembersAsync('deviceToken').then((arr) => {
        return apn.sendMessage(alert, payload, arr);
    }).then((invalidTokens) => {
        if (invalidTokens.length > 0) return redisClient.sremAsync('deviceToken', invalidTokens);
    });
};

module.exports = {
    initFunc,
    sendMessages: sendApnMessages,
};