//
// Copyright (C) 2019 Bluzelle
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


const assert = require('assert');
const crypto = require('isomorphic-crypto');
const bluzelle_pb = require('../../proto/bluzelle_pb');
const database_pb = require('../../proto/database_pb');
const status_pb = require('../../proto/status_pb');
const {deterministic_serialize} = require('./serialize');
const {format_private} = require('./crypto');




module.exports = class CryptoSign {

    constructor({private_pem, public_pem, onIncomingMsg, onOutgoingMsg, log}) {

        this.log = log;

        this.private_pem = private_pem;
        this.public_pem = public_pem;

        this.onIncomingMsg = onIncomingMsg;
        this.onOutgoingMsg = onOutgoingMsg;

    }


    sendOutgoingMsg(bzn_envelope, msg) {

        assert(bzn_envelope instanceof bluzelle_pb.bzn_envelope);


        // Skip status requests

        if(msg instanceof status_pb.status_request) {

            bzn_envelope.setStatusRequest(msg.serializeBinary());

            this.onOutgoingMsg(bzn_envelope, msg);
            return;
        }

        
        // quickreads are not signed
        const isQuickread = msg.hasQuickRead();

        bzn_envelope.setDatabaseMsg(msg.serializeBinary());


        if(isQuickread) {
            this.onOutgoingMsg(bzn_envelope, msg);
            return;
        }


        bzn_envelope.setSender(this.public_pem);

        const signed_bin = Buffer.concat([
            bzn_envelope.getSender(), 
            bzn_envelope.getPayloadCase(),                 
            Buffer.from(bzn_envelope.getDatabaseMsg()),
            bzn_envelope.getTimestamp()
        ].map(deterministic_serialize));


        let sig;

        try {

            const s = crypto.createSign('sha256');

            s.update(signed_bin);

            sig = s.sign(format_private(this.private_pem));

        } catch(e) {

            const db_msg = new database_pb.database_msg();
            bs_msg.setError('Cryptographic signature failed; ' + e.message);

            bzn_envelope.setDatabaseMsg(db_msg);

            this.sendIncomingMsg(bzn_envelope);

        }


        bzn_envelope.setSignature(new Uint8Array(sig));


        this.onOutgoingMsg(bzn_envelope, msg);

    }


    sendIncomingMsg(bzn_envelope) {

        assert(bzn_envelope instanceof bluzelle_pb.bzn_envelope);

        // pass through

        this.onIncomingMsg(bzn_envelope);

    }

};


