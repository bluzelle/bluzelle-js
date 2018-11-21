const assert = require('assert');
const EC = require('elliptic').ec;
const sha512 = require('hash.js/lib/hash/sha/512');


const verify = (msg, sig, key) => {

    const key_bin = Buffer.from(key, 'base64');

    const key_hex = key_bin.toString('hex');


    // This is a constant portion of the DER-encoding that is the same for all keys.
    
    // It encodes:

    // - 1.2.840.10045.2.1 ecPublicKey (ANSI X9.62 public key type)
    // - 1.3.132.0.10 secp256k1 (SECG (Certicom) named elliptic curve)
    // - The length and type of the remaining bitstring.

    // To derive this, take a sample secp256k1 public key from OpenSSL and run it through
    // an ASN.1 decoder such as https://lapo.it/asn1js/.

    const header = key_hex.substring(0, 46);

    assert.equal(header, "3056301006072a8648ce3d020106052b8104000a034200");


    const body = key_hex.substring(46, key_hex.length);

    const ec = new EC('secp256k1');


    // Decodes the body into x and y.

    const ec_key = ec.keyFromPublic(body, 'hex');

    const msg_hash = sha512().update(msg).digest();


    // Signature decoding handled by elliptic.

    return ec_key.verify(msg_hash, sig);

};


const sign = () => {

    
    
};


module.exports = {
    verify,
    sign
};