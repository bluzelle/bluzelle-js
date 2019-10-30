const default_peerslist_endpoint = require('../default_peerslist_endpoint');
require('isomorphic-fetch');


const getSwarms = async peerslist_endpoint => {
    
    return (await fetch(peerslist_endpoint)).json();

};


module.exports = {
    getSwarms
};