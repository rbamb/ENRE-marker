export { };

declare global {
  interface vscApi {
    postMessage: (message: any, transfer?: any) => any,
    getState: () => any,
    setState: (newState: any) => any
  }

  function acquireVsCodeApi(): vscApi;

  const REMOTE: string;

  const IN_BROWSER: boolean;

  const IN_EXTENSION: boolean;
}
