define([ ], function () {
    var SmoothieClient = sp.Class.create('SmoothieClient', sp.EventDispatcher, {
        constructor: function SmoothieClient_(socket) {
            this.socket = socket;
        },

        properties: {
            lastHeapSnapshot: null,
            socket: null
        },

        statics: {
            connect: function connect(host, port) {
                host = host || window.location.hostname;
                port = port || 9006;

                return new SmoothieClient(new sp.Socket(host, port));
            }
        },

        prebound: {
            tick: function tick() {
                var date = Date.now();

                var heapSnapshot = sp.profiler.getHeapSnapshot();
                this.sendUpdate("total objects", date, heapSnapshot.objects.length);

                if (this.lastHeapSnapshot) {
                    var diff = this.lastHeapSnapshot.getChanges(heapSnapshot);
                    this.sendUpdate("objects added", date, diff.added.length);
                    this.sendUpdate("objects removed", date, diff.removed.length);
                }

                this.lastHeapSnapshot = heapSnapshot;

                var dos = 0;
                heapSnapshot.objects.forEach(function (object) {
                    if (object instanceof sp.DisplayObject) {
                        ++dos;
                    }
                });
                this.sendUpdate("DisplayObject count", date, dos);

                var offScreenSnapshot = sp.profiler.getOffScreenSnapshot();
                this.sendUpdate("off-screen DisplayObject count", date, offScreenSnapshot.objects.length);

                var trafficSnapshot = sp.profiler.getTrafficCommandCount();
                this.sendUpdate("traffic amount", date, trafficSnapshot);

                this.socket.flush();
            },

            sendMessage: function sendMessage(message) {
                this.socket.writeUTFBytes(
                    JSON.stringify(message) + '\n'
                );
            },

            sendUpdate: function sendUpdate(name, x, y) {
                this.sendMessage({
                    "command": "update",
                    "name": name,
                    "x": x,
                    "y": y
                });
            }
        }
    });

    return SmoothieClient;
});
