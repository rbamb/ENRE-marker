import * as vscode from 'vscode';

export const activate = (context: vscode.ExtensionContext) => {

  let disposable = vscode.commands.registerCommand('enre-marker.management', () => {
    const panel = vscode.window.createWebviewPanel(
      'ENREMarkerManagementCenter',
      'ENRE-marker Management Center',
      vscode.ViewColumn.Two,
      {}
    );

    panel.webview.html = 'Hello World!';
  });

  context.subscriptions.push(disposable);
};
