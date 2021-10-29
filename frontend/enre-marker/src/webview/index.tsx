import React from 'react';
import ReactDOM from 'react-dom';
import 'antd/dist/antd.less';
import { LaunchPad } from './pages/launchPad';

ReactDOM.render(
  <LaunchPad />,
  document.getElementById('root') as HTMLElement
);
