const path = require('path');

module.exports = [
    {
        mode: 'development',
        entry: './src/api.js',
        output: {
            path: path.resolve('lib'),
            filename: 'bluzelle.node.js',
            libraryTarget: "commonjs",
        },
        target: 'node',
    },

    {
        mode: 'development',
        entry: './src/api.js',
        output: {
            path: path.resolve('lib'),
            filename: 'bluzelle.web.js',
            libraryTarget: "commonjs",
        },
        target: 'web',
    }
];