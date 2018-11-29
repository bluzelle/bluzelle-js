const Connection = require('./1_connection_layer');
const Crypto = require('./2_crypto_layer');
const Redirect = require('./3_redirect_layer');
const Metadata = require('./6_metadata_layer');
const API = require('./7_api_layer');


module.exports = (entry, private_pem, uuid) => {


    // Glue the layers together

    // Find a way to handle this automatically.

    const connection = new Connection({
        entry, 
        onIncomingMsg: crypto.sendIncomingMsg.bind(crypto)
    });

    const crypto = new Crypto({
        private_pem,
        onIncomingMsg: redirect.sendIncomingMsg.bind(metadata),
        onOutgoingMsg: connection.sendOutgoingMsg.bind(connection)
    });

    const redirect = new Redirect({
        onIncomingMsg: metadata.sendIncomingMsg.bind(metadata),
        onOutgoingMsg: crypto.sendOutgoingMsg.bind(connection)
    });

    const metadata = new Metadata({
        uuid,
        onOutgoingMsg: redirect.sendOutgoingMsg.bind(crypto)
    });
    

    const api = new API(metadata.sendOutgoingMsg);


    return api;

};