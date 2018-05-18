
const grpc = require('grpc');

const proto_path = __dirname + '/service.proto';

const protocol = grpc.load(proto_path);


const connection = new protocol.Bluzelle('localhost:8100', 
        grpc.credentials.createInsecure());

connection.Create({
    header: {
        db_uuid: '123-456-7'
    },
    key: 'whoa',
    value: 'dude'
}, function(err, response) { 

    if(err) {
        throw err;
    }


    connection.Delete({
        header: {
            db_uuid: '123-456-7'
        },
        key: 'whoa',
    }, function(err, response) { 

        if(err) {
            throw err;
        }


        connection.Keys({
            header: {
                db_uuid: '123-456-7'
            }
        }, function(err, response) { 

            if(err) {
                throw err;
            }


            connection.RaftState({}, function(err, response) { 

                if(err) {
                    throw err;
                }


                debugger;
                

            });
                

        });
        

    });


});