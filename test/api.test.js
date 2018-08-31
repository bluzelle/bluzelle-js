const reset = require('./reset');
const api = require('../lib/bluzelle.node');
const assert = require('assert');
const {isEqual} = require('lodash');

const {despawnSwarm, swarm} = require('../test-daemon/setup');


describe('bluzelle api', () => {

    beforeEach(reset);

    process.env.daemonIntegration && afterEach(despawnSwarm);

    beforeEach(() =>
        api.connect(`ws://${process.env.address}:${process.env.daemonIntegration ? swarm.list[swarm.leader] : 8100}`, '71e2cd35-b606-41e6-bb08-f20de30df76c'));


    const isEqual = (a, b) =>
        a.length === b.length && !a.some((v, i) => b[i] !== v);


    it('should be able to connect', () => {});

    it('should not be able to connect many times', () => {

        const url = `ws://${process.env.address}:${process.env.daemonIntegration ? swarm.list[swarm.leader] : 8100}`,
            uuid = '71e2cd35-b606-41e6-bb08-f20de30df76c';

        api.connect(url, uuid).then(
            () => { throw new Error('Should have failed'); },
            () => {});
    
    });


    it('should be able to connect after a disconnect', async () => {

        api.disconnect();

        await api.connect(`ws://${process.env.address}:${process.env.daemonIntegration ? swarm.list[swarm.leader] : 8100}`, '71e2cd35-b606-41e6-bb08-f20de30df76c');

    });



    it('should get an empty list of keys', async () => {

        assert((await api.keys()).length === 0);

    });


    it('should be able to get a list of keys', async () => {

        await api.create('hello123', '10');
        await api.create('test', '11');

        let sortedResult = (await api.keys()).sort();

        assert(isEqual(sortedResult, (['test', 'hello123']).sort()));
        assert(!isEqual(sortedResult, (['blah', 'bli']).sort()));

    });


    it('should be able to create and read text fields', async () => {

        await api.create('myOtherKey', "hello world");
        assert(await api.read('myOtherKey') === "hello world");


        await api.create('interestingString', "aGVsbG8gd29ybGQNCg==");
        assert(await api.read('interestingString') === "aGVsbG8gd29ybGQNCg==");

    });

    it('should reject bad connections', done => {

        api.disconnect();

        api.connect('fdsfdas', 'fdsafsd').catch(() => done());

    });

    it('should reject connection to a bad port', done => {

        api.connect('ws://localhost:123', '71e2cd35-b606-41e6-bb08-f20de30df76c')
            .catch(() => done());

    });

    it('should be able to query if the database has a key', async () => {

        await api.create('myKey', 'abc');
        assert(await api.has('myKey'));
        assert(!await api.has('someOtherKey'));

    });

    it('should be able to remove a key', async () => {

        await api.create('myKey', 'abc');
        await api.remove('myKey');
        assert(!await api.has('myKey'));

    });

    it('should be able to return size', async () => {
        assert(await api.size() >= 0);
    });

    it('should throw an error when trying to read a non-existent key', done => {

        api.read('abc123').catch(() => done());

    });

    it('should throw an error when trying to remove a non-existent key', done => {

        api.remove('something').catch(() => done());

    });

    it('should throw an error when creating the same key twice', done => {

        api.create('mykey', '123').then(() => {

            api.create('mykey', '321').catch(() => done());

        });
    });

    it('should throw an error when trying to update a non-existent key', done => {

        api.update('something', '123').catch(() => done());

    });

    it('should return size > 0 when db is not empty', async () => {

        await api.create('myKey', '123');
        assert((await api.size()) > 0);

    });


    it('should return size 0 when db is empty', async () => {

        assert((await api.size()) === 0);

    });


    it('should be able to subscribe to a key', async () => {

        let observedValue;

        await api.subscribe('test key', v => { observedValue = v; });


        await api.create('test key', '100');


        assert(observedValue === '100');

        await api.update('test key', 'whence');

        assert(observedValue === 'whence');

    });


    it('should throw an error when subscribing twice', done => {

        api.subscribe('abc').then(() => {

            api.subscribe('abc').catch(() => done());

        });

    });


    it('should be able to unsubscribe from a key', async () => {

        let called;


        await api.subscribe('thence', v => { called = true; });

        await api.unsubscribe('thence');

        await api.create('thence', 'whence');

        assert(!called);

    });


    it('should throw an error when unsubscribing from a key where there is no subscription', done => {

        api.unsubscribe('my sharona').catch(() => done());

    });

});
