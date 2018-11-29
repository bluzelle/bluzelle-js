// Copyright (C) 2018 Bluzelle
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License, version 3,
// as published by the Free Software Foundation.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.


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