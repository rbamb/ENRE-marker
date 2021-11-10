import * as vscode from 'vscode';
import path from 'path';
import open from 'open';

export type commands = 'open-url-in-browser' | 'validate-path';

export interface localMsgType {
  command: commands,
  payload: any,
}

export const msgHandler:
  Record<
    commands,
    (payload: any, postMessage: (message: any) => Thenable<boolean>) =>
      ((payload: any, postMessage: (message: any) => Thenable<boolean>) => never) | any
  > = {
  'open-url-in-browser': (payload: string) => open(payload),

  'validate-path': (payload: string) => {
    if (!path.isAbsolute(payload)) {
      return {
        result: 'error',
        message: 'Path is not absolute'
      };
    }
  }
};
