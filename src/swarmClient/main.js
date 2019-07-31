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


const {Connection} = require('./01_connection_layer');
const Serialization = require('./02_serialization_layer');
const Verify = require('./03_crypto_verify_layer');
const Collation = require('./04_collation_layer');
const Broadcast = require('./05_broadcast_layer');
const Redirect = require('./06_redirect_layer');
const Sign = require('./07_crypto_sign_layer');
const Envelope = require('./08_envelope_layer');
const Metadata = require('./09_metadata_layer');
const API = require('./10_api_layer');

const WebSocket = require('isomorphic-ws');
const assert = require('assert');


module.exports = {
    swarmClient: async ({private_pem, public_pem, uuid, swarm_id, peerslist, log, logDetailed, p2p_latency_bound, onclose}) => {

        p2p_latency_bound = p2p_latency_bound || 100;

        onclose = (onclose && once(onclose)) || (() => {});


        const [ws, entry_uuid, entry_obj] = await fastest_peer(peerslist, log);
        ws.addEventListener('close', () => onclose());


        const connection_layer = new Connection({ 
            ws,
            log, 
            logDetailed,
        });

        const broadcast_layer = new Broadcast({ 
            p2p_latency_bound, 
            peerslist, 
            connection_layer, 
            log, });


        const layers = [

            connection_layer,

            new Serialization({}),
            new Verify({ private_pem, public_pem, log, }), 
            new Collation({ peerslist, log, }), 

            broadcast_layer,

            new Redirect({}),
            new Sign({ private_pem, public_pem, log, }), 
            new Envelope({ swarm_id }),
            new Metadata({ uuid: uuid || public_pem, log, point_of_contact: entry_uuid }),

        ];


        const sandwich = connect_layers(layers);

        const api = new API(sandwich.sendOutgoingMsg);
        

        api.close = () => {
            connection_layer.close();
            broadcast_layer.close();
        }

        api.swarm_id = swarm_id;
        api.entry_uuid = entry_uuid;
        api.entry_obj = entry_obj;


        return api;

    },
};


const connect_layers = layers => {

    layers.forEach((layer, i) => {

        const precedessor = 
            i === 0 ? 
                undefined : 
                layers[i - 1];

        const successor = 
            i === layers.length - 1 ? 
                undefined : 
                layers[i + 1];


        if(precedessor) {
            layer.onOutgoingMsg = precedessor.sendOutgoingMsg.bind(precedessor);
        }

        if(successor) {
            layer.onIncomingMsg = successor.sendIncomingMsg.bind(successor);
        }

    });


    const last = layers[layers.length - 1];

    return {
        sendOutgoingMsg: last.sendOutgoingMsg.bind(last)
    };

};


// runs function only once
const once = f => {

    let called = false;

    return (...args) => {

        if(!called) {

            f(...args);
            called = true;

        }        

    }

};  



const fastest_peer = async (peerslist, log) => {

    const entries = Object.entries(peerslist);

    let sockets = entries.map(([_, obj]) => 'ws://' + obj.nodeHost + ':' + obj.nodePort);


    const WS = entry => {

        const ws = new WebSocket(entry);
        ws.binaryType = 'arraybuffer';

        const error_listener = e => {log && log('WS Error: ' + e.message)};

        // hide errors
        ws.addEventListener('error', error_listener);


        const p = new Promise((res, rej) => {
        
            ws.addEventListener('open', () => {

                // ws.removeEventListener('error', error_listener);
                res(ws);

            });

        });

        p.socket = ws;


        return p;

    };


    sockets = sockets.map(WS);

    const ws = await Promise.race(sockets);

    sockets = sockets.map(s => s.socket);


    // close the failures
    sockets.forEach(w => (w !== ws) && 
        w.readyState === 1 ? 
            w.close() : 
            w.addEventListener('open', () => w.close()));


    const [entry_uuid, entry_obj] = entries[sockets.indexOf(ws)];

    return [ws, entry_uuid, entry_obj];

};