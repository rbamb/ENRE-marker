/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
/* eslint-disable max-len */
// @ts-nocheck

import { langTableIndex } from '../.static/config';

const onlySingleCopy = typeof acquireVsCodeApi === 'undefined' ? undefined : acquireVsCodeApi();

// FIXME: only for debug purpose
// const mockState = {
//   login: {
//     uid: 100,
//     token: 'sometoken',
//   },
//   working: {
//     project: {
//       pid: 100,
//       name: 'ENRE.js',
//       fsPath: 'd://test/ENRE.js',
//       version: 'abcdefg',
//       lang: 'java',
//       map: [
//         {
//           fid: 0,
//           path: 'package.json',
//         },
//         {
//           fid: 1,
//           path: 'tsconfig.json',
//         },
//       ],
//     },
//     file: {
//       fid: 0,
//       path: '/some/to/path/a.js',
//       workingOn: 'entity',
//     },
//   },
// };

const mockState = {};

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
