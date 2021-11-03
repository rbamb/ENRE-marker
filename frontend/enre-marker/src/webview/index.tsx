import React from 'react';
import ReactDOM from 'react-dom';
import 'antd/dist/antd.less';
import { App } from './pages';

if (module.hot) {module.hot.accept();};

ReactDOM.render(
  <App />,
  document.getElementById('root') as HTMLElement
);
