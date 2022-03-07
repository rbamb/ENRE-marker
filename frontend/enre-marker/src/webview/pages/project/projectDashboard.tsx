import React, { useState } from 'react';
import {
  Typography, Row, Col, Statistic, Collapse, Radio, Table, Spin, Skeleton,
} from 'antd';
import { Bar } from '@ant-design/plots';
import { useRequest } from 'ahooks';
import { request } from '../../compatible/httpAdapter';

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

const DataView: React.FC<{ category: 'Entity' | 'Relation', data: remote.erCount }> = ({ category, data }) => {
  const total = data.premarked
    + data.passed
    + data.modified
    + data.unreviewed
    + data.inserted;

  const progressDone = data.premarked
    + data.passed
    + data.removed
    + data.modified;

  const progressTotal = data.premarked
    + data.passed
    + data.removed
    + data.modified
    + data.unreviewed;

  return (
    <>
      <Row style={{ marginBottom: '1em' }}>
        <Col flex={1}>
          <Statistic
            title="Current Total Count"
            value={total}
            suffix={`= ${progressTotal} - ${data.removed} + ${data.inserted}`}
          />
        </Col>
        <Col flex={1}>
          <Statistic
            title="Progress in Count"
            value={progressDone}
            suffix={`/ ${progressTotal}`}
          />
        </Col>
        <Col flex={1}>
          <Statistic
            title="Progress in Percentage"
            value={Math.round((progressDone / progressTotal) * 100)}
            suffix="%"
          />
        </Col>
      </Row>
      <Bar
        data={[
          { count: data.premarked, type: category, action: 'ENRE Premarked' },
          { count: data.passed, type: category, action: 'Passed' },
          { count: data.removed, type: category, action: 'Removed' },
          { count: data.modified, type: category, action: 'Modified' },
          { count: data.unreviewed, type: category, action: 'Unreviewed' },
          { count: data.inserted, type: category, action: 'Inserted' },
        ]}
        isStack
        xField="count"
        yField="type"
        seriesField="action"
        // @ts-ignore
        color={state2ColorHex}
        xAxis={false}
        yAxis={false}
        height={60}
      />
    </>
  );
};

const sum = (data: remote.contriByUser) => data.operations.passed
  + data.operations.removed
  + data.operations.modified
  + data.operations.inserted;

const tableColumns = [
  {
    title: 'User Name',
    dataIndex: 'name',
    key: 'uname',
  },
  {
    title: 'Operations',
    children: [
      {
        title: 'Passed',
        dataIndex: ['operations', 'passed'],
        key: 'passed',
        align: 'center',
      },
      {
        title: 'Removed',
        dataIndex: ['operations', 'removed'],
        key: 'removed',
        align: 'center',
      },
      {
        title: 'Modified',
        dataIndex: ['operations', 'modified'],
        key: 'modified',
        align: 'center',
      },
      {
        title: 'Inserted',
        dataIndex: ['operations', 'inserted'],
        key: 'inserted',
        align: 'center',
      },
    ],
  },
  {
    title: 'Total',
    align: 'center',
    render: (contri: remote.contriByUser) => sum(contri),
    defaultSortOrder: 'descend',
    sorter: (v1: remote.contriByUser, v2: remote.contriByUser) => sum(v1) > sum(v2),
  },
];

export const ProjectDashboard: React.FC<{ project: remote.project }> = ({
  project: {
    pid, githubUrl, version, progress,
  },
}) => {
  const { data, loading } = useRequest(
    () => request(`GET project/${pid}/stats`)
      // eslint-disable-next-line no-sequences
      .then(({ stats }: remote.resStatistic) => stats),
    IS_PRODUCTION ? {
      // for cold data, enabling cache mechanism
      cacheKey: `statistic${pid}`,
      staleTime: 10000,
    } : undefined,
  );

  const { entities, relations, contributions } = data || {};

  const [radioSelection, setRadioSelection] = useState('total');

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
      {loading || !data ? <Skeleton active={loading} /> : (
        <Collapse ghost defaultActiveKey={[0, 1, 2]}>
          <Panel header="Entities" key={0}>
            <DataView category="Entity" data={entities!.countByCategory} />
          </Panel>
          <Panel header="Relations" key={1}>
            <DataView category="Relation" data={relations!.countByCategory} />
          </Panel>
          <Panel header="Contributions" key={2}>
            <Row style={{ marginBottom: '1em' }}>
              <Radio.Group style={{ width: '100%' }} value={radioSelection} onChange={(e) => setRadioSelection(e.target.value)}>
                <Radio.Button value="total" style={{ width: '50%', textAlign: 'center' }}>Total</Radio.Button>
                <Radio.Button value="thisWeek" style={{ width: '50%', textAlign: 'center' }}>This Week</Radio.Button>
              </Radio.Group>
            </Row>
            <Table
              // @ts-ignore
              columns={tableColumns}
              // @ts-ignore
              dataSource={contributions?.[radioSelection]}
              pagination={false}
              sortDirections={['descend']}
            />
          </Panel>
        </Collapse>
      )}
    </>
  );
};
