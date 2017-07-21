"use strict";

const vocation = require('./vocation/vocationApp');
const User = require('./user');

User.initFunc();
vocation.run();
