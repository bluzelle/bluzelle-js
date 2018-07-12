const path = require('path');

module.exports = {
    mode: 'development',
    entry: './src/api.js',
    output: {
        path: path.resolve('lib'),
        filename: 'bluzelle.js',
        libraryTarget: "umd",
        library: 'bluzelle',
    },

    target: 'node'
};