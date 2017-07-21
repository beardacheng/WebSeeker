'use strict';

const net = require('net');
const {Buffer} = require('buffer');
const _ = require('lodash');

class DataPipe {
    constructor() {
        this.server = null;
        this.client = null;
        this.clients = [];
        this.listeners = [];
        this.recvBuff = null;
        this.remoteConfig = null;
    }

    create(remote = {}) {
        try {
            if (this.server === null) {
                this.server = net.createServer((client) => {
                    // console.log(`server recv client ${client}`);
                    this.clients.push(client);

                    client.on('data', (buff) => this.recv(buff));
                    client.on('end', () => client.end());
                    client.on('close', () => {
                        _.pull(this.clients, client);
                    });
                });

                const {port, addr, file} = remote;
                if (file !== undefined) {
                    const fs = require('fs');
                    fs.stat(file, (err, stat) => {
                        if (!!stat && stat.isSocket()) fs.unlinkSync(file);
                        this.server.listen(file);
                    } );
                }
                else if (port !== undefined && addr !== undefined) this.server.listen(port, "0.0.0.0");
                else throw new Error('ERROR: invalie pip config');
                this.remoteConfig = remote;

                process.on('exit', (code) => {
                    if (code !== 0) this.close();
                });
            }
        }
        catch (err) {
            console.log(err);
        }
    }

    close() {
        if (this.server !== null) {
            this.server.close(() => {
                // console.log('server closed');
                this.server = null;
            });
            for(const client of this.clients) client.end();
        } else if (this.client !== null) {
            this.client.end();
        }
    }

    connect(remote = {}) {
        try {
            if (this.client === null) {
                const dealer = () => {
                    // console.log(`client recv server ${this.client}`);

                    this.client.on('data', (buff) => this.recv(buff));
                    this.client.on('end', () => {console.log('end'); this.client.end()});
                    this.client.on('close', () => {console.log('close'); this.client = null});
                };

                const {port, addr, file} = remote;
                if (file !== undefined) this.client = net.createConnection(file, dealer);
                else if (port !== undefined || addr !== undefined) this.client = net.createConnection(port, addr, dealer);
                else throw new Error('ERROR: invalie pip config');
                this.remoteConfig = remote;

                process.on('exit', (code) => {
                    if (code !== 0) this.close();
                });

            }

        } catch (err) {
            console.log(err);
        }
    }

    send(name, data) {
        const tmp1 = Buffer.from(JSON.stringify({name:name, data:data}));
        const tmp2 = Buffer.alloc(4);
        tmp2.writeUInt32BE(tmp1.byteLength, 0);

        const buff = Buffer.concat([tmp2,tmp1], (tmp1.length + tmp2.length));

        if (!!this.client) {
            // console.log('client send to server');
            this.client.write(buff);
        }
        else if (!!this.server) {
            for (const client of this.clients) {
                // console.log('server send to client');
                client.write(buff);
            }
        }
    }

    recv(buff) {

        if (this.recvBuff !== null) {
            buff = Buffer.concat([this.recvBuff, buff], (this.recvBuff.length + buff.length));
            this.recvBuff = null;
        }

        let len = buff.readUInt32BE();
        while (len + 4 <= buff.length) {
            const data = JSON.parse(buff.toString('utf8', 4, len + 4));

            for (const listener of this.listeners) {
                if (data.name === listener.name) listener.deal.call(listener.target, data.data);
            }

            buff = buff.slice(len + 4);
            if (buff.length >= 4) len = buff.readUInt32BE();
        }

        if (buff.length > 0) {
            this.recvBuff = Buffer.from(buff);
        }

    }

    listenTo(name, deal, target) {
        this.listeners.push({name: name, deal:deal, target:target});
    }
}

module.exports = DataPipe;