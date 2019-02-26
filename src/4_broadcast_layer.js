// Copyright (C) 2019 Bluzelle
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


const assert = require('assert');
const database_pb = require('../proto/database_pb');
const bluzelle_pb = require('../proto/bluzelle_pb');
const status_pb = require('../proto/status_pb');


module.exports = class Broadcast {

    constructor({p2p_latency_bound, connection_layer, onIncomingMsg, onOutgoingMsg}) {

        this.onIncomingMsg = onIncomingMsg;
        this.onOutgoingMsg = onOutgoingMsg;

        this.p2p_latency_bound = p2p_latency_bound;
        this.connection_layer = connection_layer;

        this.timeout = p2p_latency_bound * 15;

        this.timeoutFns = new Map();

    }


    sendOutgoingMsg(msg) {

        assert(msg instanceof database_pb.database_msg || msg instanceof status_pb.status_request);

        if(msg instanceof database_pb.database_msg) {

            const nonce = msg.getHeader().getNonce();
            setTimeout(() => {
                
                this.timeoutFns.get(nonce)();
                this.timeoutFns.delete(nonce);

            }, this.timeout);


            // This gets overwritten when the messages comes back
            // so a properly-responded message does not execute a broadcast

            this.timeoutFns.set(nonce, () => {

                // trigger a broadcast
                broadcast(msg);

            }); 

        } 

        this.onOutgoingMsg(msg);

    }


    sendIncomingMsg(msg) {

        assert(msg instanceof database_pb.database_response || msg instanceof status_pb.status_response);

        if(msg instanceof database_pb.database_response) {

            const nonce = msg.getHeader().getNonce();
            this.timeoutFns.has(nonce) && this.timeoutFns.set(nonce, () => {});

        }

        this.onIncomingMsg(msg);

    }

};