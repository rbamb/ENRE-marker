import * as vscode from 'vscode';
import path from 'path';
import { htmlAdapter } from './webPanel/htmlAdapter';
import { getSelApproved, localMsgType, msgHandler } from './core/msgHandler';
import { ENREMarkerSerializer } from './webPanel/serializer';
import { entityDecorations } from './core/decorations';

export const activate = (context: vscode.ExtensionContext) => {
  let panel: vscode.WebviewPanel | undefined = undefined;

  let registerWebview = vscode.commands.registerCommand('enre-marker.start', () => {
    if (panel) {
      panel.reveal();
    } else {
      panel = vscode.window.createWebviewPanel(
        'ENREMarker',
        'ENRE-marker',
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

      const callbackMessage = ({ command, payload }: { command: string, payload: any }) => panel?.webview.postMessage({
        command,
        payload,
      });

      panel.webview.onDidReceiveMessage(
        ({ command, payload }: localMsgType) => {
          if (msgHandler[command] === undefined) {
            vscode.window.showErrorMessage(`Unknown message command ${command} from webview`);
            return;
          }

          const anything = msgHandler[command](payload, callbackMessage);

          if (typeof anything === 'function') {
            // TODO: handle return type is a function
          } else {
            panel?.webview.postMessage({ command: `return-${command}`, payload: anything });
          }
        },
        undefined,
        context.subscriptions
      );

      vscode.window.onDidChangeActiveTextEditor(e => {
        console.log(e);
        if (panel) {
          if (!panel.visible) {
            panel.reveal(2);
          }
        }
      });

      vscode.window.onDidChangeTextEditorSelection(e => {
        if (getSelApproved()) {
          const sel = e.selections[0];
          if ((e.kind === 2) && (sel.start.line === sel.end.line) && (sel.start.character !== sel.end.character)) {
            panel?.webview.postMessage({
              command: 'selection-change',
              payload: {
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
        }
      });
    }

    // return this panel in case the command is called programmatically
    return panel;
  });

  context.subscriptions.push(registerWebview);
  // this will help webview auto restart when vscode is restarted
  // vscode.window.registerWebviewPanelSerializer('ENREMarker', new ENREMarkerSerializer());
};
