'use babel';
const http = require('http');

export default class ProcessFinder {
  constructor() {
  }

  find(host, port) {
    return new Promise((resolve, reject) => {
      http.get({
        hostname: host,
        port: port,
        path: '/json/list',
        agent: false,
      }, (res) => {
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          const data = JSON.parse(rawData);
          if (data && data[0]) {
            resolve(data[0].webSocketDebuggerUrl);
          }
        });
      });
    });
  }
}
