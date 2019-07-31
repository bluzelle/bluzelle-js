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
const {format_public} = require('./crypto');


module.exports = class CryptoVerify {

    constructor({private_pem, public_pem, onIncomingMsg, onOutgoingMsg, log}) {

        this.log = log;

        this.private_pem = private_pem;
        this.public_pem = public_pem;

        this.onIncomingMsg = onIncomingMsg;
        this.onOutgoingMsg = onOutgoingMsg;

    }


    sendOutgoingMsg(bzn_envelope, msg) {

        assert(bzn_envelope instanceof bluzelle_pb.bzn_envelope);

        // pass through

        this.onOutgoingMsg(bzn_envelope);

    }


    sendIncomingMsg(bzn_envelope) {

        assert(bzn_envelope instanceof bluzelle_pb.bzn_envelope);


        // Verification of incoming messages

        const payload = 
            bzn_envelope.hasDatabaseResponse() ? 
                bzn_envelope.getDatabaseResponse() : 
                bzn_envelope.getStatusResponse();

        const signed_bin = Buffer.concat([
            bzn_envelope.getSender(), 
            bzn_envelope.getPayloadCase(), 
            Buffer.from(payload), 
            bzn_envelope.getTimestamp()
        ].map(deterministic_serialize));



        // quickreads skip verification
        if(bzn_envelope.hasDatabaseResponse()) {
            
            const database_response = database_pb.database_response.deserializeBinary(new Uint8Array(bzn_envelope.getDatabaseResponse()));

            if(database_response.hasQuickRead()) {
                this.onIncomingMsg(bzn_envelope);
                return;
            }
        }   


        const sender = format_public(bzn_envelope.getSender());


        let verification;

        try {

            const v = crypto.createVerify('sha256');

            v.update(signed_bin);

            verification = v.verify(sender, bzn_envelope.getSignature(), 'base64');

        } catch(e) {   

            // This block runs when there is a problem with something like key formatting

            this.log && this.log('Cryptographic verification error; ' + e.message);

            verification = false;

        }


      
        if(!verification) {            
            this.log && this.log('Bluzelle: signature failed to verify: ' + Buffer.from(bin).toString('hex'));
            return;
        }

        this.onIncomingMsg(bzn_envelope);

    }

};
