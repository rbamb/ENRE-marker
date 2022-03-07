import * as vscode from 'vscode';

export const entityDecorations = {
  entityPassed: vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(82,196,26,.4)',
    borderRadius: '2px',
    fontStyle: 'italic',
  }),
  entityRemoved: vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(245,34,45,.4)',
    borderRadius: '2px',
    fontStyle: 'italic',
    textDecoration: 'line-through'
  }),
  entityModified: vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(250,219,20,.4)',
    borderRadius: '2px',
    fontStyle: 'italic',
  }),
  entityInserted: vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(24,144,255,.4)',
    borderRadius: '2px',
    fontStyle: 'italic',
  }),
  entityUnreviewed: vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(191,191,191,.4)',
    borderRadius: '2px',
    fontStyle: 'italic',
  }),
  entityHighlighted: vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(255,255,255,.4)',
    borderRadius: '2px',
    fontStyle: 'italic',
  })
};

export const relationDecorations = {
  fromEntity: vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(24,144,255,.4)',
    borderRadius: '2px',
    fontStyle: 'italic',
    before: {
      backgroundColor: 'rgba(24,144,255,.4)',
      contentText: '[FROM]',
      margin: '0 4px 0 0',
    }
  }),
  toEntity: vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(82,196,26,.4)',
    borderRadius: '2px',
    fontStyle: 'italic',
    before: {
      backgroundColor: 'rgba(82,196,26,.4)',
      contentText: '[TO]',
      margin: '0 4px 0 0',
    }
  }),
  happensLocation: vscode.window.createTextEditorDecorationType({
    isWholeLine: true,
    backgroundColor: 'rgba(255,255,255,.2)',
    borderRadius: '2px',
    fontStyle: 'italic',
    before: {
      contentText: '[HAPPENS]',
      margin: '0 4px 0 0',
    }
  })
};
