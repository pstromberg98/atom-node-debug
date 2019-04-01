'use babel';

import { CompositeDisposable, DisplayMarker, TextEditor, Range } from 'atom';
import { DebuggerClient } from './v8-protocol/debugger-client';
import { Utils } from './utils';
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

          // For debugging
          const resume = () => {
            _debugger.resume();
          };

          console.log(resume);

          gutterView.onLineClicked$.subscribe((event) => {
            const existingBreakpoint = breakpoints[`${event.editorId}:${event.lineNumber}`];
            if (!existingBreakpoint) {
              console.log(`%cSetting Breakpoint @ %c${event.url}:${event.lineNumber}`, 'color: blue', 'color: black');
              _debugger.setBreakpointByUrl(event.lineNumber, event.url).then(() => {
                breakpoints[`${event.editorId}:${event.lineNumber}`] =
                  gutterView.setBreakpointMarker(event.editorId, event.lineNumber);
              });
            } else {
              console.log(`%cRemoving Breakpoint @ %c${event.url}:${event.lineNumber}`, 'color: red', 'color: black');
              gutterView.removeBreakpointMarker(breakpoints[`${event.editorId}:${event.lineNumber}`]);
              breakpoints[`${event.editorId}:${event.lineNumber}`] = null;
            }
          });

          _debugger.onPause$.subscribe((event) => {
            console.log(event);
            if (event.hitBreakpoints && event.hitBreakpoints.length) {
              const firstBreakpoint = event.hitBreakpoints[0];
              const splitBreakpoint = firstBreakpoint.split(':');
              const script = splitBreakpoint[0];
              const lineNumber = splitBreakpoint[1];
              const columnNumber = splitBreakpoint[2];

              atom.workspace.open(script).then((editor: TextEditor) => {
                _.forEach(editor.getCursors(), (cursor) => {
                  cursor.setScreenPosition([+lineNumber, +columnNumber], {
                    autoScroll: true,
                  })
                });

                const marker = editor
                  .markScreenPosition([+lineNumber, +columnNumber]);

                editor.decorateMarker(marker, {
                  type: 'line' ,
                  class: 'breakpoint-line',
                });
              });
            }
          });

          _debugger.onScriptParse$
            .pipe(filter((e) => Utils.getFileFromAbsPath(e.url) === 'test1.js'), take(1))
              .subscribe((data) => {
                _debugger.getPossibleBreakpoints({
                  scriptId: data.scriptId+'',
                  lineNumber: 0,
                }).then((possibleBreakpoints) => {
                  _debugger.resume();
                  console.log(possibleBreakpoints);
                  if (possibleBreakpoints && possibleBreakpoints.length > 1) {
                    _debugger.setBreakpointByUrl(1, data.url);
                    // _debugger.setBreakpoint(possibleBreakpoints[3]);
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
