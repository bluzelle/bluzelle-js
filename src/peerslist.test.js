const {getSwarms} = require('./peerslist');

const { spawn } = require('child_process');

const http = require('http');

const fs = require('fs');

const assert = require('assert');


const sample_JSON = '{ "a": 123 }';

describe('peerslist tests', () => {


    let server;

    before(() => {

        server = http.createServer((req, res) => {

            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end(sample_JSON);

        }).listen(8080);

    });

    after(() => {

        server.close();

    });



    it('should download a peerslist in the provided format', async () => {

        assert.deepEqual(await getSwarms('http://localhost:8080'), JSON.parse(sample_JSON));

    });

});