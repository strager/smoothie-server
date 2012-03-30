var util = require('util');
var events = require('events');

function DataStore() {
    events.EventEmitter.call(this);

    this.data = Object.create(null); // name => x => y
}

util.inherits(DataStore, events.EventEmitter);

DataStore.prototype.update = function update(name, x, y) {
    if (!this.data[name]) {
        this.data[name] = Object.create(null);
    }

    this.data[name][x] = y;

    this.emit('update', name, x, y);
};

module.exports = DataStore;
