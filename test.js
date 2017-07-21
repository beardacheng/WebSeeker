'use strict';

const cluster = require('cluster');
const GlobalData = require('./globalData');

/*
if (cluster.isMaster) {

    const pipe = new DataPipe();
    pipe.create({port:9527, addr:'10.29.17.23'});

    pipe.listenTo('v2', (buff) => {
       console.log('recv from client: ' + JSON.stringify(buff));
    });

    process.on('SIGINT', () => {
        pipe.close();
    });

    cluster.fork();
    cluster.fork();

    setTimeout(() => {
        pipe.send('v1', {v1:'中文456'});
    }, 1000);

} else {

    const pipe = new DataPipe();

    pipe.listenTo('v1', (buff) => {
        console.log('recv from server ' + JSON.stringify(buff));
    });

    pipe.connect({port:9527, addr:'10.29.17.23'});


    setTimeout(() => {
        pipe.send('v1', {v1:'中文123_1'});
        pipe.send('v1', {v1:'中文123_2'});
        pipe.send('v2', {v1:'中文123_3'});
        pipe.send('v2', {v1:'中文123_4'});
        pipe.send('v2', {v1:'中文123_5'});
        pipe.send('v2', {v1:'中文123_6'});
        pipe.send('v2', {v1:'中文123_7'});
        pipe.send('', {v1:'中文123_8'});
        pipe.send('', {v1:'中文123_9'});
    }, 1000);


}
*/
const pipeConfig = {port : 9527, addr : '10.29.17.23'};

if (cluster.isMaster) {

    const data = new GlobalData();
    data.createPipe(pipeConfig);

    cluster.fork();
    cluster.fork();

    data.recvFromPipe('v1', (buff) => {
        console.log('recv from client ' + JSON.stringify(buff));
    });

    setTimeout(() => {
        data.sendToPipe('v1', {v1:'中文456'});
    }, 1000);

} else {

    const data = new GlobalData();
    data.listenToPipe(pipeConfig);

    data.recvFromPipe('v1', (buff) => {
        console.log('recv from server ' + JSON.stringify(buff));
    });


    setTimeout(() => {
        data.sendToPipe('v1', {v1:'中文123_1'});
        data.sendToPipe('v1', {v1:'中文123_2'});
        data.sendToPipe('v2', {v1:'中文123_3'});
        data.sendToPipe('v2', {v1:'中文123_4'});
        data.sendToPipe('v2', {v1:'中文123_5'});
        data.sendToPipe('v2', {v1:'中文123_6'});
        data.sendToPipe('v2', {v1:'中文123_7'});
        data.sendToPipe('', {v1:'中文123_8'});
        data.sendToPipe('', {v1:'中文123_9'});
    }, 1000);


}