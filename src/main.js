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

const {swarmClient} = require('./swarmClient/main');
const default_peerslist_endpoint = require('../default_peerslist_endpoint');
require('isomorphic-fetch');


module.exports = {

    bluzelle: async ({peerslist_endpoint, _connect_to_all, log, ...args}) => {
        
        peerslist_endpoint = peerslist_endpoint || default_peerslist_endpoint;
    


        // Add timestamp to logs
        const timestamp = () => {
            const d = new Date();
            return '[' + d.getMinutes().toString().padStart(2, '0') + ':' + 
                         d.getSeconds().toString().padStart(2, '0') + ':' + 
                         d.getMilliseconds().toString().padEnd(3, '0') + '] ';
        };


        if(log) {   

            // Default log is console.log, but you can pass any other function.
            if(typeof log !== 'function') {
                log = console.log.bind(console);
            }

            const log_ = log;
            log = ((a, ...args) => log_(timestamp() + a, ...args));;

        }



        // fetch peerslist data

        let swarms = await getSwarms(peerslist_endpoint);

        log && log('ESR swarms:', JSON.stringify(swarms, null, 4));

        swarms = Object.entries(swarms).map(([swarm_id, swarm]) =>
            swarmClient({
                peerslist: swarm.peers,
                swarm_id,
                log,
                ...args
            }));



        // instead of rejecting, resolve with undefined
        const resolveAnyCase = p => new Promise(r => p.then(r, e => console.error(e) || r()));

        // wait for swarms to open
        swarms = await Promise.all(swarms.map(resolveAnyCase));


        // filter dead swarms
        swarms = swarms.filter(p => p !== 'undefined');


        if(_connect_to_all) {
            return swarms;
        }


        const resolveIfTruthy = p => new Promise(res => p.then(v => v && res(v)));
        const resolveIfFalsy = p => new Promise(res => p.then(v => v || res(v)));


        const hasDbs = swarms.map(swarm => swarm._hasDB().catch(() => {}));

        const hasDbSwarms = hasDbs.map((hasDB, i) => promise_const(resolveIfTruthy(hasDB), swarms[i]));

        // resolves with swarm client if uuid exists
        const swarm_with_uuid = Promise.race(hasDbSwarms);


        // resolves to false if uuid doesn't exist
        const uuid_doesnt_exist = promise_const(Promise.all(hasDbs.map(resolveIfFalsy)), false);


        const swarm = await Promise.race([swarm_with_uuid, uuid_doesnt_exist]);

        if(!swarm) {

            throw new Error('UUID does not exist in the Bluzelle swarm. Contact us at https://gitter.im/bluzelle/Lobby.');

        }


        log && log('Swarm "' + swarm.swarm_id + '" selected.');
        log && log('Main entry selected.' + JSON.stringify(swarm.entry_obj));



        // close all other swarms & return client

        swarms.forEach(s => s !== swarm && s.close());

        return swarm;

    },

    version: require('../package.json').version

};


const promise_const = async (p, v) => {
    await p;
    return v;
};

const getSwarms = async peerslist_endpoint => {
    
    return (await fetch(peerslist_endpoint)).json();

};