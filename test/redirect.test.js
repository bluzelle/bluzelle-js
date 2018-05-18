const api = require('../api');
const http = require('http');
const reset = require('./reset');
const assert = require('assert');
const {killSwarm} = require('../test-daemon/swarmSetup');




// Run if not testing in browser
(typeof window === 'undefined' ? describe.skip : describe.skip)('redirect', () => {

    beforeEach(reset);

    if (process.env.daemonIntegration) {

        afterEach(killSwarm);

    } else {

        const followerPort = parseInt(process.env.port) + 1;
        let httpServer;

        before(async () => {

            // Here we're going to mock the daemon with a simple redirect message
            // to the real one.

            const proto_path = __dirname + '/../service.proto';

            const protocol = grpc.load(proto_path);


            const server = new grpc.Server();

            const CommandProcessors = {
                Create: (call, callback) => {

                    callback(null, {
                        response: {
                            ack: true
                        }
                    });

                }
            };

            server.addService(protocol.Bluzelle.service, CommandProcessors);
            server.bind('localhost:' + followerPort, grpc.ServerCredentials.createInsecure());
            server.start();


            ws.on('connect', connection =>
                connection.on('message', ({utf8Data: message}) => {

                    const id = JSON.parse(message)['request-id'];

                    connection.send(JSON.stringify({
                        'request-id': id,
                        error: 'NOT_THE_LEADER',
                        data: {
                            "leader-id": "137a8403-52ec-43b7-8083-91391d4c5e67",
                            "leader-host": "127.0.0.1",
                            "leader-port": 8100 // Proper emulator
                        }
                    }));
                }));
        });

        after(() => httpServer.close());
    }

    it('should follow a redirect and send the command to a different socket', async () => {

        api.connect(`${process.env.address}:${parseInt(process.env.port) + 1}`, '71e2cd35-b606-41e6-bb08-f20de30df76c');

        await api.create('hey', 123);
        assert(await api.read('hey') === 123);

    });

});
