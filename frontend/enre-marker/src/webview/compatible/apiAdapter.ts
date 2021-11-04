export const getApi =  acquireVsCodeApi || {
  postMess: (message: any, transfer: any) => console.log(message),
  getState: () => {},
  setState: (newState: any) => console.log('set new state' + newState)
}
