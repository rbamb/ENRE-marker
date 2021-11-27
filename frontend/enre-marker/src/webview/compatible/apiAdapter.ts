/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
/* eslint-disable max-len */
// @ts-nocheck

import { langTableIndex } from '../.static/config';

const onlySingleCopy = typeof acquireVsCodeApi === 'undefined' ? undefined : acquireVsCodeApi();

// FIXME: only for debug purpose
const mockState = {
  login: {
    uid: 10000,
    token: 'V3FnMNqPkmYudEnCEb1i5GWW1bXKCUC3z9H6AiavLaPCFAt1lylRcDgMjn3LPJgE',
    name: 'ThisRabbit',
  },
  working: {
    project: {
      pid: 3,
      name: 'oozie',
      fsPath: 'd://test/ENRE.js',
      version: '8dfdb35',
      lang: 'java',
      githbUrl: 'apache/oozie',
    },
  },
};

// const mockState = {};

export const getApi = onlySingleCopy ? {
  ...onlySingleCopy,
  setState: (newState: any) => {
    /** a wrapped version of vscode's original setState function,
     * since it can only record a single object,
     * so using keys to make state management works like mock version
    */
    const obj = { ...onlySingleCopy.getState() };
    obj[Object.keys(newState)[0]] = newState[Object.keys(newState)[0]];
    onlySingleCopy.setState(obj);
  },
} : {
  postMessage: (message: any, transfer: any) => console.log(message),
  getState: () => mockState,
  setState: (newState: any) => {
    mockState[Object.keys(newState)[0]] = newState[Object.keys(newState)[0]];
    console.log(`set new state ${JSON.stringify(newState)}`);
  },
};

export interface stateModule {
  login?: loginState,
  working?: workingState,
}

export interface loginState {
  uid?: number,
  token?: string,
  name?: string,
}

export interface workingState {
  project?: projectState,
  file?: fileState,
}

export interface projectState {
  pid: number,
  name: string,
  githubUrl: string,
  version: string,
  lang: langTableIndex,
  locked: boolean,
  fsPath: string,
  map: Array<fid2Path>,
}

export interface fid2Path {
  fid: number,
  path: string,
}

export interface fileState {
  fid: number,
  path: string,
  workingOn: 'entity' | 'relation',
}
