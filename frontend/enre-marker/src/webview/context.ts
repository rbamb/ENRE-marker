import { createContext } from 'react';
import { getApi } from './compatible/apiAdapter';

export const LoginContext = createContext(null);

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

export const WorkingContext = createContext(null);

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

  getApi.setState({ working: newState });
  return newState;
};

export const NavContext = createContext(null);

export const navReducer = (state: any, { payload }: any) => payload;
