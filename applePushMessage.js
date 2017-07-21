"use strict";

const apn = require('apn');
const _ = require('lodash');

const options = {
    token: {
        key: "./keys/AuthKey_J25H62JXPZ.p8",
        keyId: "J25H62JXPZ",
        teamId: "S6TJT95DE7"
    },
    production: false
};

module.exports = function () {
    const apnProvider = new apn.Provider(options);

    process.on('exit', () => {
        if (client !== null) {
            apnProvider.shutdown();
        }
        console.log('apn quit');
    });

    return {
        sendMessage : function(alert, payload, tokens) {
            const note = new apn.Notification();

            note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
            note.badge = 1;
            note.sound = "ping.aiff";
            note.topic = "com.beardacheng.SavingMoney";

            note.alert = alert;
            note.payload = payload;

            //return fail token array with promise
            /*
            let deviceToken = "02392c718dbce762669f159311456dffadbc7595293493888dc54658d0313c88";
            apnProvider.send(note, [deviceToken, deviceToken]).then( (result) => {
                console.log(`send result: ${JSON.stringify(result)}`)

            });
            */

            return apnProvider.send(note, tokens).then( (result) => {

                //失败
                // {
                //     "sent"
                // :
                //     [], "failed"
                // :
                //     [{
                //         "device": "69950dd1f35c6c7b17365d852eff0e7d68ad8be9b34ab6ba6fe44763ad0d5930",
                //         "status": "400",
                //         "response": {"reason": "BadDeviceToken"}
                //     }, {
                //         "device": "69950dd1f35c6c7b17365d852eff0e7d68ad8be9b34ab6ba6fe44763ad0d5930",
                //         "status": "400",
                //         "response": {"reason": "BadDeviceToken"}
                //     }]
                // }
                //成功
                // {
                //     "sent":
                //     [
                //         {"device": "02392c718dbce762669f159311456dffadbc7595293493888dc54658d0313c89"},
                //         {"device": "02392c718dbce762669f159311456dffadbc7595293493888dc54658d0313c89"}
                //     ],
                //         "failed":[]
                // }

                return _.map(result.failed, "device");
            });
        },
    };
}();