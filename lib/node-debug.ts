'use babel';

import { CompositeDisposable } from 'atom';
import Messenger from './v8-protocol/messenger';
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
    const messenger = new Messenger(socket);

    messenger.on('open', () => {
      const message = {
        method: 'Runtime.runIfWaitingForDebugger',
      };

      messenger.send(message);

      const enableMessage = {
        method: 'Debugger.enable',
      };

      const pauseMessage = {
        method: 'Debugger.pause',
      };

      messenger.on('Debugger.scriptParsed', (data) => {
        console.log(data);
      });

      messenger.send(enableMessage).then((response) => {
          console.log(response);
        messenger.send(pauseMessage).then((pauseResponse) => {
          console.log(pauseResponse);
        });
      });

    });
  });

  atom.workspace.observeTextEditors((editor) => {
    editor.getGutters().forEach((gutter) => {
      // gutter.onMouseDown = (lineData) => {
      //   const marker = editor.markBufferPosition([lineData.screenRow, lineData.bufferRow]);
      //   let decoration = breakPoints[lineData.bufferRow];
      //   if (!decoration) {
      //     decoration = gutter.decorateMarker(marker, {
      //       class: 'break-point',
      //     });
      //
      //     breakPoints[lineData.bufferRow] = decoration;
      //   } else {
      //     console.log(decoration);
      //     decoration.destroy();
      //     breakPoints[lineData.bufferRow] = null;
      //   }
      // };

      // gutter.onMouseMove = (lineData, e) => {
      //   console.log(document);
      // };
    });

    // const popup = document.createElement('div');
    // popup.style.position = 'fixed';
    // popup.style.zIndex = 1000;
    // popup.style.width = '100px';
    // popup.style.height = '100px';
    // popup.style.backgroundColor = 'white';
    // popup.style.borderRadius = '3px';
    // popup.style.boxShadow = 'black 0px 4px 5px';
    // popup.style.left = '50%';
    // popup.style.top = '50%';
    // popup.innerHTML = 'Neat';
    //
    // const workspaceElem = document.querySelector('atom-workspace');
    // workspaceElem.appendChild(popup);
  });
};

export async function deactivate() {

}