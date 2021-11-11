import React, { createContext } from 'react';
import { getApi, loginState, workingState } from './compatible/apiAdapter';

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
      newState = { ...state, ...action.payload };
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
      newState = { ...state, ...action.payload };
    } else {
      newState = undefined;
    }
  } else if (action) {
    newState = { ...action.payload };
  } else {
    newState = undefined;
  }

  console.log(newState);

  getApi.setState({ working: newState });
  return newState;
};

export const NavContext = createContext({
  state: undefined as unknown as string,
  dispatcher: undefined as unknown as React.Dispatch<any>,
});

export const navReducer = (state: any, { payload }: any) => payload;
