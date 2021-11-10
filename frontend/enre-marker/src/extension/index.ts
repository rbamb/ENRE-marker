import * as vscode from 'vscode';
import path from 'path';
import { htmlAdapter } from './webPanel/htmlAdapter';
import { localMsgType, msgHandler } from './core/msgHandler';

export const activate = (context: vscode.ExtensionContext) => {
  let panel: vscode.WebviewPanel | undefined = undefined;

  let registerWebview = vscode.commands.registerCommand('enre-marker.management', () => {
    if (panel) {
      panel.reveal();
    } else {
      panel = vscode.window.createWebviewPanel(
        'ENREMarkerManagementCenter',
        'ENRE-marker Management Center',
        vscode.ViewColumn.Two,
        {
          enableScripts: true,
          retainContextWhenHidden: true
        }
      );

      panel.webview.html = htmlAdapter(
        vscode.Uri.file(path.join(context.extensionPath, 'dist', 'webview.js')).with({ scheme: 'vscode-resource' }),
        vscode.Uri.file(path.join(context.extensionPath, 'dist', 'webview.css')).with({ scheme: 'vscode-resource' })
      );

      panel.webview.postMessage({
        type: 'switchPage',
        payload: 'project'
      });

      // Handle any post-close logic in here
      panel.onDidDispose(() => {
        panel = undefined;
      },
        null,
        context.subscriptions
      );

      panel.webview.onDidReceiveMessage(
        ({ command, payload }: localMsgType) => {
          if (msgHandler[command] === undefined) {
            vscode.window.showErrorMessage(`Unknown message command ${command} from webview`);
            return;
          }

          const anything = msgHandler[command](payload, (panel as vscode.WebviewPanel).webview.postMessage);

          if (typeof anything === 'function') {
            // TODO: handle return type is a function
          } else {
            panel?.webview.postMessage({ command: `return-${command}`, payload: anything });
          }
        },
        undefined,
        context.subscriptions
      );

      vscode.window.onDidChangeTextEditorSelection(e => {
        const sel = e.selections[0];
        if (e.kind === 2) {
          panel?.webview.postMessage({
            command: 'selection-change', payload: {
              name: e.textEditor.document.getText(sel),
              loc: {
                start: {
                  line: sel.start.line,
                  column: sel.start.character
                },
                end: {
                  line: sel.end.line,
                  column: sel.end.character
                }
              }
            }
          });
        }
      });
    }
  });

  let test = vscode.commands.registerTextEditorCommand('enre-marker.test', (editor, edit) => {
    let decorators = vscode.window.createTextEditorDecorationType({
      isWholeLine: true,
      dark: {
        backgroundColor: 'green',
        color: 'black'
      }
    });

    editor.setDecorations(decorators, [new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 5))]);
  });

  context.subscriptions.push(registerWebview);
  context.subscriptions.push(test);
};
