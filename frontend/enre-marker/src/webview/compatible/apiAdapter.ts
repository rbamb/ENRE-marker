/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
/* eslint-disable max-len */
// @ts-nocheck

const onlySingleCopy = typeof acquireVsCodeApi === 'undefined' ? undefined : acquireVsCodeApi();

export const getApi = onlySingleCopy || {
  postMess: (message: any, transfer: any) => console.log(message),
  getState: () => JSON.parse(JSON.stringify(window.localStorage)),
  setState: (newState: any) => {
    window.localStorage.setItem(Object.keys(newState)[0], newState[Object.keys(newState)[0]]);
    console.log(`set new state ${JSON.stringify(newState)}`);
  },
};

export interface stateModule {
  login?: {
    uid?: number,
    token?: string
  },
  working?: {
    project?: {
      pid: number,
      name: string
    }
  }
}
