var path = require('path');
var http = require('http');
var fs = require('fs');

var socketIO = require('socket.io');

var pub = path.join(__dirname, '..', 'pub');

function create(dataStore) {
    var httpServer = http.createServer(function on_httpRequest(req, res) {
        // TODO Proper static server
        var allowed = {
            '/': 'index.html',
            '/index.html': 'index.html',
            '/smoothie.js': 'smoothie.js'
        };
        if (!Object.prototype.hasOwnProperty.call(allowed, req.url)) {
            res.writeHead(404, {
                'content-type': 'text-plain'
            });
            res.end("404 not found");
            return;
        }

        res.writeHead(200, {
            'content-type': 'text/html' // FIXME
        });

        var filePath = path.join(pub, allowed[req.url]);
        var fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    });

    var connections = [ ];
    dataStore.on('update', function on_update(name, x, y) {
        connections.forEach(function (connection) {
            connection.emit('update', {
                "name": name,
                "x": x,
                "y": y
            });
        });
    });

    var io = socketIO.listen(httpServer);
    io.sockets.on('connection', function on_connection(socket) {
        connections.push(socket);

        socket.on('disconnect', function on_disconnect() {
            var index = connections.indexOf(socket);
            if (index < 0) {
                console.error("Internal error: attempt made to disconnect a non-tracked connection");
                return;
            }

            connections.splice(index, 1);
        });
    });

    return httpServer;
}

exports.create = create;
