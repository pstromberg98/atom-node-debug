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
      const runMessage = {
        method: 'Runtime.runIfWaitingForDebugger',
      };

      this.messenger.send(runMessage);

      this.enable();
      // this.resume();
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

  public getPossibleBreakpoints(start, end?): Promise<Debugger.Location[]> {
    return this.messenger.send(DebugCommand.create('getPossibleBreakpoints', {
      start,
      end,
    })).then((result) => {
      return (result || {} as any).locations || [];
    });
  }

  public onScriptParsed(scriptFile): Promise<any> {
    return new Promise((resolve, reject) => {
    });
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
