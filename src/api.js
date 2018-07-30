const communication = require('./communication');
const {valToUInt8, uInt8ToVal} = require('./serialize');
const bluzelle_pb = require('../proto/bluzelle_pb');
const database_pb = require('../proto/database_pb');


let uuid;
const connect = (entrypoint, _uuid) => {

    uuid = _uuid;
    communication.connect(entrypoint);

};


const getTransactionId = (() => {

    let counter = 0;

    return () => counter++;

})();


const getMessagePrototype = () => {

    const database_msg = new database_pb.database_msg();
    const header = new database_pb.database_header();

    header.setDbUuid(uuid);

    database_msg.setHeader(header);

    return database_msg;

};


// Read-style functions

const read = key => {

    const database_msg = getMessagePrototype();

    const database_read = new bluzelle_pb.database_read();

    database_read.setKey(key);

    database_msg.setRead(database_read);


    return send(database_msg).then(o => o.value).then(uInt8ToVal);

};


const has = key => {

    const database_msg = getMessagePrototype();

    const database_has = new bluzelle_pb.database_has();

    database_has.setKey(key);

    database_msg.setHas(database_has);


    return send(database_msg).then(o => o.has);

};


const keys = () => {

    const database_msg = getMessagePrototype();

    const database_empty = new bluzelle_pb.database_empty();

    database_msg.setKeys(database_empty);


    return send(database_msg).then(o => o.keysList);

};



const size = () => {

    const database_msg = getMessagePrototype();

    const database_empty = new bluzelle_pb.database_empty();

    database_msg.setSize(database_empty);


    return send(database_msg).then(o => o.size);

};



// Write-style functions

const update = (key, value) => new Promise((resolve, reject) => {

    const database_msg = getMessagePrototype();


    const database_update = new database_pb.database_update();

    database_update.setKey(key);

    database_update.setValue(valToUInt8(value));


    database_msg.setUpdate(database_update);


    subscribe(key).then(v => {

        if(v === value) {
            unsubscribe(key).then(resolve, reject);
        }

    }, reject);


    send(database_msg).catch(reject);

});


const create = (key, value) => new Promise((resolve, reject) => {

    const database_msg = getMessagePrototype();

    const database_create = new database_pb.database_create();

    database_create.setKey(key);

    database_create.setValue(valToUInt8(value));


    database_msg.setCreate(database_create);



    subscribe(key).then(v => {

        if(v === value) {
            unsubscribe(key).then(resolve, reject);
        }

    }, reject);


    send(database_msg).catch(reject);


});



const remove = key => new Promise((resolve, reject) => {

    const database_msg = getMessagePrototype();

    const database_delete = new database_pb.database_delete();

    database_delete.setKey(key);

    database_msg.setDelete(database_delete);



    subscribe(key).then(v => {

        if(v === undefined) {
            unsubscribe(key).then(resolve, reject);
        }

    }, reject);


    send(database_msg).catch(reject);

});


const subscribe = (key, observer) => {

    const database_msg = getMessagePrototype();

    const database_subscribe = new database_pb.database_subscribe();

    database_subscribe.setKey(key);

    database_msg.setSubscribe(database_subscribe);


    return send(database_subscribe);

};


const unsubscribe = key => {

    const database_msg = getMessagePrototype();

    const database_unsubscribe = new database_pb.database_unsubscribe();

    database_unsubscribe.setKey(key);

    database_msg.setUnsubscribe(database_unsubscribe);


    return send(database_unsubscribe);

};


module.exports = {
    connect,
    create,
    read,
    update,
    remove,
    has,
    keys,
    size,
    subscribe,
    unsubscribe
};