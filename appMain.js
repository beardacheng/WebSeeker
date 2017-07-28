"use strict";



try {
    const vocation = require('./vocation/vocationApp');
    const User = require('./user');

    User.initFunc();
    vocation.run();
} catch (err) {
    console.log(err);
}

