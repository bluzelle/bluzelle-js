const database_pb = require('../proto/database_pb');
const assert = require('assert');


module.exports = class Metadata {

    constructor({uuid, onOutgoingMsg}) {

        this.uuid = uuid;
        this.onOutgoingMsg = onOutgoingMsg;

        this.nonceMap = new Map();

    }


    // fn is called instead of onIncomingMsg because it's specific
    // to the request.

    // fn returning true means to delete the entry from nonceMap.

    sendOutgoingMsg(msg, fn) {

        assert(msg instanceof database_pb.database_msg);

        const header = new database_pb.database_header();

        header.setUuid(this.uuid);


        const nonce = Math.floor(Math.random() * Math.pow(2, 64));

        // transaction id should be renamed to nonce.
        header.setTransactionId(nonce);

        msg.setHeader(header);

        this.nonceMap.set(nonce, fn);

        this.onOutgoingMsg(msg);

    }


    sendIncomingmsg(msg) {

        assert(msg instanceof database_pb.database_msg);

        const header = msg.getHeader();

        assert(header.getUuid() === this.uuid);

        const nonce = header.getTransactionId();


        assert(this.nonceMap.has(nonce), 
            'Metadata layer: nonce doesn\'t belong to map. Was it termianted too early?');


        const fn = this.nonceMap.get(nonce);


        if(fn(msg)) {

            this.nonceMap.delete(nonce);

        }

    }

};