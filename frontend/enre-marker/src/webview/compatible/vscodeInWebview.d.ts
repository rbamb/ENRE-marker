export interface vscApi {
  getState: () => any,
  postMessage: (message: any, transfer: any) => any,
  setState: (newState: any) => any
}

export function acquireVsCodeApi(): vscApi;
