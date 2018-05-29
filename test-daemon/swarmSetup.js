const exec = require('child_process').exec;
const {logFileMoved, logFileExists} = require('./daemonLogHandlers');
const waitUntil = require('async-wait-until');
const {includes} = require('lodash');
const fs = require('fs');

let logFileName;

module.exports = {
    startSwarm: async function () {
        exec('cd ./test-daemon/scripts; ./run-daemon.sh bluzelle.json');

        // Waiting briefly before starting second Daemon ensures the first starts as leader
        setTimeout(() => {
            exec('cd ./test-daemon/scripts; ./run-daemon.sh bluzelle2.json')
        }, 2000);


        await waitUntil(() => logFileName = logFileExists());

        process.env.emulatorQuiet ||
            console.log(`******** logFileName: ${logFileName} *******`);

        await waitUntil(() => {

            let contents = fs.readFileSync('./test-daemon/daemon-build/output/' + logFileName, 'utf8');

            // raft.cpp:601 stdouts 'I AM LEADER'
            return includes(contents, 'raft.cpp:601');
        }, 6000);
    },
    killSwarm: async () => {
        exec('pkill -2 swarm');
        await waitUntil(() => logFileMoved(logFileName));
    }
};
