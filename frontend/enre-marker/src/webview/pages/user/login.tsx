import { LockOutlined, UserOutlined } from '@ant-design/icons';
import {
  Button, Form, Input, message,
} from 'antd';
import React, { useContext } from 'react';
import { useRequest } from 'ahooks';
// @ts-ignore
import sha256 from 'sha256-es';
import { request } from '../../compatible/httpAdapter';
import { LoginContext } from '../../context';

export const Login: React.FC<{ uid?: string }> = ({ uid }) => {
  const { dispatcher } = useContext(LoginContext);

  const { loading, run } = useRequest(async ({ uid: id, pswd }: any) => request('POST user/login', {
    uid: id,
    pswd: sha256.hash(pswd),
  }), {
    manual: true,
    onSuccess: (res, param) => {
      dispatcher({ payload: { uid: param[0].uid, token: res.token, name: res.name } });
    },
    onError: (json) => {
      if (json) {
        message.error(json.message);
      }
    },
  });

  return (
    <Form
      name="login"
      wrapperCol={{ sm: { span: 12, offset: 6 } }}
      requiredMark={false}
      onFinish={run}
      initialValues={uid ? { uid } : undefined}
    >
      <Form.Item
        name="uid"
        rules={[
          {
            required: true,
            message: 'User ID is required',
          },
        ]}
      >
        <Input prefix={<UserOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />} placeholder="User ID" readOnly={loading} />
      </Form.Item>
      <Form.Item
        name="pswd"
        rules={[
          {
            required: true,
            message: 'Password is required',
          },
        ]}
      >
        <Input.Password prefix={<LockOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />} placeholder="Password" readOnly={loading} />
      </Form.Item>
      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          style={{ width: '100%', marginTop: '1em' }}
          loading={loading}
        >
          Login
        </Button>
      </Form.Item>
    </Form>
  );
};
