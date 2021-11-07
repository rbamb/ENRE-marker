import React from 'react';
import {
  Typography, Button, Space, Card, Alert, Upload,
} from 'antd';
import { GithubOutlined, DesktopOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

export const ProjectDashboard: React.FC<{ init?: boolean }> = ({ init }) => {
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
            <Button type="primary">Git clone</Button>
            <Paragraph>
              By clicking the button above,
              ENRE-marker will automatically run
              git command
              <Text code>
                git clone xxx
              </Text>
              in background, and open it after done.
            </Paragraph>
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
              description="ENRE-marker will scan all files in that folder to make sure them are not been modified and match the version specified in our server."
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
