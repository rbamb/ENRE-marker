import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useRequest } from 'ahooks';
import { Table, Progress, Button } from 'antd';
import { request } from '../../compatible/httpAdapter';
import { WorkingContext } from '../../context';

const RenderAction = (record: remote.file, type: 'entity' | 'relation') => {
  // @ts-ignore
  const { state } = useContext(WorkingContext);

  // eslint-disable-next-line react/destructuring-assignment
  if (record[type].progress !== 100) {
    return (
      <Link to={`/project/${state.project.pid}/file/${record.fid}/${type}?action=mark`}>
        <Button>Mark</Button>
      </Link>
    );
  }

  return (
    // eslint-disable-next-line react/destructuring-assignment
    <Link to={`/project/${state.project.pid}/file/${record.fid}/${type}?action=view`}>
      <Button type="dashed">View</Button>
    </Link>
  );
};

const columns = [
  {
    title: 'File Path',
    dataIndex: 'path',
    key: 'fpath',
  },
  {
    title: 'Entity',
    children: [
      {
        title: 'Count',
        dataIndex: ['entity', 'count'],
        key: 'ecount',
        align: 'center',
      },
      {
        title: 'Progress',
        dataIndex: ['entity', 'progress'],
        key: 'eprogress',
        align: 'center',
        render: (value: number) => <Progress percent={value} size="small" />,
      },
      {
        title: 'Action',
        key: 'eaction',
        align: 'center',
        render: (_: undefined, record: remote.file) => RenderAction(record, 'entity'),
      },
    ],
  },
  {
    title: 'Relation',
    children: [
      {
        title: 'Count',
        dataIndex: ['relation', 'count'],
        key: 'rcount',
        align: 'center',
      },
      {
        title: 'Progress',
        dataIndex: ['relation', 'progress'],
        key: 'rprogress',
        align: 'center',
        render: (value: number) => <Progress percent={value} size="small" />,
      },
      {
        title: 'Action',
        key: 'raction',
        align: 'center',
        render: (_: undefined, record: remote.file) => RenderAction(record, 'relation'),
      },
    ],
  },
];

export const FileViewer: React.FC<{ data?: Array<remote.file> }> = ({ data }) => {
  const { state } = useLocation();

  return (
    <Table
      dataSource={data || state}
      rowKey={(record) => record.fid}
      // @ts-ignore
      columns={columns}
      pagination={false}
    />
  );
};
