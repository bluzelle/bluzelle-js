const uuid = require('uuid/v4');

exports.generate = (numOfKeys) => {
    return [...Array(numOfKeys).keys()]
        .reduce(acc => {
            acc.push(uuid());
            return acc;
        }, []).sort(); // sort uuids lexicographically to match pbft primary round-robin order
};

