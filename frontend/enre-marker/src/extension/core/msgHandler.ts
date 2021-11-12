import * as vscode from 'vscode';
import path from 'path';
import open from 'open';
import { statSync, mkdirSync } from 'fs';
import { exec } from 'child_process';

export type localCommands = 'open-url-in-browser' | 'open-folder' | 'validate-path' | 'git-clone' | 'try-select-project' | 'ready-open-folder';

const { window: { showErrorMessage } } = vscode;

export interface localMsgType {
  command: localCommands,
  payload: any,
}

// TODO: Promisify!!!
export const msgHandler:
  Record<
    localCommands,
    (payload: any, callbackMessage: ({ command, payload }: { command: string; payload: any; }) => Thenable<boolean> | undefined) =>
      ((payload: any, callbackMessage: ({ command, payload }: { command: string; payload: any; }) => Thenable<boolean> | undefined) => never) | any
  > = {
  'open-url-in-browser': (payload: string) => open(payload),

  'open-folder': (payload: string) => open(payload),

  'validate-path': ({ value, pname }: { value: string, pname: string }) => {
    if (!path.isAbsolute(value)) {
      return {
        result: 'error',
        message: 'Path is not absolute'
      };
    }

    try {
      const res = statSync(value);

      if (res.isFile()) {
        return {
          result: 'error',
          message: 'Path can not direct to a file'
        };
      }
    } catch (err: any) {
      if (err.errno === -4058) {
        return {
          /** in UI, warning will be rendered as error and act as error,
           * because a) color of warning is hard to read, b) warning will also block submit operation.
           * so path does not exist, which isn't a really big problem, has to be trated as error.
           */
          result: 'warning',
          message: 'Path does not exist'
        };
      } else {
        showErrorMessage(`Unknown error with errno=${err.errno} and code=${err.code}`);
        return {
          result: 'error',
          message: 'Unknown error'
        };
      }
    }

    try {
      statSync(path.join(value, pname));

      return {
        result: 'error',
        message: 'The project folder may already exist in the given path'
      };
    } catch (err) { }

    return {
      result: 'success'
    };
  },

  'git-clone': ({ absPath, githubUrl, version }: { absPath: string, githubUrl: string, version: string }, callbackMessage) => {
    // create dir if not exist
    try {
      statSync(absPath);
    } catch (err: any) {
      if (err.errno === -4058) {
        mkdirSync(absPath);
      } else {
        showErrorMessage(`Unknown error with errno=${err.errno} and code=${err.code}`);
        return;
      }
    }

    /** not using vscode.window.createTerminal
     * since there is no corresponding API to retrive the output (in stable version)
     */

    /** REMINDER
     * * git only outputs to stderr, if want to retrive output data
     * * do not append . to git checkout, if want to checkout the whole project
     */
    exec(`git clone https://github.com/${githubUrl}.git`, { cwd: absPath }, (err) => {
      if (err) {
        showErrorMessage(err.message);
        callbackMessage({ command: 'return-git-clone', payload: { success: false } });
        return;
      }

      const finalDir = path.join(absPath, githubUrl.split('/')[1]);

      exec(`git checkout ${version}`, { cwd: finalDir }, (err) => {
        if (err) {
          showErrorMessage(err.message);
          callbackMessage({ command: 'return-git-clone', payload: { success: false } });
          return;
        }

        callbackMessage({
          command: 'return-git-clone',
          payload: {
            success: true,
            fsPath: finalDir,
          }
        });
      });
    });
  },

  'try-select-project': ({ version }: { version: string }, callbackMessage) => {
    vscode.window.showOpenDialog({
      canSelectFolders: true,
      canSelectMany: false,
      title: 'Select a directory to existed project',
    })
      .then((value => {
        if (value) {
          let possiblePath = value[0].fsPath;

          exec('git rev-parse --git-dir', { cwd: possiblePath }, (error, stdout) => {
            if (error) {
              showErrorMessage(error.message);
              callbackMessage({
                command: 'return-try-select-project',
                payload: {
                  success: false,
                }
              });
              return;
            }

            // if user select a folder in deeper layer, that is, not the top level folder
            // note that the output is NOT simply '.git', but '.git' with some white chars
            if (!/^\.git/.test(stdout)) {
              possiblePath = path.resolve(possiblePath, '..');
            }

            exec(`git checkout ${version}`, { cwd: possiblePath }, (err) => {
              if (err) {
                showErrorMessage(err.message);
                callbackMessage({
                  command: 'return-try-select-project',
                  payload: {
                    success: false,
                  }
                });
                return;
              } else {

                callbackMessage({
                  command: 'return-try-select-project',
                  payload: {
                    success: true,
                    fsPath: possiblePath,
                  }
                });
              }
            });
          });
        } else {
          callbackMessage({
            command: 'return-try-select-project',
            payload: {
              success: false,
            }
          });
        }
      }), (reason => {
        showErrorMessage(reason);
        callbackMessage({
          command: 'return-try-select-project',
          payload: {
            success: false,
          }
        });
      }));
  },

  'ready-open-folder': ({ fsPath }: { fsPath: string }) => {
    vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(fsPath));
  }
};
