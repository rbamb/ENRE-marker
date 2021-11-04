import { Button, Input } from 'antd';
import React from 'react';
import { url } from '../../compatible/httpAdapter';


// const vscode = acquireVsCodeApi();

export const UserManagement: React.FC = () => {
  return (<>
  <Input />
  <Input.Password />
  <Button onClick={() => fetch(url('project')).then(req => req.text()).then(console.log)}>Log in</Button>
  </>);
};
