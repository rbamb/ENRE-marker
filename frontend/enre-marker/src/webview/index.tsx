import React from 'react';
import ReactDOM from 'react-dom';
import 'antd/dist/antd.less';
import { ConfigProvider } from 'antd';
import { App } from './pages';

if (module.hot) { module.hot.accept(); }

ReactDOM.render(
  <ConfigProvider componentSize="middle">
    <App />
  </ConfigProvider>,
  document.getElementById('root') as HTMLElement,
);
