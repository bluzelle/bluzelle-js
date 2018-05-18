
const grpc = require('grpc');

const proto_path = __dirname + '/service.proto';

const protocol = grpc.load(proto_path);


const server = new grpc.Server();

server.addService(protocol.Bluzelle.service, { 
    Create, 
    Read,
    Update,
    Delete,
    Has,
    Keys,
    Size,
    RaftState
});
server.bind('127.0.0.1:8100', grpc.ServerCredentials.createInsecure());
server.start();


function Create(call, callback) {

    const key = call.request.key;
    const value = call.request.value;

    console.log('Create, key: ' + key + '/value: ' + value);

    callback(null, {
        response: {
            ack: true
        }
    });

}

function Read(call, callback) {

    const key = call.request.key;

    console.log('Read, key: ' + key);

    callback(null, {
        value: '123'
    });

}

function Update(call, callback) {

    const key = call.request.key;

    console.log('Update, key: ' + key + '/value: ' + value);

    callback(null, {
        response: {
            ack: true
        }
    });

}


function Delete(call, callback) {

    const key = call.request.key;

    console.log('Delete, key: ' + key);

    callback(null, {
        response: {
            ack: true
        }
    });

}

function Has(call, callback) {

    const key = call.request.key;

    console.log('Has, key: ' + key);

    callback(null, {
        value: false
    });

}


function Keys(call, callback) {

    console.log('Keys');

    callback(null, {
        keys: ['my', 'crazy', 'whoaman', 'wow', 'huh', 'guess']
    });

}


function Size(call, callback) {

    console.log('Size');

    callback(null, {
        size: 1234
    });

}


function RaftState(call, callback) {

    console.log('RaftState');

    callback(null, {
        state: 'LEADER'
    });

}
