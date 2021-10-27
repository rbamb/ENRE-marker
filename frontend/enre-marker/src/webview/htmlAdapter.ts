import { Uri } from "vscode";

export const htmlAdapter = (
  scriptUri: Uri,
  styleUri: Uri
) => {
  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
      <link rel="stylesheet" type="text/css" href="${styleUri}">
    </head>
    <body>
      <noscript>
        You need to enable JavaScript to run this app.
      </noscript>
      <div id="root"></div>
      <p>Test the HTML is injected</p>
      <script src="${scriptUri}"></script>
    </body>
  </html>`;
};