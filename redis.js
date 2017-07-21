'use strict';

const redis = require("redis");
const bluebird = require('bluebird');
const config = require('./config');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

let client = null;
let subClient = null;

function getClient() {
    if (client === null) {
        console.log('redis connect to server!');

        const {port, addr} = config["redis"];
        client = redis.createClient( port, addr);
        client.on("error", function (err) {
            console.log("Redis Error " + err);
        });
    }

    return client;
}

const set = function(key, value) {
    return getClient().setAsync(key, JSON.stringify(value));
};

const get = function(key) {
    return getClient().getAsync(key).then((v) => JSON.parse(v));
};

const setHash = function(key, hashKey, value) {
    return getClient().hsetAsync(key, hashKey, JSON.stringify(value));
};

const getHash = function(key, hashKey) {
    return getClient().hgetAsync(key, hashKey).then((v) => JSON.parse(v));
};

const addToPipe = function(key, value) {
    const ret = getClient().lpush(key, JSON.stringify(value));
    publish('changed_' + key, 'changed');
    return ret;
};

const listenToPipe = function(key, deal, target) {
    const getFunc = function() {
        pipeGet(key).then(function(v){
            if (v !== null) {
                deal.call(target, v);
                getFunc();
            }
        });
    };

    subscribe('changed_' + key, function() {
        getFunc();
    });
};

const pipeGet = function (key) {
    return getClient().rpopAsync(key).then((v) => JSON.parse(v));
};

const subscribe = function(cName, deal, target) {
    if (null === subClient) {
        const client = getClient();
        subClient = client.duplicate();
    }

    subClient.on("message", function (channel, message) {
        if (channel === cName) deal.call(target, message);
    });
    subClient.subscribe(cName);
};

const publish = function(cName, message) {
    getClient().publish(cName, message);
};

process.on('exit', () => {
    if (client !== null) {
        client.quit();
        client = null;
    }
    console.log('redis quit');
});

module.exports = {
    redisClient : getClient(),
    redisSet : set, redisGet : get,
};
