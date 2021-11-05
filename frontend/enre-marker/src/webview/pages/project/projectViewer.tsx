import React from 'react';
import { Link } from 'react-router-dom';
import { useRequest } from 'ahooks';
import { Table, Progress, Button } from 'antd';
import { SortOrder } from 'antd/lib/table/interface';
import { request } from '../../compatible/httpAdapter';

const renderAction = (claimed: boolean, data: remote.project) => {
  // TODO: Refactor with useRequest
  const handleClaimClicked = async () => {
    const res = await request(`POST project/${data.pid}/claim`);
    console.log(res);
  };

  if (data.progress === 100) {
    return (
      <Link to={`/project/${data.pid}`}>
        <Button type="dashed">View</Button>
      </Link>
    );
  }
  if (claimed) {
    return (
      <Link to={`/project/${data.pid}`}>
        <Button disabled>Claimed</Button>
      </Link>
    );
  }
  return (
    <Link to={`/project/${data.pid}`}>
      <Button onClick={handleClaimClicked}>Claim</Button>
    </Link>
  );
};

const columns = [
  {
    title: 'Project Name',
    dataIndex: 'name',
    key: 'pname',
    render: (name: string, data: remote.project) => <Link to={`/project/${data.pid}`}>{name}</Link>,
  },
  {
    title: 'Version',
    dataIndex: 'version',
    key: 'version',
  },
  {
    title: 'Language',
    dataIndex: 'lang',
    key: 'lang',
  },
  {
    title: 'Mark Progress',
    dataIndex: 'progress',
    key: 'progress',
    render: (value: number) => <Progress percent={value} size="small" />,
  },
  {
    title: 'Action',
    dataIndex: 'claimed',
    key: 'action',
    render: renderAction,
    // Defaultly let currently claimed project be shown at top of the table
    // TODO: refactor by sort before display
    sorter: (p1: remote.project, p2: remote.project) => ((p1.claimed > p2.claimed) ? 1 : -1),
    sortOrder: 'descend' as SortOrder,
  },
];

export const ProjectViewer: React.FC = () => {
  const { data, error, loading } = useRequest(() => request('GET project').then(({ project }: remote.resProject) => project));

  return (
    <Table
      dataSource={error ? undefined : data as any}
      rowKey={(record) => record.pid}
      columns={columns}
      pagination={false}
      loading={loading}
    />
  );
};
