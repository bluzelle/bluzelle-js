const {spawn, exec, execSync} = require('child_process');
const PromiseSome = require('bluebird').some;
const WebSocket = require('ws');

const setupUtils = {

    spawnSwarm: async (swarm, {consensusAlgorithm, failureAllowed = 0.2} = {}) => {
        /*
         * Spawn a swarm of nodes
         * @param {swarm} Swarm class object documenting Daemon config information and node states
         * @param {consensusAlgorithm} 'raft' or 'pbft' Configures spawnSwarm to expect Raft leader election or PBFT primary expectation
         * @param {failureAllowed} Optional. Default 0.2. The % of nodes allowed to fail to start up before erroring out
         * */

        const nodesToSpawn = swarm.nodes;

        const MINIMUM_NODES = Math.floor(nodesToSpawn.length * ( 1 - failureAllowed));

        exec('cd ./test-daemon/daemon-build/output/; rm -rf .state');

        try {
            await PromiseSome(nodesToSpawn.map((daemon) => new Promise((res, rej) => {

                const rejTimer = setTimeout(() => {
                    rej(new Error(`${daemon} stdout: \n ${buffer}`))
                }, 20000);

                let buffer = '';
                swarm[daemon].stream = spawn('script', ['-q', '/dev/null', './run-daemon.sh', `bluzelle${swarm[daemon].index}.json`], {cwd: './test-daemon/scripts'});

                swarm[daemon].stream.stdout.on('data', (data) => {
                    buffer += data.toString();

                    if (data.toString().includes('Running node with ID:')) {
                        clearInterval(rejTimer);
                        swarm.pushLiveNodes(daemon);
                        res();
                    }
                });

                swarm[daemon].stream.on('close', code => {
                    swarm.deadNode(daemon)
                });

            })), MINIMUM_NODES);

        } catch(err) {

            if (err instanceof Array) {
                err.forEach((e) => {
                    console.log(`Daemon failed to startup in time. \n ${e}`)
                });
            } else {
                throw new Error(`Minimum swarm failed to start \n ${err}`)
            }
        }

        if (consensusAlgorithm === 'raft') {
            await getCurrentLeader(swarm)
        }

        if (consensusAlgorithm === 'pbft') {

            await new Promise((res) => {

                swarm.daemon0.stream.stdout
                    .on('data', (data) => {
                        // daemon implementation starts with daemon1 as primary
                        // `sorted_uuids_list[view_number % number_of_nodes]`
                        if (data.toString().includes(`primary: "${swarm.daemon1.uuid}"`)) {
                            swarm.leader = 'daemon1'
                            res(swarm.daemon1.uuid)
                        }
                    });
            })
        }
    },
    despawnSwarm: () => {
        try {
            execSync('pkill -9 swarm');
        } catch (err) {
            // ignore error thrown when no swarm process to kill
        }

        try {
            execSync('cd ./test-daemon/daemon-build/output/; rm *.json');
        } catch (err) {
            if (notENOENT(err.message)) {
                throw err
            }
        }
    }
};

const getCurrentLeader = (swarm) => new Promise((res, rej) => {

    let startTime, socket, nodePort;

    startTime = Date.now();

    rejAfterTimeElapsed(startTime, 9000, rej);

    // if leader exists, connect to a follower, otherwise connect to any live node which could include leader
    if (swarm.leader) {
        nodePort = swarm[swarm.followers[0]].port
    } else {
        nodePort = swarm[swarm.liveNodes[0]].port
    }

    try {
        socket = new WebSocket(`ws://127.0.0.1:${nodePort}`);
    } catch (err) {
        rej(new Error(`Failed to connect to leader. \n ${err.stack}`))
    }

    socket.on('open', () => {
        // timeout required until KEP-684 bug resolved
        setTimeout(() => socket.send(JSON.stringify({"bzn-api" : "raft", "cmd" : "get_peers"})), 2000)
    });

    socket.on('message', (message) => {

        let msg = JSON.parse(message);

        try {
            if (msgSentToFollower(msg)) {
                swarm.leader = msg.message.leader.name;
                res(swarm.leader);
                socket.close();
            } else if (msgSentToLeader(msg)) {
                swarm.leader = swarm.liveNodes[0];
                res(swarm.leader);
                socket.close();
            } else if (electionInProgress(msg)) {
                socket.send(JSON.stringify({"bzn-api" : "raft", "cmd" : "get_peers"}))
            }
        } catch (err) {
            rej(new Error(`Error setting leader, \n${err.stack}`));
        }
    })
});

const rejAfterTimeElapsed = (startTime, ms, rej) => {
    setInterval(() => {
        let timeElapsed = Date.now() - startTime;

        if (timeElapsed >= ms) {
            rej(new Error(`Timed out after time elapsed: ${ms}`))
        }
    }, 500);
};

const msgSentToFollower = (msg) => msg.error && msg.message;

const msgSentToLeader = (msg) => msg.message;

const electionInProgress = (msg) => msg.error;

const notENOENT = (msg) => !msg.includes('ENOENT');

module.exports = setupUtils;
