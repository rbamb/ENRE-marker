export {};

declare global {
  interface vscApi {
    postMessage: (message: any, transfer?: any) => any,
    getState: () => any,
    setState: (newState: any) => any
  }

  function acquireVsCodeApi(): vscApi;

  const REMOTE: string;
}

