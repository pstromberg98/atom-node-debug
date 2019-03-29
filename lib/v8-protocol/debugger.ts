import Messenger from './messenger';
import { Utils } from '../utils';

export interface IDebugger {
  enable();
  disable();
  pause();
  resume();
}

export class Debugger implements IDebugger {
  private messenger: Messenger;

  constructor(socket: WebSocket) {
    this.messenger = new Messenger(socket);

    this.messenger.on('open', () => {
      const runMessage = {
        method: 'Runtime.runIfWaitingForDebugger',
      };

      this.messenger.on('Debugger.scriptParsed', (data) => {
        if (data && data.params) {
          console.log(data.params.url);
          if (data.params.sourceMap) {
            console.log(data.params.sourceMap);
          }
        }
      });

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

  public setBreakpoint(location: ILocation, condition?: string) {
    return this.messenger.send(DebugCommand.create('setBreakpoint', {
      location,
      condition,
    }));
  }

  public getPossibleBreakpoints(start, end?): ILocation[] {
    return this.messenger.send(DebugCommand.create('getPossibleBreakpoints', {
      start,
      end,
    })).then((response) => {
      if (response.result) {
        return response.result.locations || [];
      } else {
        return [];
      }
    });
  }

  public onScriptParsed(scriptFile) {
    return new Promise((resolve, reject) => {
      this.messenger.on('Debugger.scriptParsed', (data) => {
        if (!data || !data.params) {
          return;
        }

        if (Utils.getFileFromAbsPath(data.params.url) === scriptFile) {
          resolve(data.params);
        }
      });
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
