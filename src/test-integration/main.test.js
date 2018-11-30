const bluzelle = require('../main');


it('should do a create', async () => {

    const bz = bluzelle('ws://localhost:51010', 'MHQCAQEEIFH0TCvEu585ygDovjHE9SxW5KztFhbm4iCVOC67h0tEoAcGBSuBBAAKoUQDQgAE9Icrml+X41VC6HTX21HulbJo+pV1mtWn4+evJAi8ZeeLEJp4xg++JHoDm8rQbGWfVM84eqnb/RVuIXqoz6F9Bg==', 'test123');

    await bz.create('hello', 'world');

});