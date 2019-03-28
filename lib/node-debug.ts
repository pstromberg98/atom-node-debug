'use babel';

import { CompositeDisposable } from 'atom';
import { Debugger } from './v8-protocol/debugger';
import { Utils } from './utils';
import ProcessFinder from './process-finder';
import * as cp from 'child_process';

const http = require('http');
const Net = require('net');
var breakPoints = {};
var sequence = 1;

export async function activate(state) {
  const nodePath = Utils.getNodePath();
  // cp.execSync(`${nodePath}`);
  // console.log(nodePath);

  // const finder = new ProcessFinder();
  // finder.find().then((url) => {
  //   const socket = new WebSocket(url as any);
  //   const _debugger = new Debugger(socket);
  // });
};

export async function deactivate() {
  console.log('Deactivating!');
}
