import { TextEditor } from 'atom';
import { DebuggerClient } from './v8-protocol/debugger-client';
import { GutterView } from './views/gutter-view';
import { Utils } from './utils';
import { take, filter } from 'rxjs/operators';
import * as _ from 'lodash';

export class DebugSession {
  private breakpoints = {};
  private breakpointMarkers = {};
  private scriptUrls = {};
  private lineDecoration = null;
  private currentScope;
  private gutterView: GutterView;

  constructor(private _debugger: DebuggerClient) {
    _debugger.runIfWaitingForDebugger();

    _debugger.onPause$.subscribe((event) => this.onDebuggerPause(event));
    _debugger.onResume$.subscribe((event) => this.onDebuggerResume(event));
    _debugger.onScriptParse$
      .pipe(
        filter((e) => Utils.getFileFromAbsPath(e.url) === 'test1.js'),
        take(1))
      .subscribe((event) => this.onScriptParse(event));

    this.gutterView = new GutterView();
    this.gutterView.setup();
    this.gutterView.onLineClicked$
      .subscribe((event) => this.onGutterLineClick(event));
  }

  private addBreakPoint(url, editorId, lineNumber) {
    const existingBreakpoint = this.breakpointMarkers[`${editorId}:${lineNumber}`];
    if (!existingBreakpoint) {
      console.log(`%cSetting Breakpoint @ %c${url}:${lineNumber}`, 'color: blue', 'color: black');
      this._debugger.setBreakpointByUrl(lineNumber, url).then((event) => {
        if (event) {
          this.breakpointMarkers[`${editorId}:${lineNumber}`] =
            this.gutterView.setBreakpointMarker(editorId, lineNumber);
          this.breakpoints[`${url}:${editorId}:${lineNumber}`] = event.breakpointId;
        }
      });
    } else {
      console.log(`%cRemoving Breakpoint @ %c${url}:${lineNumber}`, 'color: red', 'color: black');
      this.gutterView.removeBreakpointMarker(this.breakpointMarkers[`${editorId}:${lineNumber}`]);
      this.breakpointMarkers[`${editorId}:${lineNumber}`] = null;

      this._debugger
        .removeBreakpoint(this.breakpoints[`${url}:${editorId}:${lineNumber}`])
        .then(() => {
          this.breakpoints[`${url}:${editorId}:${lineNumber}`] = null;
        });
    }
  }

  private onGutterLineClick(event) {
    this.addBreakPoint(event.url, event.editorId, event.lineNumber);
  }

  private onDebuggerResume(event) {
    if (this.lineDecoration) {
      this.lineDecoration.destroy();
      this.lineDecoration = null;
    }
  }

  private onDebuggerPause(event) {
    console.log(event);
    if (!event) {
      return;
    }

    if (event.callFrames) {
      const topCallFrame = event.callFrames[0];
      const location = topCallFrame.location;
      const url = this.scriptUrls[location.scriptId];
      if (url) {
        const lineNumber = location.lineNumber;
        const columnNumber = location.columnNumber;

        atom.workspace.open(url).then((editor: TextEditor) => {
          _.forEach(editor.getCursors(), (cursor) => {
            cursor.setScreenPosition([+lineNumber, +columnNumber], {
              autoScroll: true,
            })
          });

          if (this.lineDecoration) {
            this.lineDecoration.destroy();
          }

          const marker = editor
            .markScreenPosition([+lineNumber, +columnNumber]);

          this.lineDecoration = editor.decorateMarker(marker, {
            type: 'line' ,
            class: 'breakpoint-line',
          });
        });
      }
    }

    if (event.hitBreakpoints && event.hitBreakpoints.length) {
      const firstBreakpoint = event.hitBreakpoints[0];
      const splitBreakpoint = firstBreakpoint.split(':');
      const script = splitBreakpoint[0];
      const lineNumber = splitBreakpoint[1];
      const columnNumber = splitBreakpoint[2];

      if (event.callFrames) {
        const scopeChain = event.callFrames[0].scopeChain;
        if (scopeChain) {
          const localObject = scopeChain.find((s) => s.type === 'local');
          if (localObject && localObject.object) {
            this._debugger.getProperties(localObject.object.objectId).then((properties) => {
              console.log('Properties: ', properties);
            });
          }
        }
      }
    }
  }

  private onScriptParse(event) {
    if (!event) {
      return;
    }

    if (event && event.url) {
      this.scriptUrls[event.scriptId] = event.url;
    }

    this._debugger.getPossibleBreakpoints({
      scriptId: event.scriptId+'',
      lineNumber: 0,
    }).then((possibleBreakpoints) => {
      console.log(possibleBreakpoints);
    });
  }
}
