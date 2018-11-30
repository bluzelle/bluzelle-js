// Copyright (C) 2018 Bluzelle
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License, version 3,
// as published by the Free Software Foundation.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.


const Connection = require('./1_connection_layer');
const Crypto = require('./2_crypto_layer');
const Redirect = require('./3_redirect_layer');
const Cache = require('./4_cache_layer');
const Metadata = require('./6_metadata_layer');
const API = require('./7_api_layer');


module.exports = (entry, private_pem, uuid) => {


    // Glue the layers together

    // Find a way to handle this automatically.

    const connection = new Connection({
        entry, 
    });

    const crypto = new Crypto({
        private_pem,
    });

    const redirect = new Redirect({});

    const cache = new Cache({});

    const metadata = new Metadata({
        uuid,
    });


    connection.onIncomingMsg = crypto.sendIncomingMsg.bind(crypto);
    crypto.onIncomingMsg = redirect.sendIncomingMsg.bind(redirect);
    crypto.onOutgoingMsg = connection.sendOutgoingMsg.bind(connection);
    redirect.onIncomingMsg = cache.sendIncomingMsg.bind(cache);
    redirect.onOutgoingMsg = crypto.sendOutgoingMsg.bind(crypto);
    cache.onIncomingMsg = metadata.sendIncomingMsg.bind(metadata);
    cache.onOutgoingMsg = redirect.sendOutgoingMsg.bind(redirect);
    metadata.onOutgoingMsg = cache.sendOutgoingMsg.bind(cache);


    api = new API(metadata.sendOutgoingMsg.bind(metadata));


    return api;

};