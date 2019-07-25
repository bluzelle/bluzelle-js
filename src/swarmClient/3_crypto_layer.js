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


module.exports = class Crypto {

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

            this.onOutgoingMsg(bzn_envelope);
            return;
        }

        
        // quickreads are not signed
        const isQuickread = msg.hasQuickRead();

        bzn_envelope.setDatabaseMsg(msg.serializeBinary());


        if(!isQuickread) {

            bzn_envelope.setSender(this.public_pem.split('\n').slice(1, 3).join(''));

            const signed_bin = Buffer.concat([
                bzn_envelope.getSender(), 
                bzn_envelope.getPayloadCase(),                 
                Buffer.from(bzn_envelope.getDatabaseMsg()),
                bzn_envelope.getTimestamp()
            ].map(deterministic_serialize));


            const s = crypto.createSign('sha256');

            s.update(signed_bin);

            const sig = s.sign(this.private_pem, 'base64');

            bzn_envelope.setSignature(new Uint8Array(Buffer.from(sig, 'base64')));

        }



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


        const v = crypto.createVerify('sha256');

        v.update(signed_bin);

        const sender = '-----BEGIN PUBLIC KEY-----\n' + 
            bzn_envelope.getSender().match(/.{1,64}/g).join('\n') + 
            '\n-----END PUBLIC KEY-----';

      
        if(!v.verify(sender, bzn_envelope.getSignature(), 'base64')) {            
            this.log && this.log('Bluzelle: signature failed to verify: ' + Buffer.from(bin).toString('hex'));
            return;
        }

        this.onIncomingMsg(bzn_envelope);

    }

};


// see crypto.cpp in daemon

const deterministic_serialize = obj => {

    if(obj instanceof Buffer) {

        return Buffer.concat([
            Buffer.from(obj.length.toString() + '|', 'ascii'),
            obj
        ]);

    }


    // numbers and strings

    return Buffer.from(obj.toString().length + '|' + obj.toString(), 'ascii');

};
