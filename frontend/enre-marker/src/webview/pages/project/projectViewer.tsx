import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRequest } from 'ahooks';
import {
  Table, Progress, Button, Tag, Tooltip, Divider, Space, Typography, message,
} from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { request } from '../../compatible/httpAdapter';
import { NavContext, WorkingContext } from '../../context';
import { langTable, langTableIndex } from '../../.static/config';
import { getApi } from '../../compatible/apiAdapter';

const RenderAction = (claimed: boolean, {
  pid, name, githubUrl, state, version, lang,
}: remote.project) => {
  const { dispatcher: workingDispatcher } = useContext(WorkingContext);
  const { dispatcher: navDispatcher } = useContext(NavContext);
  const navigate = useNavigate();

  const handleClaimClicked = async (mode: 'claim' | 'restore') => {
    if (mode === 'claim') {
      message.loading({
        content: 'Claiming...',
        key: 'claim',
        duration: 0,
      });
    }

    try {
      let collaborator;

      if (mode === 'claim') {
        const res: remote.resClaim = await request(`POST project/${pid}/claim`);
        collaborator = res.collaborator;
      }

      // clean up
      workingDispatcher({
        payload: {
          project: undefined,
          file: undefined,
        },
      });
      // set new
      workingDispatcher({
        payload: {
          project: {
            pid, name, githubUrl, version, lang,
          },
        },
      });
      navDispatcher({ payload: 'pid' });
      navigate(`/project/${pid}`, {
        state: {
          init: true,
          collaborator,
        },
      });
    } catch (e) {
      // destroy
    } finally {
      message.destroy('claim');
    }
  };

  if (claimed) {
    return (
      <Space split={<Divider type="vertical" />}>
        <Button
          style={{ paddingLeft: 0, paddingRight: 0 }}
          type="link"
          disabled
        >
          Claimed
        </Button>
        {!gfsPath ? (
          <Button
            style={{ paddingLeft: 0, paddingRight: 0 }}
            type="link"
            onClick={() => handleClaimClicked('restore')}
            disabled={state === 1}
          >
            Restore
          </Button>
        ) : undefined}
        {/* {gfsPath ? (
          <Link to={`/project/${pid}/file`}>
            <Button
              style={{ paddingLeft: 0, paddingRight: 0 }}
              type="link"
              onClick={() => {
                navDispatcher({ payload: 'file' });
              }}
            >
              View
            </Button>
          </Link>
        ) : undefined} */}
      </Space>
    );
  }
  return (
    <Space split={<Divider type="vertical" />}>
      <Button
        style={{ paddingLeft: 0, paddingRight: 0 }}
        type="link"
        onClick={() => handleClaimClicked('claim')}
        disabled={state === 1}
      >
        Claim
      </Button>
      <Link to={`/project/${pid}/file`}>
        <Button
          style={{ paddingLeft: 0, paddingRight: 0 }}
          type="link"
          onClick={() => {
            workingDispatcher({
              payload: {
                /** since lang is needed for displaying entity table,
                 * when user is in view mode by clicking view button,
                 * save that project's meta infos to storage.
                 * (this storage will be removed whenever user click a botton in menubar)
                 */
                viewProject: {
                  pid, name, githubUrl, version, lang,
                },
              },
            });
            navDispatcher({ payload: undefined });
          }}
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
        {name}
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
      <Tooltip
        title="View in GitHub"
        placement="left"
      >
        <Typography.Link
          onClick={() => {
            getApi.postMessage({
              command: 'open-url-in-browser',
              payload: `https://github.com/${record.githubUrl}/tree/${record.version}`,
            });
          }}
        >
          {value}
        </Typography.Link>
      </Tooltip>
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

let gfsPath: string | undefined;

export const ProjectViewer: React.FC = () => {
  const {
    state: {
      project: stateProject,
    } = { project: undefined },
  } = useContext(WorkingContext);

  gfsPath = stateProject?.fsPath;

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
    IS_PRODUCTION ? {
      // for cold data, enabling cache mechanism
      cacheKey: 'projects',
      staleTime: 60000,
    } : undefined,
  );

  return (
    <Table
      sticky
      dataSource={data}
      rowKey={(record) => record.pid}
      // @ts-ignore
      columns={columns}
      pagination={false}
      loading={loading}
    />
  );
};
