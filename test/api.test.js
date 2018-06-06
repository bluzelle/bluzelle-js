const reset = require('./reset');
const api = require('../api');
const assert = require('assert');
const {killSwarm} = require('../test-daemon/swarmSetup');


describe('bluzelle api', () => {

    beforeEach(reset);

    process.env.daemonIntegration && afterEach(killSwarm);

    beforeEach(() =>
        api.connect(`ws://${process.env.address}:${process.env.port}`, '71e2cd35-b606-41e6-bb08-f20de30df76c'));


    const isEqual = (a, b) =>
        a.length === b.length && !a.some((v, i) => b[i] !== v);

    it('should be able to connect many times', () => {

        api.connect(`ws://${process.env.address}:${process.env.port}`, '71e2cd35-b606-41e6-bb08-f20de30df76c');
        api.connect(`ws://${process.env.address}:${process.env.port}`, '71e2cd35-b606-41e6-bb08-f20de30df76c');
        api.connect(`ws://${process.env.address}:${process.env.port}`, '71e2cd35-b606-41e6-bb08-f20de30df76c');

    });

    it('should be able to get a list of keys', async () => {

        await api.create('hello123', 10);
        await api.create('test', 11);

        let sortedResult = (await api.keys()).sort();

        assert(isEqual(sortedResult, (['test','hello123']).sort()));
        assert(!isEqual(sortedResult, (['blah', 'bli']).sort()));

    });

    it('should be able to create and read number fields', async () => {
        await api.create('myKey', 123);
        assert(await api.read('myKey') === 123);

    });

    it('should be able to create and read text fields', async () => {

        await api.create('myOtherKey', "hello world");
        assert(await api.read('myOtherKey') === "hello world");


        await api.create('interestingString', "aGVsbG8gd29ybGQNCg==");
        assert(await api.read('interestingString') === "aGVsbG8gd29ybGQNCg==");

    });

    it('should be able to create and read object fields', async () => {

        await api.create('myObjKey', { a: 5 });
        assert((await api.read('myObjKey')).a === 5);

    });

    describe.only('max value', () => {

        context('writing 225000 bytes', () => {

            it('should throw VALUE_SIZE_TOO_LARGE', done => {

                let str = '0'.repeat(225000);

                api.create('key', str)
                    .catch(err => {
                        if (err.toString().includes('Error: VALUE_SIZE_TOO_LARGE')) {
                            done();
                        }
                    });

            });

        });

        context('writing 224000 bytes', () => {

            it('should not throw an error', done => {

                let str = '0'.repeat(224000);

                api.create('key', str)
                    .then(() => done())
                    .catch(err => {
                        if (err) {
                            console.log(err);
                        }
                    });

            })

        });

    });

});
