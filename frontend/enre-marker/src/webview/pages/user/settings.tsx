import React, { useContext, useState } from 'react';
import {
  List, Button, Space, Typography, message, Modal, Form, Input, notification,
} from 'antd';
import { GithubOutlined } from '@ant-design/icons';
import { useForm } from 'antd/lib/form/Form';
import { useRequest } from 'ahooks';
// @ts-ignore
import sha256 from 'sha256-es';
import { LoginContext, WorkingContext } from '../../context';
import pkg from '../../../../package.json';
import { getApi } from '../../compatible/apiAdapter';
import { request } from '../../compatible/httpAdapter';

export const Settings: React.FC = () => {
  const { state, dispatcher: loginDispatcher } = useContext(LoginContext);
  const { dispatcher: workingDispatcher } = useContext(WorkingContext);

  const { loading, run } = useRequest(async ({ oldPswd, newPswd }: any) => request('POST user/password', {
    oldPswd: sha256.hash(oldPswd),
    newPswd: sha256.hash(newPswd),
  }), {
    manual: true,
    onSuccess: () => {
      notification.success({
        message: 'Change password succeeded',
        description: 'Now redirecting you to the login page.',
      });
      loginDispatcher({ payload: { token: undefined } });
    },
    onError: (json) => {
      if (json) {
        message.error(json.message);
      }
    },
  });

  const [form] = useForm();

  const [pswdVisible, setPswdVisible] = useState(false);

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
              key={0}
              onClick={() => setPswdVisible(true)}
            >
              Change
            </Button>,
          ]}
        >
          <List.Item.Meta
            title="Change password"
          />
          <Modal
            visible={pswdVisible}
            title="Change password"
            okText="Submit"
            okButtonProps={{ loading }}
            cancelButtonProps={{ disabled: loading }}
            onCancel={() => (loading ? undefined : (form.resetFields(), setPswdVisible(false)))}
            onOk={() => {
              form
                .validateFields()
                .then(({ oldPswd, newPswd }) => {
                  run({ oldPswd, newPswd });
                });
            }}
          >
            <Form
              form={form}
              name="changePswd"
              layout="vertical"
              requiredMark={false}
            >
              <Form.Item
                name="oldPswd"
                label="Old password"
                rules={[
                  {
                    required: true,
                    message: 'Old password is required',
                  },
                ]}
              >
                <Input.Password readOnly={loading} />
              </Form.Item>
              <Form.Item
                name="newPswd"
                label="New password"
                extra="For a better security concern, new password should be longer than 8 chars and contains both letters and numbers"
                rules={[
                  {
                    required: true,
                    message: 'New password is required',
                  },
                  {
                    type: 'string',
                    min: 8,
                    max: 32,
                    message: 'Length of the new password should be in the range of 8~32',
                  },
                  {
                    pattern: /^(?![0-9]+$)(?![a-zA-Z]+$)/,
                    message: 'New password should contains both letters and numbers',
                  },
                ]}
              >
                <Input.Password readOnly={loading} />
              </Form.Item>
              <Form.Item
                name="newPswd2"
                label="Confirm new password"
                dependencies={['newPswd']}
                rules={[
                  {
                    required: true,
                    message: 'Confirmed password is required',
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (getFieldValue('newPswd') !== value) {
                        return Promise.reject(new Error('Confirmed password does not match the new password'));
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <Input.Password readOnly={loading} />
              </Form.Item>
            </Form>
          </Modal>
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
          actions={[
            <span key={0}>
              {`${pkg.version.toString()}${!IS_PRODUCTION ? '-dev' : ''}`}
            </span>,
          ]}
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
              Open an issue
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
