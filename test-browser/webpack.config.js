const path = require('path');


module.exports = {
    mode: 'development',
    entry: './main.test.js',
    output: {
        path: path.resolve('.'),
        filename: 'main.test.pack.js',
        libraryTarget: "this",
    },
    target: 'web',

    stats: {
        warnings: false
    }
};