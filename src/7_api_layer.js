const database_pb = require('../proto/database_pb');
const assert = require('assert');


module.exports = class API {

    constructor(sendOutgoingMsg) {

        this.sendOutgoingMsg = sendOutgoingMsg;

    }


    create(key, value) {

        return new Promise((resolve, reject) => {

            const msg = new database_pb.database_msg();

            const create = new database_pb.database_create();
            msg.setCreate(create);

            create.setKey(key);
            create.setValue(value);


            this.sendOutgoingMsg(msg, incoming_msg => {

                if(incoming_msg.hasError()) {

                    reject(new Error(incoming_msg.getError().getMessage()));

                }

                assert(incoming_msg.getResponseCase === null,
                    "A response other than error or ack has been returned from daemon.");

                resolve();

            });

        });

    }

};