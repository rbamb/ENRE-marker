import React, { useContext, useReducer } from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  Redirect,
} from 'react-router-dom';
import { Menu, notification } from 'antd';
import {
  UserOutlined, ProjectOutlined, FileTextOutlined, RightOutlined,
} from '@ant-design/icons';
import { Login } from './user/login';
import { FileViewer } from './project/fileViewer';
import { ProjectViewer } from './project/projectViewer';
import {
  LoginContext, loginReducer, WorkingContext, workingReducer,
} from '../context';
import { getApi } from '../compatible/apiAdapter';

const PrivateRoute: React.FC = ({ children, ...rest }) => {
  // @ts-ignore
  const { state } = useContext(LoginContext);

  if (!state?.token) {
    notification.error({
      message: 'Login required',
      description: 'Now redirecting you to the login page.',
    });
  }

  return (
    <Route
      {...rest}
      // @ts-ignore
      render={({ location }) => (state?.token ? (
        children
      ) : (
        <Redirect
          to={{
            pathname: '/',
            state: { from: location },
          }}
        />
      ))}
    />
  );
};

export const App: React.FC = () => {
  // useEffect(() => {
  //   window.addEventListener('message', ({ data }) => {
  //     switch (data.type) {
  //       case 'continueUrl':

  //         break;
  //       default:
  //         break;
  //     }
  //   });
  // });

  const [loginState, loginDispatcher] = useReducer(loginReducer, getApi.getState()?.login);
  const [workingState, workingDispatcher] = useReducer(workingReducer, getApi.getState()?.working);

  return (
    <>
      {/* @ts-ignore */}
      <LoginContext.Provider value={{ state: loginState, dispatcher: loginDispatcher }}>
        {/* @ts-ignore */}
        <WorkingContext.Provider value={{ state: workingState, dispatcher: workingDispatcher }}>
          <Router>
            <Menu mode="horizontal">
              <Menu.Item key="index" icon={<UserOutlined />}>
                <Link to="/">
                  My
                </Link>
              </Menu.Item>
              {/* @ts-ignore */}
              <Menu.Item key="project" icon={<ProjectOutlined />} disabled={loginState?.token === undefined}>
                <Link to="/project">
                  Project
                </Link>
              </Menu.Item>
              {/* @ts-ignore */}
              {workingState?.project ? (
                <Menu.Item key="pid" icon={<RightOutlined />}>
                  {/* @ts-ignore */}
                  <Link to={`/project/${workingState.project.pid}`}>
                    {/* @ts-ignore */}
                    {`Claimed: ${workingState.project.name}`}
                  </Link>
                </Menu.Item>
              ) : undefined}
              <Menu.Item
                key="file"
                icon={<FileTextOutlined />}
                /* @ts-ignore */
                disabled={loginState?.token === undefined || workingState?.project === undefined}
              >
                <Link to="/project/:pid/file">
                  File
                </Link>
              </Menu.Item>
            </Menu>

            <div style={{ padding: '1em 1em 0 1em' }}>
              <Switch>
                <Route path="/" exact>
                  {/* @ts-ignore */}
                  {loginState?.token ? '[TODO] Some user info' : <Login uid={loginState?.uid} />}
                </Route>
                {/* @ts-ignore */}
                <PrivateRoute path="/project" exact>
                  <ProjectViewer />
                </PrivateRoute>
                {/* @ts-ignore */}
                <PrivateRoute path="/project/:pid">
                  <FileViewer />
                </PrivateRoute>
              </Switch>
            </div>
          </Router>
        </WorkingContext.Provider>

      </LoginContext.Provider>
    </>
  );
};
