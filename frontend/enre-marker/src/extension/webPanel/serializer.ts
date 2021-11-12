import * as vscode from 'vscode';

export class ENREMarkerSerializer implements vscode.WebviewPanelSerializer {
  async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: unknown): Promise<any> {
    console.log(state);

    /** a tricky implementation for re-start our webview:
     * by just dispose old panel and auto run start command,
     * a new panel with all proper init configurations
     * will be setup in the same position.
     * 
     * this can save time to rewrite same setup logic~
     */
    webviewPanel.dispose();

    try {
      const panel: vscode.WebviewPanel | undefined = await vscode.commands.executeCommand('enre-marker.start');

      if (panel && state) {
        setTimeout(() => {
          panel.webview.postMessage({
            command: 'restore-state',
            payload: state,
          });
        }, 5000);
      }

      return Promise.resolve();
    } catch (e: any) {
      vscode.window.showErrorMessage(e.message);
      return Promise.reject();
    }
  }
}
