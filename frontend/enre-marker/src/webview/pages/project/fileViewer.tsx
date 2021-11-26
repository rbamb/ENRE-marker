import React, { useContext, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Table, Progress, Button } from 'antd';
import { useRequest } from 'ahooks';
import { request } from '../../compatible/httpAdapter';
import { WorkingContext, NavContext } from '../../context';
import { getApi } from '../../compatible/apiAdapter';

const RenderAction = (record: remote.file, type: 'entity' | 'relation', fsPath: string) => {
  const { fid, path } = record;

  const { state, dispatcher: workingDispatcher } = useContext(WorkingContext);
  const { dispatcher: navDiapatcher } = useContext(NavContext);

  return (
    <Link to={`/project/${state.project.pid}/file/${fid}/${type}`}>
      <Button
        onClick={() => {
          workingDispatcher({ payload: { file: undefined } });
          workingDispatcher({ payload: { file: { fid, path, workingOn: type } } });
          navDiapatcher({ payload: type });
          getApi.postMessage({ command: 'open-file', payload: { fpath: path, mode: type, base: fsPath } });
        }}
      >
        Mark
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
        render: (_: undefined, record: remote.file) => RenderAction(record, 'entity', fsPath),
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
        render: (_: undefined, record: remote.file) => RenderAction(record, 'relation', fsPath),
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

  // TODO: view mode
  const {
    state: {
      project: {
        pid:
        statePid, fsPath,
      },
    }, dispatcher,
  } = useContext(WorkingContext);

  const { data, loading } = useRequest(
    () => request(`GET project/${urlPid}`).then(({ file }: remote.resFiles) => file),
    IS_PRODUCTION ? {
      cacheKey: 'files',
      staleTime: 30000,
    } : undefined,
  );

  // in mark mode
  useEffect(() => {
    if (parseInt(urlPid as string, 10) === statePid && data) {
      const c = data.map((i) => ({
        fid: i.fid,
        path: i.path,
      }));

      dispatcher({ payload: { project: { map: c } } });
    }
  }, [loading]);

  return (
    <Table
      sticky
      dataSource={data}
      loading={loading}
      rowKey={(record) => record.fid}
      // @ts-ignore
      columns={columns(fsPath)}
      pagination={false}
    />
  );
};
