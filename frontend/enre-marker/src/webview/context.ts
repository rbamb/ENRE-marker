import React, { createContext } from 'react';
import { getApi, loginState, workingState } from './compatible/apiAdapter';

// TODO: currently only support object with maximum 2 layers
const differ = (old: any, latest: any): any => {
  /** using spread operator to clone the old object into a new memory space
   * so that react will see the difference and do re-render
   * sort of pass by reference thing
   */
  const obj = { ...old };

  Object.keys(latest).forEach((k1) => {
    if (typeof latest[k1] === 'object') {
      if (!obj[k1]) {
        obj[k1] = latest[k1];
        return;
      }
      let added = false;
      Object.keys(latest[k1]).forEach((k2) => {
        if (Object.keys(old).includes(k1) || added) {
          obj[k1][k2] = latest[k1][k2];
        } else {
          added = true;
          obj[k1] = { [k2]: latest[k1][k2] };
        }
      });
    } else {
      obj[k1] = latest[k1];
    }
  });

  return obj;
};

/** these values will be and should be never used
 * since we provide value when wrap our component with <XXXContext.Provider>,
 * and only to make the whole thing TypeScript-compatible
 */
export const LoginContext = createContext({
  /** since it's hard to describe optional types if they are dependent
   * so here make all types Required, to avoid ts error when desturcturing variables
   * that is, only use ts for quick typing rather than strict undefined checking.
   *
   * so we should be extremely careful when dealing with context variable
   * inside our UI components.
   */
  state: undefined as unknown as Required<loginState>,
  dispatcher: undefined as unknown as React.Dispatch<any>,
});

export const loginReducer = (state: any, action: any) => {
  let newState;

  if (state) {
    if (action) {
      newState = differ(state, action.payload);
    } else {
      newState = undefined;
    }
  } else if (action) {
    newState = { ...action.payload };
  } else {
    newState = undefined;
  }

  getApi.setState({ login: newState });
  return newState;
};

export const WorkingContext = createContext({
  state: undefined as unknown as Required<workingState>,
  dispatcher: undefined as unknown as React.Dispatch<any>,
});

export const workingReducer = (state: any, action: any) => {
  let newState;

  if (state) {
    if (action) {
      newState = differ(state, action.payload);
    } else {
      newState = undefined;
    }
  } else if (action) {
    newState = { ...action.payload };
  } else {
    newState = undefined;
  }

  getApi.setState({ working: newState });
  return newState;
};

export const NavContext = createContext({
  state: undefined as unknown as string,
  dispatcher: undefined as unknown as React.Dispatch<any>,
});

export const navReducer = (state: any, { payload }: any) => payload;
