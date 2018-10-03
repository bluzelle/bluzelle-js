const {valToUInt8, uInt8ToVal} = require('./serialize');
const {encode} = require('base64-arraybuffer');
const {isEqual} = require('lodash');
const bluzelle_pb = require('../proto/bluzelle_pb');
const waitUntil = require('async-wait-until');
const WebSocket = require('isomorphic-ws');


const newConnection = (client, address, connectionObject = {}) => 
   
    new Promise((resolve, reject) => {


    connectionObject.address = address;

    connectionObject.socket = new WebSocket(address);
    connectionObject.socket.binaryType = "arraybuffer";

    connectionObject.socket.onopen = () => resolve();

    connectionObject.socket.onerror = (e) =>
        reject(new Error(e.error.message));

    connectionObject.socket.onmessage = e =>
        onMessage(client, e.data);

});



const ackMessage = response => 
        response.getResponseCase() === 0;


const onMessage = (client, bin) => {    

    if(typeof bin === 'string') {
        throw new Error('Bluzelle: (internal) daemon returned string instead of binary.')
    }

    const response = bluzelle_pb.database_response.deserializeBinary(new Uint8Array(bin));
    const response_json = response.toObject();


    client.verbose && console.log("\nRecieving\n",response_json);



    if(!response.hasHeader() && response.hasError()) {

        throw new Error(response.getError().getMessage());
        return;

    }


    const id = response_json.header.transactionId;


    if(id === undefined) {
        throw new Error('Bluzelle: (internal) received non-response_json message.');
    }

    // If the message is not in the resolution map, it has already
    // been resolved from the acknowledgement.

    if(!client.tidMap.has(id)) {
        return;
    }


    const o = client.tidMap.get(id);



    // Delete the message from the resolution map it's not needed
    // after this.

    if(o.resolve_on_ack || !ackMessage(response)) {

        client.tidMap.delete(o);

    }


    if(response_json.redirect) {

        const prefix = 'ws://';

        const addressAndPort = prefix + response_json.redirect.leaderHost + ':' + response_json.redirect.leaderPort;


        // Find a way to check if this address is going to the same node.

        newConnection(client, addressAndPort, secondaryConnection).then(
            sendSecondary(o.database_msg).then(o.resolve, o.reject),
            o.reject
        );

        
    } else {

        if(response.hasError()) {

            o.reject(new Error(response.getError().getMessage()));

        } else {

            if((ackMessage(response) && o.resolve_on_ack) ||
               (!ackMessage(response) && !o.resolve_on_ack)) {

                resolve(response_json, response, o);

            }       

        }

    }

};


const resolve = (response_json, response, o) => {

    // We want the raw binary output, as toObject() above will automatically
    // convert the Uint8 array to base64.

    if(response_json && response_json.read) {

        response_json.read.value = response.getRead().getValue();

    }


    if(response_json && response_json.subscriptionUpdate) {

        response_json.subscriptionUpdate.value = 
            response.getSubscriptionUpdate().getValue();

    }

    
    o.resolve(response_json || {});

};


const send = (client, database_msg, socket, resolve_on_ack) => 

    new Promise((resolve, reject) => {


    const message = new bluzelle_pb.bzn_msg();

    message.setDb(database_msg);

    const tid = database_msg.getHeader().getTransactionId();


    client.verbose && console.log("\nSending\n", database_msg.toObject());


    let serializedMessage;

    try {

        serializedMessage = message.serializeBinary();

    } catch(e) {

        reject(new Error("Bluzelle: (internal) protobuf serialization failed."));

    }


    client.tidMap.set(tid, {
        resolve_on_ack,
        resolve,
        reject,
        database_msg
    });

    socket.send(JSON.stringify({
        'bzn-api': 'database',
        msg: encode(serializedMessage)
    }));

});


const sendPrimary = (client, database_msg, resolveOnAck=false) => {

    if(!client.primaryConnection.socket) {

        return Promise.reject(new Error(
            "Bluzelle: attempting to send message with no connection."));

    }

    return send(client, database_msg, client.primaryConnection.socket, resolveOnAck);

};


// Attempts to send to the secondary connection and otherwise
// defaults to the primary.

const sendSecondary = (client, database_msg, resolveOnAck=false) => {

    if(client.secondaryConnection.socket) {

        return send(client, database_msg, client.secondaryConnection.socket, resolveOnAck);

    } else {

        return sendPrimary(client, database_msg, resolveOnAck);

    }

};



const generateTransactionId = client => {

    client._counter = client._counter || 0;

    return client._counter++;

};


const getMessagePrototype = client => {

    const database_msg = new bluzelle_pb.database_msg();
    const header = new bluzelle_pb.database_header();

    header.setDbUuid(client.uuid);

    header.setTransactionId(generateTransactionId(client));

    database_msg.setHeader(header);

    return database_msg;

};



class BluzelleClient {

    constructor(entrypoint, uuid, verbose = false) {

        this.entrypoint = entrypoint;
        this.uuid = uuid;


        // Print requests and responses

        this.verbose = verbose;

        this.primaryConnection = {};
        this.secondaryConnection = {};


        // For mapping transaction ids to their resolvers

        this.tidMap = new Map();


        // For mapping subscription transaction ids to
        // their keys.

        this.tidToKey = new Map();


        // Transaction ID counter.

        this._counter = 0;

    }


    connect() {

        if(this.primaryConnection.socket && this.primaryConnection.socket.readyState === 1) {

            return Promise.reject(new Error('bluzelle: already connected.'));

        }

        return newConnection(this, this.entrypoint, this.primaryConnection);

    }


    disconnect() {

        this.primaryConnection.socket 
            && this.primaryConnection.socket.close();

        this.secondaryConnection.socket 
            && this.secondaryConnection.socket.close();

        delete this.primaryConnection.socket;
        delete this.secondaryConnection.socket;

    }


    // Read-style functions

    read(key) {

        const database_msg = getMessagePrototype(this);

        const database_read = new bluzelle_pb.database_read();

        database_read.setKey(key);

        database_msg.setRead(database_read);


        return sendPrimary(this, database_msg).then(o => o.read.value).then(uInt8ToVal);

    }


    has(key) {

        const database_msg = getMessagePrototype(this);

        const database_has = new bluzelle_pb.database_has();

        database_has.setKey(key);

        database_msg.setHas(database_has);


        return sendPrimary(this, database_msg).then(o => o.has.has);

    }


    keys() {

        const database_msg = getMessagePrototype(this);

        const database_empty = new bluzelle_pb.database_request();

        database_msg.setKeys(database_empty);


        return sendPrimary(this, database_msg, false).then(o => o.keys.keysList);

    }


    size() {

        const database_msg = getMessagePrototype(this);

        const database_empty = new bluzelle_pb.database_request();

        database_msg.setSize(database_empty);


        return sendPrimary(this, database_msg).then(o => o.size.bytes);

    }



    // Write-style functions

    updateAck(key, value) {

        const database_msg = getMessagePrototype(this);

        const database_update = new bluzelle_pb.database_update();

        database_update.setKey(key);

        database_update.setValue(valToUInt8(value));

        database_msg.setUpdate(database_update);


        return sendSecondary(this, database_msg, true);

    }


    createAck(key, value) {

        const database_msg = getMessagePrototype(this);

        const database_create = new bluzelle_pb.database_create();

        database_create.setKey(key);

        database_create.setValue(valToUInt8(value));

        database_msg.setCreate(database_create);


        return sendSecondary(this, database_msg, true);

    }


    removeAck(key) {

        const database_msg = getMessagePrototype(this);

        const database_delete = new bluzelle_pb.database_delete();

        database_delete.setKey(key);

        database_msg.setDelete(database_delete);


        return sendSecondary(this, database_msg, true);

    }



    update(key, value) {

        const database_msg = getMessagePrototype(this);

        const database_update = new bluzelle_pb.database_update();

        database_update.setKey(key);

        database_update.setValue(valToUInt8(value));

        database_msg.setUpdate(database_update);


        return sendSecondary(this, database_msg);

    }


    create(key, value) {

        const database_msg = getMessagePrototype(this);

        const database_create = new bluzelle_pb.database_create();

        database_create.setKey(key);

        database_create.setValue(valToUInt8(value));

        database_msg.setCreate(database_create);


        return sendSecondary(this, database_msg);

    }


    remove(key) {

        const database_msg = getMessagePrototype(this);

        const database_delete = new bluzelle_pb.database_delete();

        database_delete.setKey(key);

        database_msg.setDelete(database_delete);


        return sendSecondary(this, database_msg);

    }

}



module.exports = {
    BluzelleClient
};