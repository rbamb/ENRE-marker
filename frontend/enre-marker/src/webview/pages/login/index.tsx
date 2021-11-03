import { Button, Input } from 'antd';
import * as React from 'react';

// const vscode = acquireVsCodeApi();

export const UserManagement: React.FC = () => {
  return (<>
  <Input />
  <Input.Password />
  <Button onClick={() => console.log('hello')}>Log in</Button>
  </>);
};
