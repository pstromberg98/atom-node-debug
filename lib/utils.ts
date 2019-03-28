import * as path from 'path';
import * as cp from 'child_process';
import * as fs from 'fs';

export class Utils {
  public static getNodePath() {
    // Add support for win32 PATH
    const env = extendObject({}, process.env);
    const which = '/usr/bin/which';
    let path;
    if (fs.existsSync(which)) {
      path = cp.execSync(`${which} node`, {
        shell: '/bin/bash',
        env,
      }).toString();
    }

    return path;
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
