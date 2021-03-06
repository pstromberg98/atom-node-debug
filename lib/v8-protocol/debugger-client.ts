import Messenger from './messenger';
import { Utils } from '../utils';
import { Protocol } from 'devtools-protocol';
import { Observable, BehaviorSubject, ReplaySubject } from 'rxjs';
import Debugger = Protocol.Debugger;

export class DebuggerClient {
  public readonly onPause$: Observable<Debugger.PausedEvent>;
  public readonly onResume$: Observable<null>;
  public readonly onScriptParse$: Observable<Debugger.ScriptParsedEvent>;
  public readonly onScriptFailedToParse$: Observable<Debugger.ScriptFailedToParseEvent>;
  public readonly onBreakPointResolve$: Observable<Debugger.BreakpointResolvedEvent>;

  private messenger: Messenger;
  private breakpoints = {};

  // TODO: Reduce redundancy here
  constructor(socket: WebSocket) {
    this.messenger = new Messenger(socket);
    this.onPause$ = Observable.create((observer) => {
      this.messenger.on('Debugger.paused', (event) => {
        if (event && event.params) {
          observer.next(event.params);
        }
      });
    });

    this.onScriptParse$ = Observable.create((observer) => {
      this.messenger.on('Debugger.scriptParsed', (event) => {
        if (!event || !event.params) {
          return;
        }

        observer.next(event.params);
      });
    });

    this.onBreakPointResolve$ = Observable.create((observer) => {
      this.messenger.on('Debugger.breakpointResolved', (event) => {
        if (!event || !event.params) {
          return;
        }

        observer.next(event.params);
      });
    });

    this.onScriptFailedToParse$ = Observable.create((observer) => {
      this.messenger.on('Debugger.onScriptFailedToParse', (event) => {
        if (event && event.params) {
          observer.next(event.params);
        }
      });
    });

    this.onResume$ = Observable.create((observer) => {
      this.messenger.on('Debugger.resumed', (event) => {
        if (event && event.params) {
          observer.next(event.params);
        }
      });
    });

    this.messenger.on('open', () => {
      this.enable();
    });
  }

  public enable() {
    return this.messenger.send(DebugCommand.create('enable'));
  }

  public disable() {
    return this.messenger.send(DebugCommand.create('disable'));
  }

  public pause() {
    return this.messenger.send(DebugCommand.create('pause'));
  }

  public resume() {
    return this.messenger.send(DebugCommand.create('resume'));
  }

  public setBreakpoint(location: Debugger.Location, condition?: string) {
    return this.messenger.send(DebugCommand.create('setBreakpoint', {
      location,
      condition,
    }));
  }

  // TODO: Add the rest of the parameters
  public setBreakpointByUrl(lineNumber, url): Promise<{breakpointId: string}> {
    return this.messenger.send(DebugCommand.create('setBreakpointByUrl', {
      lineNumber,
      url,
    }));
  }

  public getPossibleBreakpoints(start, end?): Promise<Debugger.Location[]> {
    return this.messenger.send(DebugCommand.create('getPossibleBreakpoints', {
      start,
      end,
    })).then((result) => {
      return (result || {} as any).locations || [];
    });
  }

  public removeBreakpoint(breakpointId) {
    return this.messenger.send(DebugCommand.create('removeBreakpoint', {
      breakpointId,
    }));
  }

  public stepOver() {
    return this.messenger.send(DebugCommand.create('stepOver'));
  }

  public getProperties(objectId) {
    return this.messenger.send(RuntimeCommand.create('getProperties', {
      objectId,
    })).then((response) => {
      return (response || {}).result;
    });
  }

  public runIfWaitingForDebugger() {
    return this.messenger.send(RuntimeCommand.create('runIfWaitingForDebugger'));
  }
}

class DebugCommand {
  public static create(method, params?) {
    return {
      method: `Debugger.${method}`,
      params,
    };
  }
}

class RuntimeCommand {
  public static create(method, params?) {
    return {
      method: `Runtime.${method}`,
      params,
    };
  }
}
