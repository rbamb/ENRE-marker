import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRequest } from 'ahooks';
import { Table, Progress, Button } from 'antd';
import { SortOrder } from 'antd/lib/table/interface';
import { request } from '../../compatible/httpAdapter';
import { NavContext, WorkingContext } from '../../context';

const RenderAction = (claimed: boolean, {
  pid, name, githubUrl, progress,
}: remote.project) => {
  // @ts-ignore
  const { dispatcher: workingDispatcher } = useContext(WorkingContext);
  // @ts-ignore
  const { dispatcher: navDispatcher } = useContext(NavContext);
  const navigate = useNavigate();

  const handleClaimClicked = async () => {
    const res: remote.resFiles = await request(`POST project/${pid}/claim`);
    workingDispatcher({ payload: { project: { pid, name, githubUrl } } });
    navDispatcher({ payload: 'file' });
    navigate(`/project/${pid}/file`, { state: res.fileHash });
  };

  if (progress === 100) {
    return (
      <Link to={`/project/${pid}`}>
        <Button type="dashed">View</Button>
      </Link>
    );
  }
  if (claimed) {
    return (
      <Link to={`/project/${pid}`}>
        <Button disabled>Claimed</Button>
      </Link>
    );
  }
  return (
    <Link to={`/project/${pid}`}>
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
    render: RenderAction,
    // Defaultly let currently claimed project be shown at top of the table
    // TODO: refactor by sort before display
    sorter: (p1: remote.project, p2: remote.project) => ((p1.claimed > p2.claimed) ? 1 : -1),
    sortOrder: 'descend' as SortOrder,
  },
];

export const ProjectViewer: React.FC = () => {
  const { data, error, loading } = useRequest(() => request('GET project').then(({ project }: remote.resProjects) => project));

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
