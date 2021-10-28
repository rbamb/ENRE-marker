import * as React from 'react';
import * as ReactDOM from 'react-dom';
import 'antd/dist/antd.less';
import { UserManagement } from './pages/login';

ReactDOM.render(
  <UserManagement />,
  document.getElementById('root') as HTMLElement
);
