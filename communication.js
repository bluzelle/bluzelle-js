const WebSocket = require('isomorphic-ws');
const grpc = require('grpc');

const connections = new Set();
const resolvers = new Map();
const messages = new Map();


// Non-polling actions

// - has
// - keys
// - read


// Polling actions

// - create
// - remove
// - update



let db_uuid;
let connection;

const connect = (addr, _db_uuid) => {
    db_uuid = _db_uuid;

    if(connection) {

        disconnect();

    }
    

    const proto_path = __dirname + '/service.proto';

    const protocol = grpc.load(proto_path);


    connection = new protocol.Bluzelle(addr, 
            grpc.credentials.createInsecure());
};


const disconnect = () => {

    connection.close();

};


// Non-polling actions

const read = key => new Promise((resolve, reject) => {

    connection.Read({

        header: {
            db_uuid
        },

        key

    }, function(err, response) {

        if(err) {
            reject(err);
        } else {
            resolve(response.value);
        }

    });

});


const has = key => new Promise((resolve, reject) => {

    connection.Has({

        header: {
            db_uuid
        },

        key

    }, function(err, response) {

        if(err) {
            reject(err);
        } else {
            resolve(response.value);
        }

    });

});


const keys = () => new Promise((resolve, reject) => {

    connection.Keys({

        header: {
            db_uuid
        }

    }, function(err, response) {

        if(err) {
            reject(err);
        } else {
            resolve(response.keys);
        }

    });

});

const size = () => new Promise(resolve => {

    connection.Size({

        header: {
            db_uuid
        }

    }, function(err, response) {

        if(err) {
            reject(err);
        } else {
            resolve(response.size);
        }

    });

});





const poll = action => new Promise((resolve, reject) => {

    const pollRate = 500; // ms
    const pollTimeout = 5000;

    const start = new Date().getTime();


    (function loop() {

        action().then(v => {

            if(v) {

                resolve();

            } else {

                if(new Date().getTime() - start > pollTimeout) {

                    reject(new Error('Bluzelle poll timeout - command not commited to swarm.'));

                } else {

                    setTimeout(loop, pollRate);

                }

            }

        }, reject);

    })();

});


// Polling actions

const update = (key, value) => new Promise((resolve, reject) => {

    connection.Update({

        header: {
            db_uuid
        },

        key,
        value

    }, function(err, response) {

        if(err) {
            
            reject(err);
        
        } else {

            const pollingFunc = () => 
                new Promise((res, rej) => 
                    read(key).then(v => res(v === value), rej));

            poll(pollingFunc).then(resolve, reject);

        }

    });

});


const create = (key, value) => new Promise((resolve, reject) => {

    connection.Create({

        header: {
            db_uuid
        },

        key,
        value

    }, function(err, response) {

        if(err) {
            
            reject(err);
        
        } else {

            const pollingFunc = () => 
                new Promise((res, rej) => 
                    has(key).then(v => res(v), rej));

            poll(pollingFunc).then(resolve, reject);

        }

    });

});



const remove = key => new Promise((resolve, reject) => {

    connection.Delete({

        header: {
            db_uuid
        },

        key

    }, function(err, response) {

        if(err) {
            
            reject(err);
        
        } else {

            const pollingFunc = () => 
                new Promise((res, rej) => 
                    has(key).then(v => res(!v), rej));

            poll(pollingFunc).then(resolve, reject);

        }

    });

});


module.exports = {
    connect,
    create,
    read,
    update,
    remove,
    has,
    keys,
    size
};


