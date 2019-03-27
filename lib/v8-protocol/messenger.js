'use babel';

export default class Messenger {

  constructor(socket) {
    this.socket = socket;
    this.callbacks = {};
    this.events = {};
    this.seq = 0;

    socket.onopen = (event) => {
      if (this.events['open']) {
        this.events['open'].forEach((cb) => cb());
      }
    };

    socket.onmessage = (message) => {
      if (!message) {
        return;
      }

      const data = JSON.parse(message.data);
      if (data && this.callbacks[data.id]) {
        this.callbacks[data.id](data);
        this.callbacks[data.id] = null;
        delete this.callbacks[data.id];
      }

      if (this.events && this.events[data.method]) {
        if (this.events[data.method]) {
          this.events[data.method].forEach((cb) => cb(data));
        }
      }
    };
  }

  send(data) {
    this.seq++;
    const seq = this.seq;
    data.id = seq;

    let outerResolve;
    this.callbacks[seq] = (message) => {
      outerResolve(message);
    };

    this.socket.send(JSON.stringify(data));

    return new Promise((resolve, reject) => {
      outerResolve = resolve;
    });
  }

  on(event, cb) {
    const events = this.events[event];
    if (!events) {
      this.events[event] = [];
    }

    this.events[event].push(cb);
  }
}

function Command(method) {
  return {
    method: method,
  }
}
