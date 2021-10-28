export {};

declare global {
  interface vscApi {
    getState: () => any,
    postMessage: (message: any, transfer?: any) => any,
    setState: (newState: any) => any
  }

  function acquireVsCodeApi(): vscApi;
}

