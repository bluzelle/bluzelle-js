//
// Copyright (C) 2019 Bluzelle
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


const assert = require('assert');
const EC = require('elliptic').ec;
const sha256 = require('hash.js/lib/hash/sha/256');


const verify = (msg_bin, sig_bin, pub_key_base64) => {

    const ec_key = import_public_key_from_base64(pub_key_base64);

    const msg_hash = sha256().update(msg_bin).digest();


    // Signature base64 decoding handled by elliptic.

    return ec_key.verify(msg_hash, sig_bin);

};


const sign = (msg_bin, priv_key_base64) => {

    const ec_key = import_private_key_from_base64(priv_key_base64);

    const msg_hash = sha256().update(msg_bin).digest();

    const sig_bin = ec_key.sign(msg_hash).toDER();


    assert(ec_key.verify(msg_hash, sig_bin),
        "ECDSA: the produced signature cannot be self-verified.");

    return sig_bin;

};


const pub_from_priv = priv_key_base64 => {

    const ec_key = import_private_key_from_base64(priv_key_base64);

    // This is the only way we get the long-form encoding found in PEM's.

    const pub = ec_key.getPublic('hex');


    // Strip the first byte since those are present
    // in the base64 header we've provided.

    return Buffer.from('3059301306072a8648ce3d020106082a8648ce3d030107034200' + pub, 'hex').toString('base64');

};


// Returns an elliptic key from base64 PEM encoding with braces removes

// ex. If this is your key:

// -----BEGIN PUBLIC KEY-----
// MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAE9Icrml+X41VC6HTX21HulbJo+pV1mtWn
// 4+evJAi8ZeeLEJp4xg++JHoDm8rQbGWfVM84eqnb/RVuIXqoz6F9Bg==
// -----END PUBLIC KEY-----

// We pass "MFYwEAYHKoZI..." into this function and it gives us an elliptic
// key object with x/y interpreted.


const import_public_key_from_base64 = pub_key_base64 => {


    const key_bin = Buffer.from(pub_key_base64, 'base64');

    const key_hex = key_bin.toString('hex');


    // This is a constant portion of the DER-encoding that is the same for all keys.
    
    // It encodes:

    // - 1.2.840.10045.2.1 ecPublicKey (ANSI X9.62 public key type)
    // - 1.3.132.0.10 secp256k1 (SECG (Certicom) named elliptic curve)
    // - The length and type of the remaining bitstring.

    // To derive this, take a sample ec public key from OpenSSL and run it through
    // an ASN.1 decoder such as https://lapo.it/asn1js/.


    const header = key_hex.substring(0, 52);

    assert.equal(header, "3059301306072a8648ce3d020106082a8648ce3d030107034200",
        "ECDSA Signature Verification: public key header is malformed for secp256r1. This is the public key you're trying to decode: \"" + pub_key_base64 + '"');


    const body = key_hex.substring(52, key_hex.length);


    const ec = new EC('p256');


    // Decodes the body into x and y.

    return ec.keyFromPublic(body, 'hex');

};




const import_private_key_from_base64 = priv_key_base64 => {


    const key_bin = Buffer.from(priv_key_base64, 'base64');

    const key_hex = key_bin.toString('hex');

     // Like the header above. This one encodes:

    // - INTEGER 1
    // - OCTET STRING (32 byte) - PRIVATE KEY
    // - OBJECT IDENTIFIER 1.3.132.0.10 secp256k1 (SECG (Certicom) named elliptic curve)
    // - PUBLIC KEY

    // specified here: https://tools.ietf.org/html/rfc5915

    const header1 = key_hex.substring(0, 14);

    assert.equal(header1, "30770201010420",
        "ECDSA Private Key Import: private key header is malformed. This is the private key you're trying to decode: \"" + priv_key_base64 + '"');

    const header2 = key_hex.substring(78, 78 + 34)


    assert.equal(header2, "a00a06082a8648ce3d030107a144034200",
        "ECDSA Private Key Import: private key header is malformed. This is the private key you're trying to decode: \"" + priv_key_base64 + '"');


    const body = key_hex.substring(14, 14 + 64);

    const ec = new EC('p256');


    // Decodes the body into x and y.

    return ec.keyFromPrivate(body, 'hex');

};


const get_pem_private_key = ec => {

    return Buffer.from(
            '30770201010420' + ec.getPrivate('hex') + 'a00a06082a8648ce3d030107a144034200' + ec.getPublic('hex'),
            'hex').toString('base64');

};


const random_key = entropy => {

    const ecdsa = new EC('p256');
    const keys = ecdsa.genKeyPair({
        entropy
    });

    console.log(keys.getPublic('hex'));

    return get_pem_private_key(keys);

};  

module.exports = {
    verify,
    sign,
    pub_from_priv,
    import_private_key_from_base64,
    import_public_key_from_base64,
    get_pem_private_key,
    random_key
};