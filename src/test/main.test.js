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

const {bluzelle, version} = require('../main');
const assert = require('assert');

const {ethereum_rpc, contract_address} = require('./connection_config');


// assert.rejects polyfill (doesn't work in browser for some reason)
assert.rejects = assert.rejects || (async (p, e) => {

    try {
        await p;
        return Promise.reject(new Error('expected rejection'));
    } catch(e2) {
        e && e.message && assert.equal(e.message, e2.message);
        return Promise.resolve();
    }

});


const log = true;
const logDetailed = true;


// these mirror the keys in scripts/run-swarms.rb
const master_pub_key = "-----BEGIN PUBLIC KEY-----\n\
MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEE/Yeq9sYdyeou+TnNEJjMnuntrzqcFIf\n\
IHd49LW461d55TY4hVX66ZXXGvAWRqMVMeELtYuKGYU44bPaxTb1ig==\n\
-----END PUBLIC KEY-----";

const master_priv_key = "-----BEGIN EC PRIVATE KEY-----\n\
MHQCAQEEIEOd7E9zSxgJjtpGzK/gHl0vVSOZ2iF3TY50InD67BnHoAcGBSuBBAAK\n\
oUQDQgAEE/Yeq9sYdyeou+TnNEJjMnuntrzqcFIfIHd49LW461d55TY4hVX66ZXX\n\
GvAWRqMVMeELtYuKGYU44bPaxTb1ig==\n\
-----END EC PRIVATE KEY-----";


describe('Secret master key database creation', () => {
   

    it('DB operations with master key', async () => {

        const apis = await bluzelle({
            ethereum_rpc, 
            contract_address,

            private_pem: master_priv_key,
            public_pem: master_pub_key,

            uuid: Math.random().toString(),
            log,
            logDetailed,

            _connect_to_all: true
        });


        assert(!await apis[0]._hasDB());

        await apis[0]._createDB();

        await assert.rejects(apis[0]._createDB());

        assert(await apis[0]._hasDB());

        await apis[0]._deleteDB();

        assert(!await apis[0]._hasDB());


        apis.forEach(api => api.close());

    });

});


it('version', () => {

    assert(typeof version === 'string');
    assert(version.length > 0);

});



describe('api', function() {
    this.timeout(5000);

    let uuid, bz;

    beforeEach(async () => {

        // create the database 
        uuid = Math.random().toString();

        const apis = await bluzelle({
            ethereum_rpc, 
            contract_address,

            private_pem: master_priv_key,
            public_pem: master_pub_key,

            uuid,
            log,
            logDetailed,

            _connect_to_all: true
        });

        await apis[0]._createDB();

        apis.forEach(api => api.close());


        // open a fresh client
        bz = await bluzelle({
            ethereum_rpc, 
            contract_address,

            private_pem: master_priv_key,
            public_pem: master_pub_key,

            uuid,
            log,
            logDetailed,
        });

    });

    afterEach(() => bz.close());



    it('create and read', async () => {

        await bz.create('hello', 'world');

        await assert.rejects(bz.create('hello', 'whence'));

        assert.equal(await bz.read('hello'), 'world');

        assert.equal(await bz.quickread('hello'), 'world');

    });



    it('update', async () => {

        await assert.rejects(bz.update('hello', 'whence'));

        await bz.create('hello', 'world');

        await bz.update('hello', 'earth');

        assert.equal(await bz.read('hello'), 'earth');

    });


    it('has', async () => {

        assert(!await bz.has('hello'));

        await bz.create('hello', 'world');

        assert(await bz.has('hello'));

    });



    it('delete', async () => {

        await assert.rejects(bz.delete('hello'));

        await bz.create('hello', 'world');

        await bz.delete('hello');

        assert(!await bz.has('hello'));

    });


    it('size', async () => {

        assert.deepEqual(await bz.size(), {
            bytes: 0,
            keys: 0,
            maxSize: 0,
            remainingBytes: 0
        });

        await bz.create('this', 'that');

        const sz = await bz.size();
        assert(sz.bytes > 0);
        assert(sz.keys === 1);
        assert(sz.remainingBytes === 0);

    });


    it('keys', async () => {    

        assert.deepEqual(await bz.keys(), []);

        await bz.create('a', 'b');

        assert.deepEqual(await bz.keys(), ['a']);
        
    });


    it('ttl with create', async () => {

        await bz.create('1', '2', 1);
        assert.equal(await bz.read('1'),'2');

        assert(await bz.ttl('1') > 0);

        await new Promise(resolve => setTimeout(resolve, 2000));

        await assert.rejects(bz.read('1'));

    });

    it('ttl with expire & persist', async () => {
        
        await bz.create('3', '4');

        await assert.rejects(bz.ttl('3'));
        await assert.rejects(bz.persist('3'));


        await bz.expire('3', 10);

        assert(await bz.ttl('3') > 0);

        await bz.persist('3');

        await assert.rejects(bz.ttl('3'));

    });


    it('changing expiry', async () => {

        await bz.create('4', '5', 6)
        await bz.expire('4', 10)

    });


    it('status', async () => {

        const status = await bz.status();

        assert(status.swarmGitCommit);
        assert(status.uptime);

    });

    


    it.skip('writers', async () => {

        assert.deepEqual(
            await bz._getWriters(), 
            {
                owner: master_pub_key,
                writers: []
            }
        );


        const writers = [
            'MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEndHOcS6bE1P9xjS/U+SM2a1GbQpPuH9sWNWtNYxZr0JcF+sCS2zsD+xlCcbrRXDZtfeDmgD9tHdWhcZKIy8ejQ==',
            'MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAE2cEPEoomeszFPuHzo2q45mfFkipLSCqc+pMlHCsGnZ5rJ4Bo27SZncCmwoazcYjoV9DjJjqi+p7IfSPRZCygaQ=='
        ];

        await bz._addWriters(writers);

        const writers_output = (await bz._getWriters()).writers;

        assert(writers_output.length === 2);
        assert(writers_output.includes(writers[0]));
        assert(writers_output.includes(writers[1]));


        // No duplicates 

        await bz._addWriters(writers);

        assert((await bz._getWriters()).writers.length === 2);


        await bz._deleteWriters(writers[0]);

        assert.deepEqual(
            await bz._getWriters(),
            {
                owner: master_pub_key,
                writers: [writers[1]]
            }
        );

        bz.close();

    });


    // The following two tests don't actually require any networking

    it('type assertions', async () => {

        assert.throws(() => bz.create('hello', 3));
        assert.throws(() => bz.addWriters(3));
        assert.throws(() => bz.addWriters(['w1', 'w2', {}]));

        bz.close();

    });


    it('onclose', async () => {

        let closed = false;

        const bz2 = await bluzelle({
            ethereum_rpc, 
            contract_address,

            private_pem: master_priv_key,
            public_pem: master_pub_key,

            uuid,
            log,
            logDetailed,

            onclose: () => { closed = true; }
        });

        bz2.close();

        await new Promise(r => setTimeout(r, 50));

        assert(closed);

    });


    it('timeout', async () => {

        // 1ms timeout should reject before doing anything
        await assert.rejects(bz.create('a', 'b').timeout(1));

    });

});