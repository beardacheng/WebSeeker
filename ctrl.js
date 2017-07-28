"use strict";



const fs = require('fs');
const child_process = require('child_process');

const showUsage = () => {
  console.log(`Usage : ${process.argv[0]} ${process.argv[1]} jsFile start|stop|restart`);
};

if (process.argv.length !== 4) {
    showUsage();
    process.exit(1);
}

const getJsFilename = (path) => {
    const t = path.split('/');
    const file = t[t.length - 1];
    return file.split('.')[0];
};

const command = process.argv[3];
const jsFile = process.argv[2];
const jsFileName = getJsFilename(jsFile);
const pidFile = `./${jsFileName}.pid`;

if (!fs.existsSync(jsFile)) {
    console.log(`${jsFile} not exist`);
    process.exit(1);
}

const stop = () => {
    const {pid, isRunning} = checkProcess();

    if (!isRunning) {
        console.log(`process is not running!`);
    } else {
        child_process.execSync(`kill -s INT ${pid}`);
        console.log(`stop process ${pid}`);
        fs.unlinkSync(pidFile);
    }
};

const checkProcess = () => {
    if (fs.existsSync(pidFile)) {
        const stat = fs.statSync(pidFile);
        if (stat.isFile()) {
            const pid = parseInt(fs.readFileSync(pidFile));
            try {
                child_process.execSync(`ps -p ${pid}`);

                //found
                return {pid, isRunning : true};
            } catch (err) {
                //not found
                fs.unlinkSync(pidFile);
            }
        }
    }
    return {pid : -1, isRunning : false};
};

const start = () => {
    const {pid, isRunning} = checkProcess();
    if (isRunning) {
        console.log(`process(${pid}) is running!`);
    }
    else {
        const out = fs.openSync(`./logs/${jsFileName}.log`, 'a');
        const err = fs.openSync(`./logs/${jsFileName}.log`, 'a');

        const child = child_process.spawn('node', [jsFile], {
            detached: true,
            stdio: [ 'ignore', out, err ]
        });

        //write pid to file
        fs.writeFileSync(pidFile, `${child.pid}`, {flag:'w'});

        child.unref();
        console.log(`process (${child.pid}) start`);
    }
};


switch (command) {
    case 'start':
    {
        start();
    }
    break;
    case 'stop':
    {
        stop();
    }
    break;
    case 'restart':
    {
        stop();
        start();
    }
    break;
    default:
        showUsage();
        break;
}
