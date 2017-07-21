'use strict';

const DataPipe = require('./dataPipe');

class globalData {
    sendToPipe(name, value) {
        if (this.pipe !== undefined) this.pipe.send(name, value);
    }

    recvFromPipe(name, deal, target) {
        if (this.pipe !== undefined) this.pipe.listenTo(name, deal, target);
    }

    createPipe(remote) {
        if (this.pipe !== undefined) {
            this.pipe.close();
        }
        this.pipe = new DataPipe();
        this.pipe.create(remote);
    }

    listenToPipe(remote) {
        if (this.pipe !== undefined) {
            this.pipe.close();
        }

        this.pipe = new DataPipe();
        this.pipe.connect(remote);
    }


}

module.exports = globalData;