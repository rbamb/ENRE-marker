import React from 'react';
import ReactDOM from 'react-dom';
import 'antd/dist/antd.less';
import { ConfigProvider, message } from 'antd';
import { App } from './pages';

if (module.hot) { module.hot.accept(); }

message.config({
  top: 40,
});

ReactDOM.render(
  <ConfigProvider
    componentSize="middle"
  >
    <App />
  </ConfigProvider>,
  document.getElementById('root') as HTMLElement,
);
