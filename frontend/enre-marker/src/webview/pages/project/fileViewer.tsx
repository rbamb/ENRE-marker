import React, { useContext, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Table, Progress, Button } from 'antd';
import { request } from '../../compatible/httpAdapter';
import { WorkingContext, NavContext } from '../../context';

const RenderAction = (record: remote.file, type: 'entity' | 'relation') => {
  const { fid, path } = record;

  // @ts-ignore
  const { state, dispatcher: workingDispatcher } = useContext(WorkingContext);
  // @ts-ignore
  const { dispatcher: navDiapatcher } = useContext(NavContext);

  // eslint-disable-next-line react/destructuring-assignment
  if (record[type].progress !== 100) {
    return (
      <Link to={`/project/${state.project.pid}/file/${fid}/${type}?action=mark`}>
        <Button
          onClick={() => {
            workingDispatcher({ payload: { file: { fid, path, workingOn: type } } });
            navDiapatcher({ payload: type });
          }}
        >
          Mark
        </Button>
      </Link>
    );
  }

  return (
    // eslint-disable-next-line react/destructuring-assignment
    <Link to={`/project/${state.project.pid}/file/${fid}/${type}?action=view`}>
      <Button
        type="dashed"
        onClick={() => {
          workingDispatcher({ payload: { file: { fid, path, workingOn: type } } });
          navDiapatcher({ payload: type });
        }}
      >
        View
      </Button>
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
  // if get to this page by redirecting, and data hasn't been set
  const { state } = useLocation();

  // if get to this page by click the navbar, data and state are neither set
  // need to fetch data from the server
  const [remoteFetch, setRemoteFetch] = useState<Array<remote.file>>();
  // @ts-ignore
  const { state: { project: { pid } } } = useContext(WorkingContext);

  useEffect(() => {
    if (!(data || state || remoteFetch)) {
      (async () => {
        const res: remote.resFiles = await request(`GET project/${pid}`);
        setRemoteFetch(res.fileHash);
      })();
    }
  });

  return (
    <Table
      dataSource={data || state || remoteFetch}
      loading={!(data || state || remoteFetch)}
      rowKey={(record) => record.fid}
      // @ts-ignore
      columns={columns}
      pagination={false}
    />
  );
};
