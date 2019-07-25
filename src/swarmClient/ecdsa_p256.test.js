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


describe('ECDSA Verification', () => {

    let msg_base64;
    let sig_base64;
    let pub_key_base64;


    // How to generate these test cases with OpenSSL:

    // > openssl ecparam -name secp256r1 -genkey -noout -out alice_priv_key.pem
    // > openssl ec -in alice_priv_key.pem -pubout -out alice_pub_key.pem

    // > echo "my secret message" > msg.txt
    // > openssl dgst -sha256 -sign alice_priv_key.pem msg.txt > signature.bin

    // > openssl base64 < msg.txt
    // > openssl base64 < signature.bin

    // pub_key_base64 is embedded inside alice_pub_key.pem


    it('1', () => {

        msg_base64 = "bXkgc2VjcmV0IG1lc3NhZ2UK";
        sig_base64 = "MEQCIDLOINBqN0FgJb/fz1aLMVfRYvxMvcP1GBil6Qhzvj7DAiAYeaGTdr/kaNuzapuaBI8CIC+FSI3NzM2lVGr4xYMX1Q==";
        pub_key_base64 = "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEhk+qdNDFSgjmNxvhB9LzBjjK59++MI0cVLSFwH1460y3ADYG/oaqsxNh8Kc9HvP9MGZAOddcQPgA9KfAo2IrEQ==";

        f();

    });


    it('2', () => {

        msg_base64 = "RG9uYWxkIFRydW1wCg==";
        sig_base64 = "MEYCIQDykPIMU1mD79cACNZAnPqeBEkGs6ireqKoTJ3kZN/48AIhAOg09HV7S2I7bVqws18W6RFe7q4HVRpCA5G5vLIGeCh7";
        pub_key_base64 = "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEUCZ5mxnfxdQK/1z3+rmqYvgnQn4KnB3oOGdQ/oF3AXWMJK0jra2nCmtIcUV3mcNaursMlKuRrkoUDloLezpyXw==";

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
        priv_key_base64 = "MHcCAQEEID3tAyrmePvGCV0tdVNBlLfeKW9tzo8O+ksYPQx8sFkQoAoGCCqGSM49AwEHoUQDQgAEAohAsgUkgA5v39HV6KeN21T4q95xEwi9MVb78cqpDkkxSmlYE/b8173bCB6V/GlOaDyzjUSidUY6h3l5b9i2bw==";

        f();

    });

    it('2', () => {

        msg_base64 = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
        priv_key_base64 = "MHcCAQEEIPVolbv5L/Toru7ffRwSQf69iXXy/90titBSg258mIyToAoGCCqGSM49AwEHoUQDQgAEaen8dJGiR3JbFVlCf9KLcivNtM2/d80fuI7XTSx+JhBOAURLryuEmD9shb/vZXftOZDH1G7pMPzGQKdvuHoWNA==";

        f();

    });

    it('3', () => {

        msg_base64 = "120|MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAE2FcxJdkJ+nrjhkDRiPQ6mFf5OOAKeWedOukyim0UveUVt0CvE1UAQHTBlQLN2CRhiKdStOduOU6IjCYcFdX+rg==2|100|1|0";
        priv_key_base64 = "MHcCAQEEINEP9JKZorJ0QQ4F7LZUDQg8Z/YUXor478WZTwTCAugIoAoGCCqGSM49AwEHoUQDQgAE08fyoFd9+GfKXwxeu3euD2mpFKnAagVqBqqWzNgu7520Ig8RCmoNASH/s4Vu7HaJSDIHXpozmtHhnOr4TGZf/Q==";

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

        const priv_key_base64 = "MHcCAQEEIGqgOPCPj4WNInx08fRzrOS7YnDYjb5Wr3Obzkg3B6mjoAoGCCqGSM49AwEHoUQDQgAE79SZP8fwH41w625SdSlgppnb9kM3sjGjIvTtMN3bSRprhzG+koe+pChwR/0zi2TCZbT38hGS2aShwwCQmr+rRg==";
        const pub_key_base64 = "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE79SZP8fwH41w625SdSlgppnb9kM3sjGjIvTtMN3bSRprhzG+koe+pChwR/0zi2TCZbT38hGS2aShwwCQmr+rRg==";

        const pub = pub_from_priv(priv_key_base64);

    });

});


describe('ECDSA Generate Private PEM', () => {

    it('', () => {

        const priv_key_base64 = "MHcCAQEEIGR/5ZSlaD/vPWH1+T4fmHvT2aLCx+EmzCoRkI8uhIwzoAoGCCqGSM49AwEHoUQDQgAEsYBUmvc/EAY69Uttj6y7FQT9UCWZS+EMt07gz1hLNeOoYGA+zMDUHU3hlyK//41/rk4waOr8iURz9YCMkp6eAg==";

        const ec = import_private_key_from_base64(priv_key_base64);


        assert.equal(get_pem_private_key(ec), priv_key_base64);

    });

}); 
