'use strict';

const fs = require('fs');
const path = './config/config.json';

let config = null;

if (config === null) {
    config = JSON.parse(fs.readFileSync(path, 'utf8'));
}

module.exports = config;

