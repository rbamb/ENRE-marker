import React, { useContext, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Table, Progress, Button } from 'antd';
import { useRequest } from 'ahooks';
import { request } from '../../compatible/httpAdapter';
import { WorkingContext, NavContext } from '../../context';
import { getApi } from '../../compatible/apiAdapter';

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

const columns = (fsPath: string) => ([
  {
    title: 'File Path',
    dataIndex: 'path',
    key: 'fpath',
    render: (fpath: string) => (
      <a
        onClick={() => {
          getApi.postMessage({ command: 'open-file', payload: { fpath, mode: 'entity', base: fsPath } });
        }}
      >
        {fpath}
      </a>
    ),
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
]);

/** to support view mode (only view files rather than claim the project and do mark things),
 * the component should fetch pid from the url,
 * if url's pid === state's pid, then we are in mark mode,
 * else we are in view mode.
 */
export const FileViewer: React.FC = () => {
  const { pid: urlPid } = useParams();

  const { state: { project: { pid: statePid, fsPath } } } = useContext(WorkingContext);

  const { data, loading } = useRequest(() => request(`GET project/${urlPid}`).then(({ file }: remote.resFiles) => file));

  return (
    <Table
      dataSource={data}
      loading={loading}
      rowKey={(record) => record.fid}
      // @ts-ignore
      columns={columns(fsPath)}
      pagination={false}
    />
  );
};
