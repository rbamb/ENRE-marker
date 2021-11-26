import React, { useContext } from 'react';
import {
  List, Button, Space, Typography, message,
} from 'antd';
import { GithubOutlined } from '@ant-design/icons';
import { LoginContext, WorkingContext } from '../../context';
import pkg from '../../../../package.json';
import { getApi } from '../../compatible/apiAdapter';

export const Settings: React.FC = () => {
  const { state, dispatcher: loginDispatcher } = useContext(LoginContext);
  const { dispatcher: workingDispatcher } = useContext(WorkingContext);

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Typography.Title level={5}>
        Account
      </Typography.Title>
      <List style={{ marginLeft: '1em' }}>
        <List.Item
          actions={[<span key={0}>{state.uid}</span>]}
        >
          <List.Item.Meta
            title="User ID"
          />
        </List.Item>
        <List.Item
          actions={[<span key={0}>{state.name}</span>]}
        >
          <List.Item.Meta
            title="User name"
            description="Currently we don't offer any account related operations, please contact us if you have any questions."
          />
        </List.Item>
        <List.Item
          actions={[
            <Button
              onClick={() => loginDispatcher({ payload: { token: undefined } })}
              danger
              key={0}
            >
              Log out
            </Button>,
          ]}
        >
          <List.Item.Meta
            title="Log out"
          />
        </List.Item>
      </List>
      <Typography.Title level={5}>
        Settings
      </Typography.Title>
      <List style={{ marginLeft: '1em' }}>
        <List.Item
          actions={[
            <Button
              onClick={() => {
                workingDispatcher({
                  payload: {
                    project: undefined,
                    file: undefined,
                  },
                });
                message.success('Clear succeeded');
              }}
              danger
              key={0}
            >
              Clear
            </Button>,
          ]}
        >
          <List.Item.Meta
            title="Clear caches"
            description="This will clear all cached data and reset ENRE-marker to a init state, which would be helpful if you have encountered with some data conflict issues."
          />
        </List.Item>
      </List>
      <Typography.Title level={5}>
        About&nbsp;
        {pkg.displayName}
      </Typography.Title>
      <List style={{ marginLeft: '1em' }}>
        <List.Item
          actions={[<span key={0}>{pkg.version}</span>]}
        >
          <List.Item.Meta
            title="Version"
          />
        </List.Item>
        <List.Item
          actions={[
            <Button
              style={{ paddingRight: 0 }}
              onClick={
                () => getApi.postMessage({
                  command: 'open-url-in-browser',
                  payload: 'https://github.com/xjtu-enre/ENRE-marker/issues/new',
                })
              }
              type="link"
              key={0}
            >
              <GithubOutlined />
              Start an issue
            </Button>,
          ]}
        >
          <List.Item.Meta
            title="Report a bug"
            description="This will redirect you to our repository's issue page in GitHub, please describe bugs as clear as possible, so that we shall investigate and fix them as soon as possible."
          />
        </List.Item>
      </List>
    </Space>
  );
};
