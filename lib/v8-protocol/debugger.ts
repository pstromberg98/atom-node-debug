import Messenger from './messenger';

export interface IDebugger {
  enable();
  disable();
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
        console.log(data.params.url);
        console.log(data.params.sourceMap);
      });

      this.messenger.send(runMessage);

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
}

class DebugCommand {
  public static create(method, params?) {
    return {
      method: `Debugger.${method}`,
      params,
    };
  }
}
