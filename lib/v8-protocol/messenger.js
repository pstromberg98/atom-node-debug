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
      if (message && this.callbacks[message.seq]) {
        this.callbacks[message.seq](message);
      }
    };
  }

  send(data) {
    this.seq++;
    const seq = this.seq;
    data.seq = seq;

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
