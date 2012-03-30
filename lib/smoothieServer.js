var util = require('util');
var net = require('net');
var events = require('events');

function SmoothieConnection(socket) {
    events.EventEmitter.call(this);

    this.socket = socket;
    this.socket.setEncoding('utf8');

    this.buffer = '';
}

util.inherits(SmoothieConnection, events.EventEmitter);

SmoothieConnection.attach = function attach(socket) {
    var conn = new SmoothieConnection(socket);
    socket.on('data', function on_data(data) {
        conn.buffer += data;
        conn.processBuffer();
    });
    return conn;
};

SmoothieConnection.prototype.writeMOTD = function writeMOTD() {
    this.writeComment('Smoothie Server; version=0.0.0');
};

SmoothieConnection.prototype.writeComment = function writeComment(text) {
    this.socket.write('#' + text + '\n');
};

SmoothieConnection.prototype.writeMessage = function writeMessage(data) {
    this.socket.write(JSON.stringify(data) + '\n');
};

SmoothieConnection.prototype.processBuffer = function processBuffer() {
    var messageEndIndex = this.buffer.indexOf('\n');
    if (messageEndIndex < 0) {
        return;
    }

    var message = this.buffer.slice(0, messageEndIndex).trim();
    if (message.slice(0, 1) === '#') {
        // Comment; ignore
    } else {
        try {
            var data = JSON.parse(message);
            this.emit('data', data);
        } catch (e) {
            this.writeMessage({ "ok": false, "err": e.message });
            // Continue
        }
    }

    this.buffer = this.buffer.slice(messageEndIndex + 1);
    this.processBuffer();
};

SmoothieConnection.prototype.respond = function respond(originalMessage, response) {
    var responseObject = { };
    Object.keys(response).forEach(function (key) {
        responseObject[key] = response[key];
    });

    if (typeof originalMessage['seq'] === 'number') {
        responseObject['seq'] = originalMessage['seq'];
    }

    this.writeMessage(responseObject);
};

function create(dataStore) {
    return net.createServer(function on_smoothieConnection(conn) {
        var smoothie = SmoothieConnection.attach(conn);
        smoothie.writeMOTD();

        smoothie.on('data', function on_data(data) {
            if (!('command' in data)) {
                smoothie.respond(data, {
                    "ok": false,
                    "err": "Missing required parameter: command"
                });
                return;
            }

            switch (data['command']) {
            case 'update':
                var ok = [ 'x', 'y', 'name' ].every(function (paramName) {
                    if (paramName in data) {
                        return true;
                    } else {
                        smoothie.respond(data, {
                            "ok": false,
                            "err": "Missing required parameter: " + paramName
                        });
                        return false;
                    }
                });

                if (ok) {
                    dataStore.update(data['name'], data['x'], data['y']);
                    smoothie.respond(data, { "ok": true });
                }

                break;

            default:
                smoothie.respond(data, {
                    "ok": false,
                    "err": "Unknown command: " + data['command']
                });
                break;
            }
        });
    });
}

exports.create = create;
