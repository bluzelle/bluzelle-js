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


const WebSocket = require('isomorphic-ws');
const assert = require('assert');
const bluzelle_pb = require('../proto/bluzlle_pb');
const database_pb = require('../proto/database_pb');


module.exports = class Connection {

    constructor({entry, onIncomingMsg}) {

        this.connection = new WebSocket(entry);
        this.connection.binaryType = 'arraybuffer';

        this.connection.onmessage = onIncomingMsg;

    }

    sendOutgoingMsg(bin) {

        if(this.connection.readyState === 1) {

            this.connection.send(bin);

        } else {

            this.connection.onmessage(
                connection_closed_error_response(bin));

        }

    }

};


const connection_closed_error_response = bin => {

    const bzn_envelope = bluzelle_pb.bzn_envelope.deserializeBinary(bin);

    assert(bzn_envelope.getPayloadCase() === bzn_envelope.PayloadCase.DATABASE_MSG,
        "Not sending a database message; can't mutate into database connection error.");


    const bzn_envelope_payload = bzn_envelope.getDatabaseMsg();
    
    const database_msg = database_pb.database_msg.deserializeBinary(bzn_envelope_payload);
    
    const header = database_msg.getHeader();

    
    const response = new database_pb.database_response();

    response.setHeader(header);

    const error = new database_pb.database_error();
    error.setError("CONNECTION CLOSED");

    response.setError(error);


    return response;

};