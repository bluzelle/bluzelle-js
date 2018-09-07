const {connect: _connect, disconnect, sendPrimary, sendSecondary, sendObserver} = require('./communication');
const {valToUInt8, uInt8ToVal} = require('./serialize');
const bluzelle_pb = require('../proto/bluzelle_pb');


let uuid;
const connect = (entrypoint, _uuid) => {

    uuid = _uuid;
    return _connect(entrypoint);

};


const getTransactionId = (() => {

    let counter = 0;

    return () => counter++;

})();


const getMessagePrototype = () => {

    const database_msg = new bluzelle_pb.database_msg();
    const header = new bluzelle_pb.database_header();

    header.setDbUuid(uuid);

    header.setTransactionId(getTransactionId());

    database_msg.setHeader(header);

    return database_msg;

};



// Read-style functions

const read = key => {

    const database_msg = getMessagePrototype();

    const database_read = new bluzelle_pb.database_read();

    database_read.setKey(key);

    database_msg.setRead(database_read);


    return sendPrimary(database_msg).then(o => o.read.value).then(uInt8ToVal);

};


const has = key => {

    const database_msg = getMessagePrototype();

    const database_has = new bluzelle_pb.database_has();

    database_has.setKey(key);

    database_msg.setHas(database_has);


    return sendPrimary(database_msg).then(o => o.has.has);

};


const keys = () => {

    const database_msg = getMessagePrototype();

    const database_empty = new bluzelle_pb.database_request();

    database_msg.setKeys(database_empty);


    return sendPrimary(database_msg).then(o => o.keys.keysList);

};



const size = () => {

    const database_msg = getMessagePrototype();

    const database_empty = new bluzelle_pb.database_request();

    database_msg.setSize(database_empty);


    return sendPrimary(database_msg).then(o => o.size.bytes);

};



// Write-style functions

const updateAck = (key, value) => {

    const database_msg = getMessagePrototype();

    const database_update = new bluzelle_pb.database_update();

    database_update.setKey(key);

    database_update.setValue(valToUInt8(value));

    database_msg.setUpdate(database_update);


    return sendSecondary(database_msg);

};


const createAck = (key, value) => {

    const database_msg = getMessagePrototype();

    const database_create = new bluzelle_pb.database_create();

    database_create.setKey(key);

    database_create.setValue(valToUInt8(value));

    database_msg.setCreate(database_create);


    return sendSecondary(database_msg);

};



const removeAck = key => {

    const database_msg = getMessagePrototype();

    const database_delete = new bluzelle_pb.database_delete();

    database_delete.setKey(key);

    database_msg.setDelete(database_delete);


    return sendSecondary(database_msg);

};



// Subscription


const tid_to_key = new Map();


const subscribe = (key, observer) => {

    const database_msg = getMessagePrototype();

    const database_subscribe = new bluzelle_pb.database_subscribe();

    database_subscribe.setKey(key);

    database_msg.setSubscribe(database_subscribe);


    tid_to_key.set(
        database_msg.getHeader().getTransactionId(),
        key);


    return sendObserver(database_msg, v => observer(uInt8ToVal(v)));

};


const unsubscribe = tid => {

    const database_msg = getMessagePrototype();

    const database_unsubscribe = new bluzelle_pb.database_unsubscribe();


    const key = tid_to_key.get(tid);


    database_unsubscribe.setKey(key);
    database_unsubscribe.setTransactionId(tid);

    database_msg.setUnsubscribe(database_unsubscribe);


    return sendPrimary(database_msg);

};


////////////////////////



const subscribeCondition = (key, condition) => 
    new Promise((resolve, reject) => {

        let s;

        s = subscribe(key, v => {
            condition(v) && resolve(s)
        }).catch(reject);

    });


// Composite functions

const create = (key, value) => new Promise((resolve, reject) => {


    const p = subscribeCondition(key, v => v === value);

    setTimeout(() => {

        createAck(key, value).catch(reject);

        p.then(id => {

            unsubscribe(id).then(resolve, reject);

        }, reject);

    }, 10);


});



const update = (key, value) => {};

const remove = key => {};



module.exports = {
    connect,
    disconnect,
    createAck,
    read,
    updateAck,
    removeAck,
    has,
    keys,
    size,
    subscribe,
    unsubscribe,
    create,
    update,
    remove
};