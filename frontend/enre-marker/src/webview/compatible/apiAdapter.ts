/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
/* eslint-disable max-len */

const onlySingleCopy = typeof acquireVsCodeApi === 'undefined' ? undefined : acquireVsCodeApi();

export const getApi = onlySingleCopy || {
  postMess: (message: any, transfer: any) => console.log(message),
  getState: (): any => ({
    login: {
      uid: 10000,
      token: 'K7swolDd5KkwF7w4F511v3Uf6cvDTznhq8IckOVflrvhxw2feq2Y5q3rnB46mevF7Qkq8FgkK1vnR5RtnIzDx1kmmfoy0EuJvsvl85B6tpKJAm3yEek7qcj37j8rhoC7t14nlvQFtmS1wc6wPxei815rvkukyPdCdsT1p1jHddg3VBBMR4bk34pIRxgTAhgboIF6NbXrCmFhrajKcq2RQ8x86iyAefwh4634tVgV6k788xMpzs64s2HVjPif0sEK',
    },
    working: {
      project: {
        pid: 100,
        name: 'ENRE-js',
      },
    },
  }),
  setState: (newState: any) => console.log(`set new state ${JSON.stringify(newState)}`),
};
