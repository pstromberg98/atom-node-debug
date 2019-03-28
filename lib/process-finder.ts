'use babel';
const http = require('http');

export default class ProcessFinder {
  constructor() {
  }

  find() {
    return new Promise((resolve, reject) => {
      http.get({
        hostname: '127.0.0.1',
        port: 9229,
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
