'use babel';

import { CompositeDisposable } from 'atom';
import { Debugger } from './v8-protocol/debugger';
import ProcessFinder from './process-finder';

const http = require('http');
const Net = require('net');
var breakPoints = {};
var sequence = 1;

export async function activate(state) {
  console.log('Test!');
  const finder = new ProcessFinder();
  finder.find().then((url) => {
    const socket = new WebSocket(url as any);
    const _debugger = new Debugger(socket);
  });
};

export async function deactivate() {
  console.log('Deactivating!');
}
