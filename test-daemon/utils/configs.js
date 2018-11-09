const uuids = require('./uuids');
const fsPromises = require('fs').promises;
const fs = require('fs');

exports.generateSwarmJsons = async (numOfConfigs, pathToTemplate) => {

    const configsOject = await generateConfigs(numOfConfigs, pathToTemplate);

    const peersList = await generatePeersList(configsOject);

    return [configsOject, peersList];
};

exports.resetConfigCounter = () => {
    configCounter.reset()
};

const generateConfigs = async (numOfConfigs, pathToTemplate) => {

    const template = readTemplate(pathToTemplate);

    const uuidsList = uuids.generate(numOfConfigs);

    let configsObject = buildConfigObject(template, numOfConfigs, uuidsList);

    try {
        await writeFilesToDirectory(configsObject);
    } catch (err) {
        throw new Error('Error writing configs list to file');
        throw err;
    }

    return configsObject;
};

const generatePeersList = async (configsObject) => {

    let peers = [];

    configsObject.forEach(data => {
        peers.push(
            {
                name: `daemon${data.index}`,
                host: '127.0.0.1',
                port: data.content.listener_port,
                uuid: data.content.uuid,
                http_port: data.content.http_port
            }
        )
    });

    try {
        await fsPromises.writeFile(`./test-daemon/daemon-build/output/peers.json`, JSON.stringify(peers), 'utf8');
    } catch (err) {
        throw new Error('Error writing peers list to file');
        throw err;
    }

    return peers;
};


function Config(keys, edits) {
    Object.entries(keys).forEach((key) => this[key[0]] = key[1]);

    if (edits) {
        Object.entries(edits).forEach(key => this[key[0]] = key[1])
    }
};

const buildConfigObject = (template, _numOfConfigsToGenerate, uuidsList) => {
    return [...Array(_numOfConfigsToGenerate).keys()].map((internalIndex) => {

        let currentIndex = configCounter.increment();

        return {
            content: new Config(template,
                {
                    listener_port: template.listener_port + currentIndex,
                    http_port: template.http_port + currentIndex,
                    uuid: uuidsList[internalIndex]
                }),
            index: currentIndex
        }
    });
};

const writeFilesToDirectory = (configsObject) => Promise.all(configsObject.map((obj) =>
    fsPromises.writeFile(`./test-daemon/daemon-build/output/bluzelle${obj.index}.json`, JSON.stringify(obj.content))));

const readTemplate = path => JSON.parse(fs.readFileSync(path).toString());

const configCounter = {
    counter: -1,
    increment() { return this.counter += 1 },
    reset() { this.counter = -1 }
};
