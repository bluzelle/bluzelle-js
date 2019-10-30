const http = require('http');

const fs = require('fs');

const peerslist = fs.readFileSync(__dirname + '/../swarmDB/local/nodes/swarm0.json');


http.createServer((req, res) => {

  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end(peerslist);

}).listen(8080);
