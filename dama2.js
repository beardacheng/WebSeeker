'use strict';

const crypto = require('crypto');
const querystring = require('querystring');
const http = require('http');
const fs = require('fs');

const md5 = (str) => {
    const md5sum = crypto.createHash('md5');
    md5sum.update(str);
    return  md5sum.digest('hex');
};

const calcPwd = (name, passwd, key) => {
    // console.log(`${md5(key + md5(md5(name) + md5(passwd)))}`);
    return md5(key + md5(md5(name) + md5(passwd)));
};

const calcSign = (key, name, others) => {
    let buffs = [];
    let len = 0;

    const keyBuf = new Buffer(key);
    len += keyBuf.length;
    buffs.push(keyBuf);

    const nameBuf = new Buffer(name);
    len += nameBuf.length;
    buffs.push(nameBuf);

    if (others !== undefined) {
        for(const other of others) {
            let tmpBuf = null;
            if (typeof other === 'string') {
                tmpBuf = new Buffer(other);
            }
            else if (other instanceof Buffer) {
                tmpBuf = other;
            }
            else {
                continue;
            }

            len += tmpBuf.length;
            buffs.push(tmpBuf);
        }
    }

    return md5(Buffer.concat(buffs, len)).substr(0, 8);
};

const appID = '49806';
const user = 'test';
const password = 'test';
const key = 'ae1c727707d6bdd53c5934a10cb42ccb';

const getResult = (pic, type) => {
    return new Promise(function (resolve, reject) {
        if (!pic instanceof Buffer) {
            reject('file error');
            return;
        }

        const postData = querystring.stringify({
            'appID': appID,
            'user': user,
            'type': type,
            'pwd': calcPwd(user, password, key),
            'sign': calcSign(key, user, [pic]),
            'fileData': pic.toString('hex'),
        });

        const options = {
            hostname: 'api.dama2.com',
            port: 7766,
            path: '/app/d2File',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            // console.log(`STATUS: ${res.statusCode}`);
            // console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

            if (res.statusCode !== 200) {
                reject('api return code ' + res.statusCode);
                return;
            }

            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                console.log(`BODY: ${chunk}`);

                const ret = JSON.parse(chunk);
                if (ret.ret !== 0) {
                    reject('api return error ' + ret.ret);
                }
                else {
                    resolve(ret);
                }
            });
            res.on('end', () => {
                // console.log('No more data in response.');
            });
        });

        req.on('error', (e) => {
            reject('network error');
        });

        req.write(postData);
        req.end();
    });
};

const setError = (apiRet) => {
    const postData = querystring.stringify({
        'appID': appID,
        'user': user,
        'pwd': calcPwd(user, password, key),
        'id' : apiRet.id,
        'sign': calcSign(key, user, [apiRet.id.toString()]),
    });

    console.log(`${postData}`);

    const options = {
        hostname: 'api.dama2.com',
        port: 7766,
        path: '/app/d2ReportError',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const req = http.request(options, (res) => {
        // console.log(`STATUS: ${res.statusCode}`);
        // console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            console.log(`BODY: ${chunk}`);
        });
        res.on('end', () => {
            // console.log('No more data in response.');
        });
    });

    req.on('error', (e) => {
    });

    req.write(postData);
    req.end();
};

// getResult(fs.readFileSync('./y1.jpg'), '54').then((ret) => {
//     console.log(`${JSON.stringify(ret)}`);
//     setError(ret);
// }, (err) => {
//     console.log(`ERROR ${err}`);
// });

module.exports = {
    getResult, setError
};









