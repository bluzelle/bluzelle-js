module.exports = class Connection {

    constructor({entry, onmessage}) {

        this.entry = entry;
        this.onmessage = onmessage;

        this.socket = new WebSocket(entry);
        this.socket.binaryType = 'arraybuffer';


        this.queue = [];

        this.socket.addEventListener('open', () => {
            this.queue.forEach(bin => this.send(bin));
            this.queue = [];
        });

        this.socket.addEventListener('message', bin => this.onmessage(bin));

        // on close, it should remove itself from the list

    }

    send(bin) {

        if(this.socket.readyState === 1) {

            this.socket.send(bin);

        } else {

            this.queue.push(bin);

        }

    }

}