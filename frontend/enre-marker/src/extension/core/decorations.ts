import * as vscode from 'vscode';

export const entityDecorations = {
  entityPassed: vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(124,179,5,.4)',
    borderRadius: '2px',
    fontStyle: 'italic',
  }),
  entityRemoved: vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(207,19,34,.4)',
    borderRadius: '2px',
    fontStyle: 'italic',
    textDecoration: 'line-through'
  }),
  entityModified: vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(212,177,6,.4)',
    borderRadius: '2px',
    fontStyle: 'italic',
  }),
  entityInserted: vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(9,109,217,.4)',
    borderRadius: '2px',
    fontStyle: 'italic',
  }),
  entityUnreviewed: vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(140,140,140,.4)',
    borderRadius: '2px',
    fontStyle: 'italic',
  }),
};
