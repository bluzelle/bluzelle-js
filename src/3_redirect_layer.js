const database_pb = require('../proto/database_pb');
const assert = require('assert');


module.exports = class Redirect {

    constructor({onIncomingMsg, onOutgoingMsg}) {

        this.onIncomingMsg = onIncomingMsg;
        this.onOutgoingMsg = onOutgoingMsg;

    }

    sendOutgoingMsg(msg) {

        assert(msg instanceof database_pb.database_msg);

        // Pass through
        this.onOutgoingMsg(msg);

    }

    sendIncomingMsg(msg) {

        assert(msg instanceof database_pb.database_response);

        assert(!msg.hasRedirect(), 
            'Daemon returned redirection.');

        this.onIncomingMsg(msg);

    }

};