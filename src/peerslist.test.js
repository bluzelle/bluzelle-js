const {getSwarms} = require('./peerslist');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const assert = require('assert');


const cpr_port = process.env.PORT || 8080;

console.log('using port ' + cpr_port + '; run "PORT=xxxx npm run test-node" to change cpr mock port');


const sample_JSON = '{ "a": 123 }';

describe('peerslist tests', () => {


    let server;

    before(() => {

        server = http.createServer((req, res) => {

            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end(sample_JSON);

        }).listen(cpr_port);

    });

    after(() => {

        server.close();

    });



    it('should download a peerslist in the provided format', async () => {

        assert.deepEqual(await getSwarms('http://localhost:' + cpr_port), JSON.parse(sample_JSON));

    });

});