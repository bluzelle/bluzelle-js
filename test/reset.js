const bluzelle = require('../lib/bluzelle-node');
const SwarmState = require('../test-daemon/utils/swarm');
const {generateSwarmJsons, resetConfigCounter} = require('../test-daemon/utils/configs');
const {spawnSwarm} = require('../test-daemon/utils/setup');

const resetInNode = async () => {

    if (process.env.daemonIntegration) {
        const numOfNodes = process.env.numOfNodes ? process.env.numOfNodes : 3;
        const consensusAlgorithm = process.env.consensusAlgorithm ? process.env.consensusAlgorithm : 'raft';
        const PATH_TO_CONFIG_TEMPLATE = `./test-daemon/configs/${consensusAlgorithm}-template.json`;

        resetConfigCounter();

        let [configObject] = await generateSwarmJsons(numOfNodes, PATH_TO_CONFIG_TEMPLATE);

        let swarm = new SwarmState(configObject);

        await spawnSwarm(swarm, {consensusAlgorithm: consensusAlgorithm});

        return swarm;

    } else {

    	// We use eval is so that webpack doesn't bundle the emulator,
    	// if we are compiling tests for the browser.

        let swarmemulator; 

    	try {

            swarmemulator = eval("require('swarmemulator')");

    	} catch(e) {

            throw e;

    		throw new Error("bluzelle-js swarmemulator not found as a package. You must install or link this package manually as it is not listed in this projects proper dependencies.");

    	}

        return swarmemulator.reset();
    	
	}

};


const resetInBrowser = () => new Promise(resolve => {

	const ws = new WebSocket('ws://localhost:8101');
	ws.onopen = () => {

		ws.send('reset');

	};

	ws.onmessage = () => {

		ws.close();
		resolve();

	};

});


module.exports = () => {

	if(typeof window === 'undefined') {

		return resetInNode();

	}
	else {

		return resetInBrowser();

	}

};
