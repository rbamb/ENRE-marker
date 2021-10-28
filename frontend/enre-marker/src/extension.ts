import * as vscode from 'vscode';
import path from 'path';
import { htmlAdapter } from './webview/htmlAdapter';

export const activate = (context: vscode.ExtensionContext) => {
  let panel: vscode.WebviewPanel | undefined = undefined;

  let disposable = vscode.commands.registerCommand('enre-marker.management', () => {
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

      // Handle any post-close logic in here
      panel.onDidDispose(() => {
        panel = undefined;
      },
        null,
        context.subscriptions
      );

      panel.webview.onDidReceiveMessage(
        message => {
          switch (message.type) {
            case 'btn-clicked':
              vscode.window.showErrorMessage('A button is clicked!');
          }
        },
        undefined,
        context.subscriptions
      );
    }
  });

  context.subscriptions.push(disposable);
};
