import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRequest } from 'ahooks';
import {
  Table, Progress, Button, Tag, Tooltip, Divider, Space,
} from 'antd';
import { LinkOutlined, LockOutlined } from '@ant-design/icons';
import { request } from '../../compatible/httpAdapter';
import { NavContext, WorkingContext } from '../../context';
import { langTable, langTableIndex } from '../../.static/config';
import { getApi } from '../../compatible/apiAdapter';

const RenderAction = (claimed: boolean, {
  pid, name, githubUrl, state,
}: remote.project) => {
  // @ts-ignore
  const { dispatcher: workingDispatcher } = useContext(WorkingContext);
  // @ts-ignore
  const { dispatcher: navDispatcher } = useContext(NavContext);
  const navigate = useNavigate();

  const handleClaimClicked = async () => {
    const res: remote.resClaim = await request(`POST project/${pid}/claim`);
    workingDispatcher({ payload: { project: { pid, name, githubUrl } } });
    navDispatcher({ payload: 'pid' });
    navigate(`/project/${pid}`, {
      state: {
        init: true,
      },
    });
  };

  if (claimed) {
    return (
      <Space split={<Divider type="vertical" />}>
        <Link to={`/project/${pid}`}>
          <Button
            style={{ paddingRight: 0 }}
            type="link"
            disabled
          >
            Claimed
          </Button>
        </Link>
        <Link to={`/project/${pid}/file`}>
          <Button
            style={{ paddingLeft: 0 }}
            type="link"
          >
            View
          </Button>
        </Link>
      </Space>
    );
  }
  return (
    <Space split={<Divider type="vertical" />}>
      <Link to={`/project/${pid}`}>
        <Button
          style={{ paddingRight: 0 }}
          type="link"
          onClick={handleClaimClicked}
          disabled={state === 1}
        >
          Claim
        </Button>
      </Link>
      <Link to={`/project/${pid}/file`}>
        <Button
          style={{ paddingLeft: 0 }}
          type="link"
        >
          View
        </Button>
      </Link>
    </Space>
  );
};

const columns = [
  {
    title: 'Project Name',
    dataIndex: 'name',
    key: 'pname',
    render: (name: string, data: remote.project) => (
      <>
        <Link to={`/project/${data.pid}`}>{name}</Link>
        {data.state === 1
          ? (
            <Tooltip title="Locked, view only" placement="right">
              <LockOutlined
                style={{
                  color: 'rgba(0,0,0,0.75)',
                  paddingLeft: '0.6em',
                }}
              />
            </Tooltip>
          )
          : undefined}
      </>
    ),
    sorter: (a: remote.project, b: remote.project) => (a.name > b.name ? 1 : -1),
    filters: [
      {
        text: 'Active',
        value: true,
      },
      {
        text: 'Locked',
        value: false,
      },
    ],
    onFilter: (value: boolean, record: remote.project) => record.state === (value ? 0 : 1),
  },
  {
    title: 'Version',
    dataIndex: 'version',
    key: 'version',
    render: (value: string, record: remote.project) => (
      <>
        <span style={{ verticalAlign: 'middle' }}>{value}</span>
        <Tooltip
          title="View in GitHub"
          placement="left"
        >
          <Button
            style={{ float: 'right' }}
            type="link"
            onClick={() => {
              getApi.postMessage({
                command: 'open-url-in-browser',
                payload: `https://github.com/${record.githubUrl}/tree/${record.version}`,
              });
            }}
          >
            <LinkOutlined />
          </Button>
        </Tooltip>
      </>
    ),
  },
  {
    title: 'Language',
    dataIndex: 'lang',
    key: 'lang',
    render: (value: langTableIndex) => (
      <Tag color={langTable[value].color}>
        {langTable[value].text}
      </Tag>
    ),
    filters: Object.keys(langTable).map((k) => ({
      text: langTable[k as langTableIndex].text,
      value: k,
    })),
    onFilter: (value: string, record: remote.project) => record.lang === value,
  },
  {
    title: 'Mark Progress',
    dataIndex: 'progress',
    key: 'progress',
    render: (value: number) => <Progress percent={value} size="small" />,
    sorter: (a: remote.project, b: remote.project) => (a.progress > b.progress ? 1 : -1),
  },
  {
    title: 'Action',
    dataIndex: 'claimed',
    key: 'action',
    render: RenderAction,
  },
];

export const ProjectViewer: React.FC = () => {
  const { data, loading } = useRequest(
    () => request('GET project')
      .then(
        ({ project }: remote.resProjects) => project.sort(
          ({ progress: pa, claimed: ca }, { progress: pb, claimed: cb }) => {
            // completed project should sink to bottom
            if (pa === 100) {
              return 1;
            }
            if (pb === 100) {
              return -1;
            }

            // claimed project should float to top
            if (ca || cb) {
              /* note that the count of claimed project should have a maximum of 1,
               * so it's ok in mock environment that claimed projects
               * are not been sorted by progress
               */
              return ca > cb ? -1 : 1;
            }

            // under-progress project should be sort by progress descend
            return pa > pb ? -1 : 1;
          },
        ),
      ),
  );

  return (
    <Table
      dataSource={data}
      rowKey={(record) => record.pid}
      // @ts-ignore
      columns={columns}
      pagination={false}
      loading={loading}
    />
  );
};
