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



module.exports = class Collation {

    constructor({onIncomingMsg, onOutgoingMsg, connection_layer}) {

        this.onIncomingMsg = onIncomingMsg;
        this.onOutgoingMsg = onOutgoingMsg;


        // Queue messages when we don't have the node uuid in socket_info
        this.outgoingQueue = [];

        // Queue messages that are awaiting signatures
        this.incomingQueue = [];

        // Maps messages to the number of signatures they have accumulated
        this.nonceMap = new Map();


        this.connection_layer = connection_layer;

        this.connection_layer.socket_info.observe(v => {
            const q = this.outgoingQueue;
            this.outgoingQueue = [];
            q.forEach(msg => this.sendOutgoingMsg(msg));
        });


        this.f;

    }


    sendOutgoingMsg(msg) {

        assert(msg instanceof database_pb.database_msg || msg instanceof status_pb.status_request);


        // Skip status requests

        if(msg instanceof status_pb.status_request) {
            this.onOutgoingMsg(msg);
            return;
        }


        if(!this.connection_layer.socket_info.get()) {

            // Without the necessary metadata, queue the message

            this.outgoingQueue.push(msg);

        } else {

            const node_uuid = this.connection_layer.socket_info.get().uuid;
            msg.getHeader().setPointOfContact(node_uuid);

            this.onOutgoingMsg(msg);

        }

    }


    sendIncomingMsg(msg) {

        assert(msg instanceof database_pb.database_response || msg instanceof status_pb.status_response);

        if(msg instanceof status_pb.status_response) {


            // Collation logic: update number of required signatures
            // f = floor( |peers list] / 3 ) + 1

            const num_peers = JSON.parse(msg.toObject().moduleStatusJson).module[0].status.peer_index.length;
            this.f = Math.floor(num_peers / 3) + 1;

            this.onIncomingMsg(msg);


        } else {

            // Collation logic: increment the signature counter and resolve when we have received enough

            const header = msg.getHeader();

            // this.onIncomingMsg(msg);

        }

    }

};