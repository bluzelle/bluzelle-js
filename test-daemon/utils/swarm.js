module.exports = class SwarmState {

    constructor (configsWithIndex) {
        this._nodes = [];
        this._liveNodes = [];
        this.load(configsWithIndex);
    }

    get nodes() {
        return this._nodes
    }

    set liveNodes(arr) {
        this._liveNodes = arr
    }

    get liveNodes() {
        return this._liveNodes
    }

    pushLiveNodes(node) {
        this._liveNodes.push(node)
    }

    set leader(node) {
        this._leader = node
    }

    get leader() {
        return this._leader
    }

    get followers() {
        if (this._leader) {
            return this._liveNodes.filter((node) => node != this._leader)
        } else {
            return new Error('No leader set')
        }
    }

    get lastNode() {
        return this._nodes[this._nodes.length - 1]
    }

    deadNode(daemon) {
        if (nodeExistsInLiveNodes) {
            this._liveNodes.splice(this._liveNodes.indexOf(daemon),1);
        }
        if (this[daemon].stream){
            this[daemon].stream = null
        }
    }

    load(configsWithIndex) {

        configsWithIndex.forEach(data => {

            this._nodes.push(`daemon${data.index}`)

            this[`daemon${data.index}`] =
                {
                    uuid: data.content.uuid,
                    port: data.content.listener_port,
                    http_port: data.content.http_port,
                    index: data.index
                }
        });
    }
};


const nodeExistsInLiveNodes = () => this._liveNodes.indexOf(daemon) >= 0;
