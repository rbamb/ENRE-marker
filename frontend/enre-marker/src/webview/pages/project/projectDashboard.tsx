import React from 'react';
import {
  Typography, Row, Col, Statistic, Collapse, Radio, Table,
} from 'antd';
import { Bar } from '@ant-design/plots';

const { Title } = Typography;
const { Panel } = Collapse;

const state2ColorHex = ({ action }: { action: 'ENRE Premarked' | 'Passed' | 'Removed' | 'Modified' | 'Unreviewed' | 'Inserted' }) => {
  switch (action) {
    case 'ENRE Premarked':
      return '#a0d911';
    case 'Passed':
      return '#52c41a';
    case 'Removed':
      return '#ff4d4f';
    case 'Modified':
      return '#faad14';
    case 'Unreviewed':
      return '#d9d9d9';
    case 'Inserted':
      return '#1890ff';
    default:
      return '#ffffff';
  }
};

const tableColumns = [
  {
    title: 'User Name',
  },
  {
    title: 'Operations',
    children: [
      {
        title: 'Passed',
      },
      {
        title: 'Removed',
      },
      {
        title: 'Modified',
      },
      {
        title: 'Inserted',
      },
    ],
  },
  {
    title: 'Total',
  },
];

export const ProjectDashboard: React.FC<{ project: remote.project }> = ({
  project: {
    pid, githubUrl, version, progress,
  },
}) => {
  console.log('aaa');

  return (
    <>
      <Row>
        <Col flex={2}>
          <Typography>
            <Title>
              {githubUrl}
              <h5>{`@${version}`}</h5>
            </Title>
          </Typography>
        </Col>
        <Col flex={1}>
          <Statistic
            title="Overall Progress"
            value={progress}
            suffix="%"
          />
        </Col>
      </Row>
      <Collapse ghost defaultActiveKey={[0, 1, 2]}>
        <Panel header="Entities" key={0}>
          <Row style={{ marginBottom: '1em' }}>
            <Col flex={1}>
              <Statistic
                title="Current Total Count"
                value={400 + 10 - 10 + 20 + 880 + 10}
                suffix={`+${100}`}
              />
            </Col>
            <Col flex={1}>
              <Statistic
                title="Progress in Count"
                value={1024}
                suffix={`/ ${2048}`}
              />
            </Col>
            <Col flex={1}>
              <Statistic
                title="Progress in Percentage"
                value={40}
                suffix="%"
              />
            </Col>
          </Row>
          <Bar
            data={[
              { count: 400, type: 'Entity', action: 'ENRE Premarked' },
              { count: 10, type: 'Entity', action: 'Passed' },
              { count: 10, type: 'Entity', action: 'Removed' },
              { count: 20, type: 'Entity', action: 'Modified' },
              { count: 880, type: 'Entity', action: 'Unreviewed' },
              { count: 100, type: 'Entity', action: 'Inserted' },
            ]}
            isStack
            xField="count"
            yField="type"
            seriesField="action"
            // @ts-ignore
            color={state2ColorHex}
            xAxis={false}
            yAxis={false}
            height={50}
          />
        </Panel>
        <Panel header="Relations" key={1}>
          aaa
        </Panel>
        <Panel header="Contributions" key={2}>
          <Row style={{ marginBottom: '1em' }}>
            <Radio.Group defaultValue="total" style={{ width: '100%' }}>
              <Radio.Button value="total" style={{ width: '50%', textAlign: 'center' }}>Total</Radio.Button>
              <Radio.Button value="thisWeek" style={{ width: '50%', textAlign: 'center' }}>This Week</Radio.Button>
            </Radio.Group>
          </Row>
          <Table
            columns={tableColumns}
          />
        </Panel>
      </Collapse>
    </>
  );
};
