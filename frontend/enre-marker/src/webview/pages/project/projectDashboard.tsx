import React, { useContext } from 'react';
import {
  Typography, Button, Space, Card, Alert, Upload, Input, Form,
} from 'antd';
import { useEventListener } from 'ahooks';
import { GithubOutlined, DesktopOutlined, FolderOutlined } from '@ant-design/icons';
import { getApi } from '../../compatible/apiAdapter';
import { WorkingContext } from '../../context';

const { Title, Paragraph, Text } = Typography;

export const ProjectDashboard: React.FC<{ init?: boolean }> = ({ init }) => {
  // @ts-ignore
  const { state: { project: { githubUrl } } } = useContext(WorkingContext);

  const [form] = Form.useForm();

  if (init) {
    return (
      <Space direction="vertical">
        <Title level={4}>
          Fetch the project to your local machine by...
        </Title>
        <Card
          title={(
            <Space>
              <GithubOutlined style={{ color: 'rgba(0,0,0,0.75)' }} />
              <span>Clone from GitHub</span>
            </Space>
          )}
        >
          <Space direction="vertical">
            <Form layout="inline" form={form}>
              <Form.Item
                name="folderPath"
                validateFirst
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message: 'Base folder is required',
                  },
                  () => ({
                    validator(_, value) {
                      return new Promise((resolve, reject) => {
                        getApi.postMessage({ command: 'validate-path', payload: value });

                        const listener = (
                          { data: { command, payload: { result, message } } }: any,
                          // eslint-disable-next-line consistent-return
                        ) => {
                          if (command === 'return-validate-message') {
                            window.removeEventListener('message', listener);
                            if (result === 'success') {
                              return resolve('success');
                            } if (result === 'warning') {
                              return reject(new Error(message));
                            }
                            return reject(new Error(message));
                          }
                        };

                        window.addEventListener('message', listener);
                      });
                    },
                  }),
                ]}
                hasFeedback
              >
                <Input
                  style={{ width: '300px' }}
                  placeholder="Base folder"
                  prefix={<FolderOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />}
                  allowClear
                />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit">Git clone</Button>
              </Form.Item>
            </Form>
            <Paragraph>
              To automatically clone the project:
              <ul>
                <li>
                  Type an&nbsp;
                  <b>absolute path</b>
                  &nbsp;to a folder where you want the cloned project to be saved;
                </li>
                <li>
                  Click the &quot;Git clone&quot; button, and ENRE-marker will run&nbsp;
                  <Text code>
                    git clone&nbsp;
                    {`https://github.com/${githubUrl}`}
                  </Text>
                  &nbsp;in background.
                </li>
              </ul>
              When all is done, you will be redirected to project&apos;s files page.
            </Paragraph>
            <Alert
              message="Please do not edit project files"
              description="Cloned files should be used by ENRE-marker exclusively in case any data mismatching. Files will always be scanned and reset after ENRE-marker is activated. If you intend to use the same project, please set up a different working folder."
              type="warning"
              showIcon
            />
          </Space>
        </Card>
        <Card
          title={(
            <Space>
              <DesktopOutlined style={{ color: 'rgba(0,0,0,0.75)' }} />
              <span>Select a local folder</span>
            </Space>
          )}
        >
          <Space direction="vertical">
            <Upload directory>
              <Button type="primary">Select a folder</Button>
            </Upload>
            <Paragraph>
              If your local driver has already contained
              this project, you can tell ENRE-marker
              to directly reuse it.
            </Paragraph>
            <Alert
              message="Scan needed, and it may take a while"
              description="ENRE-marker will scan all files in that folder to make sure them have not been modified and match the version specified in our server."
              type="warning"
              showIcon
            />
          </Space>
        </Card>
      </Space>
    );
  }
  return <p>bs</p>;
};
