const net = require('net');

const port = process.argv[2] || 5000; // Default to 5000 if not provided

const server = net.createServer();
server.once('error', function(err) {
    if (err.code === 'EADDRINUSE') {
        console.log(`Port ${port} is in use (backend may be running on this port).`);
    } else {
        console.log(`Error checking port:`, err);
    }
    process.exit();
});
server.once('listening', function() {
    console.log(`Port ${port} is free (no backend running on this port).`);
    server.close();
    process.exit();
});
server.listen(port);