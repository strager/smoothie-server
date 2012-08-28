package spaceport {
    import flash.net.Socket;

    public class SmoothieClient {
        private var socket:Socket;

        public function SmoothieClient(socket:Socket) {
            this.socket = socket;
        }

        public static function connect(host:String, port:uint = 9006):SmoothieClient {
            return new SmoothieClient(
                new Socket(host, port)
            );
        }

        private function sendMessage(message:Object):void {
            this.socket.writeUTFBytes(
                JSON.stringify(message) + '\n'
            );
        }

        public function sendUpdate(name:String, x:Number, y:Number):void {
            this.sendMessage({
                "command": "update",
                "name": name,
                "x": x,
                "y": y
            });
        }
    }
}
