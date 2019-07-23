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
const { verify, sign, pub_from_priv, import_private_key_from_base64, get_pem_private_key } = require('./ecdsa_p256');


describe.only('ECDSA Verification', () => {

    let msg_base64;
    let sig_base64;
    let pub_key_base64;


    // How to generate these test cases with OpenSSL:

    // > openssl ecparam -name secp256k1 -genkey -noout -out alice_priv_key.pem
    // > openssl ec -in alice_priv_key.pem -pubout -out alice_pub_key.pem

    // > echo "my secret message" > msg.txt
    // > openssl dgst -sha512 -sign alice_priv_key.pem msg.txt > signature.bin

    // > openssl base64 < msg.txt
    // > openssl base64 < signature.bin

    // pub_key_base64 is embedded inside alice_pub_key.pem


    it('1', () => {

        msg_base64 = "bXkgc2VjcmV0IG1lc3NhZ2UK";
        sig_base64 = "MEYCIQCL5tdt4ub/havbxOElhz1QVufBMkwi5fhYohAOWc48ygIhAIUYHZjEACtBtIjVSlrdhCsbBGOolfhnjy5MSiQUgDJj";
        pub_key_base64 = "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEuHKSU6+rzH7okuma0B3DylxeviwiEpAWwIXe5cFQBxJ4aQ+bPyEvJSviNSFhGOJt/kmRrh6WN81gyai4rcX72w==";

        f();

    });


    it('2', () => {

        msg_base64 = "ZG9uYWxkIHRydW1wCg==";
        sig_base64 = "MEYCIQCL5tdt4ub/havbxOElhz1QVufBMkwi5fhYohAOWc48ygIhAIUYHZjEACtBtIjVSlrdhCsbBGOolfhnjy5MSiQUgDJj";
        pub_key_base64 = "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE0gguHw+ppQV2AxaIc1B/meQUifvIWCUn6E0/CVJiE7kovM7Jzze6wu4n30j6ydps2+ZazPZwDTdFJQCcBi+bag==";

        f();

    });

    const f = () => {

        const msg_bin = Buffer.from(msg_base64, 'base64');
        const sig_bin = Buffer.from(sig_base64, 'base64');

        assert(verify(msg_bin, sig_bin, pub_key_base64));


        // Mutate signature 
        sig_bin[43] += 1;

        assert(!verify(msg_bin, sig_bin, pub_key_base64));

    };

});


describe('ECDSA Signing', () => {

    let msg_base64;
    let priv_key_base64;


    it('1', () => {

        msg_base64 = "ChQKEEJlc3REYXRhYmFzZUV2ZXIQKiIqCghzb21lIGtleRIedmVyeSBpbXBvcnRhbnQgZGF0YSBhbmQgc3R1ZmZz";
        priv_key_base64 = "MHQCAQEEIJGS3Ehg1rsVG5MKIfPZ/hWOoBR6hwfWCeQ6cNvSZqWGoAcGBSuBBAAKoUQDQgAEgWZh744sleHAQFvLz3vNFXeE27KMNMjtZqdPfw4kapIIHXSMpyTgvrN3g2hTc3Iaf4ZkuOVJKwwIjTMMgpyC0g==";

        f();

    });

    it('2', () => {

        msg_base64 = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
        priv_key_base64 = "MHQCAQEEID1CnLSlzpRdv0JT9B9zTLAtQ3U75tgaF1zdkJbRCMF/oAcGBSuBBAAKoUQDQgAEOXPEdTs23dLC+DhWxoYX6TAft/Y3zXRfdAZi/VpFsmkI042sbF1uxQ3APtfFNmPFYlBW7blw/BisrkPPJFCxEQ==";

        f();

    });

    it('3', () => {

        msg_base64 = "120|MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAE2FcxJdkJ+nrjhkDRiPQ6mFf5OOAKeWedOukyim0UveUVt0CvE1UAQHTBlQLN2CRhiKdStOduOU6IjCYcFdX+rg==2|100|1|0";
        priv_key_base64 = "MHQCAQEEIPf6MgiFUbvtT+wLCDKrFdO6QPOb9S4lbrhsF3DOhOjhoAcGBSuBBAAKoUQDQgAE2FcxJdkJ+nrjhkDRiPQ6mFf5OOAKeWedOukyim0UveUVt0CvE1UAQHTBlQLN2CRhiKdStOduOU6IjCYcFdX+rg==";

        f();

    });


    const f = () => {

        const msg_bin = Buffer.from(msg_base64, 'base64');

        const sig_bin = sign(msg_bin, priv_key_base64);


        const pub_key_base64 = pub_from_priv(priv_key_base64);

        assert(verify(msg_bin, sig_bin, pub_key_base64));

        // Mutate signature 
        sig_bin[43] += 1;

        assert(!verify(msg_bin, sig_bin, pub_key_base64));

    };

});




describe('ECDSA Generate Public PEM from Private PEM', () => {

    it('', () => {

        const priv_key_base64 = "MHQCAQEEIFNmJHEiGpgITlRwao/CDki4OS7BYeI7nyz+CM8NW3xToAcGBSuBBAAKoUQDQgAEndHOcS6bE1P9xjS/U+SM2a1GbQpPuH9sWNWtNYxZr0JcF+sCS2zsD+xlCcbrRXDZtfeDmgD9tHdWhcZKIy8ejQ==";
        const pub_key_base64 = "MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEndHOcS6bE1P9xjS/U+SM2a1GbQpPuH9sWNWtNYxZr0JcF+sCS2zsD+xlCcbrRXDZtfeDmgD9tHdWhcZKIy8ejQ==";

        const pub = pub_from_priv(priv_key_base64);

    });

});


describe('ECDSA Generate Private PEM', () => {

    it('', () => {

        const priv_key_base64 = "MHQCAQEEIFNmJHEiGpgITlRwao/CDki4OS7BYeI7nyz+CM8NW3xToAcGBSuBBAAKoUQDQgAEndHOcS6bE1P9xjS/U+SM2a1GbQpPuH9sWNWtNYxZr0JcF+sCS2zsD+xlCcbrRXDZtfeDmgD9tHdWhcZKIy8ejQ==";

        const ec = import_private_key_from_base64(priv_key_base64);


        assert.equal(get_pem_private_key(ec), priv_key_base64);

    });

}); 
