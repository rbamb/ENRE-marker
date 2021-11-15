import React, { useContext, useState } from 'react';
import {
  Typography, Button, Space, Card, Alert, Input, Form, Descriptions, Tooltip, message,
} from 'antd';
import { GithubOutlined, DesktopOutlined, FolderOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getApi } from '../../compatible/apiAdapter';
import { WorkingContext, NavContext } from '../../context';

const { Title, Paragraph, Text } = Typography;

export const ProjectDashboard: React.FC<{
  init?: boolean,
  collaborator?: Array<remote.user>
}> = ({ init, collaborator }) => {
  // TODO: consume collaborator

  const {
    state: {
      project: {
        pid, name, githubUrl, version, fsPath,
      },
    },
    dispatcher: workingDispatcher,
  } = useContext(WorkingContext);
  const { dispatcher: navDispatcher } = useContext(NavContext);

  const navigate = useNavigate();

  const [form] = Form.useForm();

  const [executing, setExecuting] = useState(false as false | 'clone' | 'select');

  if (init || (!init && !fsPath)) {
    const toPages = (path: string) => {
      workingDispatcher({ payload: { project: { fsPath: path } } });
      navDispatcher({ payload: 'file' });
      navigate(`project/${pid}/file`);
    };

    const handleCloneClicked = ({ folderPath }: { folderPath: string }) => {
      setExecuting('clone');

      message.loading({
        content: 'Fetching project from GitHub...',
        duration: 0,
        key: 'clone',
      });

      getApi.postMessage({
        command: 'git-clone',
        payload: {
          githubUrl,
          version,
          absPath: folderPath,
        },
      });

      const listener = (
        { data: { command, payload: { success, fsPath: returnedPath } } }: any,
        // eslint-disable-next-line consistent-return
      ) => {
        // FIXME: there seems to have a bug

        if (command === 'return-git-clone') {
          setExecuting(false);
          message.destroy('clone');

          if (success) {
            window.removeEventListener('message', listener);
            toPages(returnedPath);
          }
        }
      };

      window.addEventListener('message', listener);
    };

    const handleSelectClicked = () => {
      setExecuting('select');

      getApi.postMessage({
        command: 'try-select-project',
        payload: { version },
      });

      const listener = (
        { data: { command, payload: { success, fsPath: returnedPath } } }: any,
      ) => {
        if (command === 'return-try-select-project') {
          setExecuting(false);

          // TODO: save fsPath and send message 'ready-open-folder',
          // and refactor index page to loading before restore message is received
          // FIXME: state module seems to be incorrect

          if (success) {
            window.removeEventListener('message', listener);
            toPages(returnedPath);
          }
        }
      };

      window.addEventListener('message', listener);
    };

    return (
      <Space direction="vertical" style={{ width: '100%' }}>
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
          <Space direction="vertical" style={{ width: '100%' }}>
            <Form layout="inline" form={form} onFinish={handleCloneClicked}>
              <Form.Item
                name="folderPath"
                trigger="onChange"
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
                        getApi.postMessage({
                          command: 'validate-path',
                          payload: {
                            value,
                            pname: githubUrl.split('/')[1],
                          },
                        });

                        const listener = (
                          { data: { command, payload: { result, message: msg } } }: any,
                          // eslint-disable-next-line consistent-return
                        ) => {
                          if (command === 'return-validate-path') {
                            window.removeEventListener('message', listener);
                            if (result === 'success') {
                              return resolve('success');
                            }
                            return reject(new Error(msg));
                          }
                        };

                        window.addEventListener('message', listener);
                      });
                    },
                  }),
                ]}
              >
                <Input
                  style={{ width: '300px' }}
                  placeholder="Base folder"
                  prefix={<FolderOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />}
                  allowClear
                  readOnly={executing === 'clone'}
                />
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={executing === 'clone'}
                  disabled={executing === 'select'}
                >
                  Git clone
                </Button>
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
                    {`https://github.com/${githubUrl}.git`}
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
          <Space direction="vertical" style={{ width: '100%' }}>
            {/** not using antd's upload component since it can only get files */}
            <Button
              type="primary"
              onClick={handleSelectClicked}
              loading={executing === 'select'}
              disabled={executing === 'clone'}
            >
              {executing === 'select' ? 'Selecting...' : 'Select a folder'}
            </Button>
            <Paragraph>
              If your local driver has already contained
              this project (with git enabled), you can tell ENRE-marker
              to directly reuse it.
            </Paragraph>
            <Alert
              message="Project will be reset (if necessary)"
              description={'ENRE-marker will run "git checkout" to reset project to match the version specified in our server, so do not select a folder in which you have made some edits.'}
              type="warning"
              showIcon
            />
          </Space>
        </Card>
      </Space>
    );
  }

  // if no fsPath (not inited)
  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Title level={4}>
        A copy of project&nbsp;
        <Typography.Text code>
          {name}
        </Typography.Text>
        &nbsp;is stored in your machine
      </Title>
      <Card
        title={(
          <Space>
            <DesktopOutlined style={{ color: 'rgba(0,0,0,0.75)' }} />
            <span>Reassign the working folder to another path</span>
          </Space>
        )}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Descriptions>
            <Descriptions.Item label="Current">
              <Tooltip title="View in file explorer">
                <a
                  onClick={() => getApi.postMessage({ command: 'open-folder', payload: fsPath })}
                >
                  {fsPath}
                </a>
              </Tooltip>
              &nbsp;with commit hash&nbsp;
              <Typography.Text code>
                {version}
              </Typography.Text>
            </Descriptions.Item>
          </Descriptions>
          <Button
            danger
            onClick={() => {
              workingDispatcher({ payload: { project: { fsPath: undefined } } });
            }}
          >
            Reassign a path
          </Button>
          <Alert
            message="You will NOT be able to continue your work until the process is successfully and completely finished."
            type="warning"
          />
        </Space>
      </Card>
    </Space>
  );
};
