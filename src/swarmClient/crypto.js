const crypto = require('isomorphic-crypto');


const format_public = str => 

    '-----BEGIN PUBLIC KEY-----\n' + 
    str.match(/.{1,64}/g).join('\n') + 
    '\n-----END PUBLIC KEY-----';


const format_private = str => 
    
    '-----BEGIN EC PRIVATE KEY-----\n' + 
    str.match(/.{1,64}/g).join('\n') + 
    '\n-----END EC PRIVATE KEY-----';


const verify_pair = (priv, pub) => {

    priv = format_private(priv);
    pub = format_public(pub);


    try {

        const s = crypto.createSign('sha256');

        s.update('test');

        const sig = s.sign(priv);

        const v = crypto.createVerify('sha256');

        v.update('test');

        if(!v.verify(pub, sig)) {

            throw new Error('keys don\'t match');

        }


    } catch(e) {

        throw new Error('Bluzelle keypair failure; ' + e.message);

    }

};


module.exports = {
    format_public,
    format_private,
    verify_pair
};