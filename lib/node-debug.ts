'use babel';

import { CompositeDisposable } from 'atom';
import { Debugger } from './v8-protocol/debugger';
import { Utils } from './utils';
import ProcessFinder from './process-finder';
import * as cp from 'child_process';
import * as fs from 'fs';

const http = require('http');
const Net = require('net');
const port = 5000;
let cpSpawn;
let finder;
var breakPoints = {};
var sequence = 1;

export async function activate(state) {
  const nodePath = Utils.getNodePath();
  console.log(__dirname);
  const command =
    `${nodePath} --inspect-brk ${__dirname}/\.\./\.\./tests/test1.js`;
  const env = extendObject({}, process.env);

  // cp.spawn(nPath);
  cpSpawn = cp.spawn(nodePath, [`--inspect-brk=${port}`, `${__dirname}/\.\./\.\./tests/test1.js`], {
    env,
  });

  cpSpawn.stdout.on('data', (data) => {
    if (data) {
      console.log('STDOUT: \n', data.toString());
    }
  });

  cpSpawn.stderr.on('data', (data) => {
    if (data) {
      console.log(data.toString());

      if (!finder) {
        finder = new ProcessFinder();
        finder.find('127.0.0.1', port).then((url) => {
          const socket = new WebSocket(url as any);
          const _debugger = new Debugger(socket);

          _debugger.onScriptParsed('test1.js').then((data) => {
            console.log('Here: ', data);
            _debugger.getPossibleBreakpoints({
              scriptId: data.scriptId+'',
              lineNumber: 0,
            }).then((possibleBreakpoints) => {
              console.log(possibleBreakpoints);
              if (possibleBreakpoints && possibleBreakpoints.length > 1) {
                _debugger.setBreakpoint(possibleBreakpoints[3])
                  .then((breakpoint) => {
                    console.log(breakpoint);
                    _debugger.resume();
                    setTimeout(() => {
                      _debugger.resume();
                    }, 2000);
                  });
              }
            });
          });
        });
      }
    }
  });
};

export async function deactivate() {
  console.log('Deactivating!');
  if (cpSpawn) {
    console.log('Killing any active child_process');
    cpSpawn.kill();
  }
}

export function extendObject<T>(toObject: T, fromObject: T): T {
    for (let key in fromObject) {
        if (fromObject.hasOwnProperty(key)) {
            toObject[key] = fromObject[key];
        }
    }
    return toObject;
}
