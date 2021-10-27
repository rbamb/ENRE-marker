import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Button } from 'antd';
import 'antd/es/button/style';

ReactDOM.render(
  <Button onClick={() => console.log('hello')}>Hello</Button>,
  document.getElementById('root') as HTMLElement
);
