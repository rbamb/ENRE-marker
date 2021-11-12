import { LockOutlined, UserOutlined } from '@ant-design/icons';
import {
  Button, Form, Input,
} from 'antd';
import React, { useContext } from 'react';
import { useRequest } from 'ahooks';
import { request } from '../../compatible/httpAdapter';
import { LoginContext } from '../../context';

export const Login: React.FC<{ uid?: string }> = ({ uid }) => {
  const { dispatcher } = useContext(LoginContext);

  const { loading, run } = useRequest((body: any) => request('POST user/login', body), {
    manual: true,
    onSuccess: (res, param) => {
      dispatcher({ payload: { uid: param[0].uid, token: res.token } });
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
        rules={[{ required: true }]}
      >
        <Input prefix={<UserOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />} placeholder="User ID" readOnly={loading} />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[{ required: true }]}
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
