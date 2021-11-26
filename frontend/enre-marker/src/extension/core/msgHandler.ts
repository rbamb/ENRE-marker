import * as vscode from 'vscode';
import path from 'path';
import open from 'open';
import { statSync, mkdirSync } from 'fs';
import { exec } from 'child_process';
import { entityDecorations } from './decorations';

export type localCommands =
  'set-state'
  | 're-login'
  | 'change-layout'
  | 'open-url-in-browser'
  | 'open-folder'
  | 'validate-path'
  | 'git-clone'
  | 'try-select-project'
  | 'ready-open-folder'
  | 'open-file'
  | 'show-entity'
  | 'highlight-entity'
  | 'highlight-relation';

const { window: { showErrorMessage, showWarningMessage } } = vscode;

export interface localMsgType {
  command: localCommands,
  payload: any,
}

let currControledDoc: vscode.TextEditor | undefined = undefined;
let currControledDocTo: vscode.TextEditor | undefined = undefined;

export const msgHandler:
  Record<
    localCommands,
    (
      payload: any,
      {
        setState,
        callbackMessage,
        setLayout,
      }: {
        setState: (state: any) => void,
        callbackMessage: any,
        setLayout: any
      }
    ) => any
  > = {
  'set-state': (payload, { setState }) => setState(payload),

  're-login': () => {
    return Promise.resolve(undefined);
  },

  'change-layout': (mode, { setLayout }) => {
    switch (mode) {
      case 'entity':
        vscode.commands.executeCommand('workbench.action.editorLayoutTwoColumns')
          .then(() => setLayout(vscode.ViewColumn.Two));
        break;
      case 'relation':
        vscode.commands.executeCommand('workbench.action.editorLayoutTwoRowsRight')
          .then(() => setLayout(vscode.ViewColumn.Two));
        break;
      default:
        showWarningMessage(`Unknown layout mode ${mode}`);
    }
  },

  'open-url-in-browser': (payload: string) => {
    open(payload);
    return;
  },

  'open-folder': (payload: string) => {
    open(payload);
    return;
  },

  'open-file': (({ fpath, base, mode }: { fpath: string, base: string, mode: 'entity' | 'relation-to' | 'relation-from' }) => {
    switch (mode) {
      case 'entity':
        vscode.workspace.openTextDocument(path.join(base, fpath))
          .then(doc => {
            vscode.window.showTextDocument(doc, 1)
              .then(editor => currControledDoc = editor);
          });
        break;
      case 'relation-from':
        vscode.workspace.openTextDocument(path.join(base, fpath))
          .then(doc => {
            vscode.window.showTextDocument(doc, 1)
              .then(editor => currControledDoc = editor);
          });
        break;
    }
  }),

  'validate-path': ({ value, pname }: { value: string, pname: string }) => {
    if (!path.isAbsolute(value)) {
      return Promise.reject({
        result: 'error',
        message: 'Path is not absolute'
      });
    }

    try {
      const res = statSync(value);

      if (res.isFile()) {
        return Promise.reject({
          result: 'error',
          message: 'Path can not direct to a file'
        });
      }
    } catch (err: any) {
      if (err.errno === -4058) {
        return Promise.reject({
          /** in UI, warning will be rendered as error and act as error,
           * because a) color of warning is hard to read, b) warning will also block submit operation.
           * so path does not exist, which isn't a really big problem, has to be trated as error.
           */
          result: 'warning',
          message: 'Path does not exist'
        });
      } else if (err.errno === -2) {
        // macos will return this if entry doesn't exist
        return Promise.reject({
          result: 'warning',
          message: 'Path does not exist'
        });
      } else {
        showErrorMessage(`Unknown error with errno=${err.errno} and code=${err.code}`);
        return Promise.reject({
          result: 'error',
          message: 'Unknown error'
        });
      }
    }

    try {
      statSync(path.join(value, pname));

      return Promise.reject({
        result: 'error',
        message: 'The project folder may already exist in the given path'
      });
    } catch (err) { }

    return {
      result: 'success'
    };
  },

  'git-clone': ({ absPath, githubUrl, version }: { absPath: string, githubUrl: string, version: string }, { callbackMessage }) => {
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

  'try-select-project': ({ version }: { version: string }, { callbackMessage }) => {
    vscode.window.showOpenDialog({
      canSelectFolders: true,
      canSelectMany: false,
      title: 'Select a directory to an existed project',
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
              showWarningMessage('A subfolder was given, which has been automatically convert to top level folder.');
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
              }

              callbackMessage({
                command: 'return-try-select-project',
                payload: {
                  success: true,
                  fsPath: possiblePath,
                }
              });
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
    return;
  },

  'show-entity': (data: Array<any>) => {
    if (data) {
      let passed: Array<vscode.Range> = [];
      let removed: Array<vscode.Range> = [];
      let modified: Array<vscode.Range> = [];
      let inserted: Array<vscode.Range> = [];
      let unreviewed: Array<vscode.Range> = [];

      data.forEach((e) => {
        if (e.loc.start.line === -1) {
          return;
        }

        let opto: Array<vscode.Range>;
        if (e.status.hasBeenReviewed) {
          switch (e.status.operation) {
            case 0:
              opto = passed;
              break;
            case 1:
              opto = removed;
              break;
            case 2:
              opto = modified;
              break;
            case 3:
              opto = inserted;
              break;
            default:
              opto = [];
          }
        } else {
          opto = unreviewed;
        }

        opto.push(
          new vscode.Range(
            new vscode.Position(e.loc.start.line - 1, e.loc.start.column - 1),
            new vscode.Position(
              e.loc.end.line !== -1 ? e.loc.end.line - 1 : e.loc.start.line - 1,
              e.loc.end.column !== -1 ? e.loc.end.column - 1 : e.loc.start.column,
            )
          )
        );
      });

      currControledDoc?.setDecorations(entityDecorations.entityPassed, passed);
      currControledDoc?.setDecorations(entityDecorations.entityRemoved, removed);
      currControledDoc?.setDecorations(entityDecorations.entityModified, modified);
      currControledDoc?.setDecorations(entityDecorations.entityInserted, inserted);
      currControledDoc?.setDecorations(entityDecorations.entityUnreviewed, unreviewed);
    } else {
      currControledDoc?.setDecorations(entityDecorations.entityPassed, []);
      currControledDoc?.setDecorations(entityDecorations.entityRemoved, []);
      currControledDoc?.setDecorations(entityDecorations.entityModified, []);
      currControledDoc?.setDecorations(entityDecorations.entityInserted, []);
      currControledDoc?.setDecorations(entityDecorations.entityUnreviewed, []);
    }
  },

  'highlight-entity': (loc) => {
    if (loc) {
      if (loc.start.line === -1) {
        return;
      }

      const range = new vscode.Range(
        new vscode.Position(loc.start.line - 1, loc.start.column - 1),
        new vscode.Position(
          loc.end.line !== -1 ? loc.end.line - 1 : loc.start.line - 1,
          loc.end.column !== -1 ? loc.end.column - 1 : loc.start.column,
        )
      );
      currControledDoc?.setDecorations(entityDecorations.entityHighlighted,
        [range]
      );
      currControledDoc?.revealRange(range, vscode.TextEditorRevealType.InCenter);
    } else {
      currControledDoc?.setDecorations(entityDecorations.entityHighlighted, []);
    }
  },

  'highlight-relation': (compound) => {
    if (compound) {
      const { fpath, base, from, to } = compound;

      vscode.workspace.openTextDocument(path.join(base, fpath))
        .then(doc => {
          vscode.window.showTextDocument(doc, 3)
            .then(editor => {
              if (from.start.line === -1 || to.start.line === -1) {
                return;
              }

              const range0 = new vscode.Range(
                new vscode.Position(from.start.line - 1, from.start.column - 1),
                new vscode.Position(
                  from.end.line !== -1 ? from.end.line - 1 : from.start.line - 1,
                  from.end.column !== -1 ? from.end.column - 1 : from.start.column,
                )
              );
              currControledDoc?.setDecorations(entityDecorations.entityHighlighted, [range0]);
              currControledDoc?.revealRange(range0, vscode.TextEditorRevealType.InCenter);

              currControledDocTo = editor;

              const range1 = new vscode.Range(
                new vscode.Position(to.start.line - 1, to.start.column - 1),
                new vscode.Position(
                  to.end.line !== -1 ? to.end.line - 1 : to.start.line - 1,
                  to.end.column !== -1 ? to.end.column - 1 : to.start.column,
                )
              );
              editor.setDecorations(entityDecorations.entityHighlighted, [range1]);
              currControledDocTo?.revealRange(range1, vscode.TextEditorRevealType.InCenter);
            });
        });
    } else {
      currControledDoc?.setDecorations(entityDecorations.entityHighlighted, []);
      currControledDocTo?.setDecorations(entityDecorations.entityHighlighted, []);
    }
  },
};
