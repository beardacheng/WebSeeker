'use strict';
//
// const cluster = require('cluster');
//
// if (cluster.isMaster) {
//     console.log(`i am master`);
//     const worker = cluster.fork();
//     worker.on('online', () => {
//         console.log(`worker is online`);
//     });
//
//     process.on('exit', () => {
//         console.log(`master exit`);
//     });
//
//     process.on('SIGINT', () => {
//         console.log(`master recv sigint, disconnect child`);
//         cluster.disconnect();
//     });
// } else {
//     console.log(`i am child`);
//
//     const job = setInterval(() => {
//         console.log(`do sth`);
//     }, 3000);
//
//     cluster.worker.on('disconnect', () => {
//         console.log(`recv disconnect event`);
//         clearInterval(job)
//     });
//
//     process.on('exit', () => {
//         console.log(`child exit`);
//     });
//
//     process.on('SIGINT', () => {
//
//     });
// }

console.log(`${new Date().format("yyyy-MM-dd HH:mm:ss")}`);

