const WebSocket = require('isomorphic-ws');
const {encode} = require('base64-arraybuffer');
const {isEqual} = require('lodash');


const tidMap = new Map();

const primaryConnection = {};
const secondaryConnection = {};


const connect = address => {

    if(primaryConnection) {

        throw new Error('bluzelle: already connected.');

    }


    newConnection(address, onPrimaryMessage, primaryConnection);

};


const newConnection = (address, handleMessage, connectionObject = {}) => {


    // s.send(JSON.stringify({
    //     'bzn-api': 'database',
    //     msg: encode(message.serializeBinary())
    // }));

    connectionObject.address = address;

    connectionObject.socket = new WebSocket(address);
    connectionObject.socket.binaryType = "arraybuffer";

    connectionObject.socket.onopen = () => {
        resolve();
    };

    connectionObject.socket.onerror = (e) => {
        throw new Error(e.error.message);
    };

    connectionObject.socket.onclose = (e) => {

        // Reopen the connection.
        newConnection(address, connectionObject);

    };

    connectionObject.socket.onmessage = e => {
        handleMessage(e.data);
    };


    return connectionObject;

};



const onMessage = (bin, socket) => {

    if(typeof bin === 'string') {
        throw new Error('daemon returned string instead of binary')
    }


    const response = database_pb.database_response.deserializeBinary(new Uint8Array(bin));
    const response_json = response.toObject();

    const id = response_json.header.transactionId;



    // rather than having resolver/rejecter
    // how about a promise that we can resolve or reject?

    // or an object that has resolve, reject, resend?


    const message = messages.get(id);
    const resolver = resolvers.get(id);
    const rejecter = rejecters.get(id);

    resolvers.delete(id);
    rejecters.delete(id);
    messages.delete(id);


    if(id === undefined) {

        throw new Error('Received non-response_json message.');

    }

    if(response_json.redirect) {

        const isSecure = address.startsWith('wss://');

        const prefix = isSecure ? 'wss://' : 'ws://';

        const addressAndPort = prefix + response_json.redirect.leaderHost + ':' + response_json.redirect.leaderPort;

        connect(addressAndPort, uuid);

        send(message, resolver, rejecter);


    } else {

        // We want the raw binary output, as toObject() above will automatically
        // convert the Uint8 array to base64.

        if(response_json.resp && response_json.resp.value) {

            response_json.resp.value = response.getResp().getValue();

        }


        resolver(response_json.resp || {});

    }

};



const send = (database_msg, socket) => {

    socket.send(JSON.stringify({
        'bzn-api': 'database',
        msg: encode(database_msg.serializeBinary())
    }));

};


const sendPrimary = database_msg => new Promise((resolve, reject) => {


    const message = new bluzelle_pb.bzn_msg();

    message.setDb(database_msg);

    const tid = getTransactionId();
    database_msg.getHeader().setTransactionId(tid);



    tidMap.set(tid, {
        resolve,
        reject,
        database_msg
    });


    // And then we want to decorate the function to handle redirection
    // logic.
    
    send(database_msg, primaryConnection.socket);


});


const sendSecondary = database_msg => new Promise((resolve, reject) => {



});


const sendObserver = (database_msg, observer) => {


    // Subsequent responses from the daemon using the same transaction
    // id are piped to the observer.

    const replaceResolverWithObserver = () => {

        const tid = database_msg.getHeader().getTransactionId();
        
        /// ...

    };


    return sendPrimary(database_msg).then(replaceResolverWithObserver);

};



module.exports = {
    connect, 
    sendWrite,
    sendPrimary,
    sendObserver
};

