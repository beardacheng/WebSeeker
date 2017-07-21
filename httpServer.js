"use strict";

const express = require('express');
const bodyParser = require('body-parser');

let server = null;
let cmd = null;

module.exports = {
    init : function (port) {
        if (server === null) {
            server = express();
            server.listen(port);

            cmd = express();
            server.use('/cmd', cmd);
        }
    },

    //use age addCmd('cmd name', dealfunc, this);
    // dealfunc : para(req) return (res)
    addCmd : function (name, deal, target) {
        const newCmd = express();
        newCmd.use(bodyParser.json());
        newCmd.use(bodyParser.urlencoded({ extended: true }));
        cmd.use('/' + name, newCmd);

        newCmd.all('/', function(req, res) {
            res.json(deal.call(target, req.body));
        });

    },
};
