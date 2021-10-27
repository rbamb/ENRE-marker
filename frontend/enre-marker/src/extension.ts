import * as vscode from 'vscode';
import path from 'path';
import { htmlAdapter } from './webview/htmlAdapter';

export const activate = (context: vscode.ExtensionContext) => {

  let disposable = vscode.commands.registerCommand('enre-marker.management', () => {
    const panel = vscode.window.createWebviewPanel(
      'ENREMarkerManagementCenter',
      'ENRE-marker Management Center',
      vscode.ViewColumn.Two,
      {
        enableScripts: true
      }
    );

    panel.webview.html = htmlAdapter(
      vscode.Uri.file(path.join(context.extensionPath, 'dist', 'webview.js')).with({scheme: 'vscode-resource'}),
      vscode.Uri.file(path.join(context.extensionPath, 'dist', 'webview.css')).with({scheme: 'vscode-resource'})
    );
  });

  context.subscriptions.push(disposable);
};
