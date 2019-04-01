'use babel';

import { CompositeDisposable, DisplayMarker, TextEditor, Range } from 'atom';
import { DebuggerClient } from './v8-protocol/debugger-client';
import { Utils } from './utils';
import { DebugSession } from './debug-session';
import ProcessFinder from './process-finder';
import { GutterView } from './views/gutter-view';
import { filter, take } from 'rxjs/operators';
import * as cp from 'child_process';
import * as fs from 'fs';
import * as _ from 'lodash';

const http = require('http');
const Net = require('net');
const port = 5000;
let cpSpawn;
let finder;
var sequence = 1;

export async function activate(state) {
  const breakpoints = {};
  const gutterView = new GutterView();
  gutterView.setup();

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
          const _debugger = new DebuggerClient(socket);
          const session = new DebugSession(_debugger);

          // For debugging
          const resume = () => {
            _debugger.resume();
          };

          const getProperties = (objectId) => {
            _debugger.getProperties(objectId).then((resp) => {
              console.log(resp);
            });
          };

          const stepOver = () => {
            _debugger.stepOver();
          };

          console.log('Resume: ', resume);
          console.log('Get Properties: ', getProperties);
          console.log('Step Over: ', stepOver);
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
