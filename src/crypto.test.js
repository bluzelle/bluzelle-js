const assert = require('assert');
const { verify, sign } = require('./crypto');


it('ECDSA Verification', () => {

    const msg = "ChQKEEJlc3REYXRhYmFzZUV2ZXIQKiIqCghzb21lIGtleRIedmVyeSBpbXBvcnRhbnQgZGF0YSBhbmQgc3R1ZmZz";
    const sig = "MEYCIQD/D2RTOA1i04ww1+745SKiDA1DfF/mc25rShe1ZIv5VwIhANCLAk637b4y/KvUtFf9pr6nRIXlaFd3Gx9XOqwNWgK8";
    const key = "MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAE9Icrml+X41VC6HTX21HulbJo+pV1mtWn4+evJAi8ZeeLEJp4xg++JHoDm8rQbGWfVM84eqnb/RVuIXqoz6F9Bg==";


    const msg_bin = Buffer.from(msg, 'base64');
    const sig_bin = Buffer.from(sig, 'base64');

    assert(verify(msg_bin, sig_bin, key));


    sig_bin[43] += 1;

    assert(!verify(msg_bin, sig_bin, key));

});


it('ECDSA Signing', () => {

    

});