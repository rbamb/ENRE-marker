import React, { useContext, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Table, Progress, Button } from 'antd';
import { useAntdTable } from 'ahooks';
import { request } from '../../compatible/httpAdapter';
import { WorkingContext, NavContext } from '../../context';
import { getApi } from '../../compatible/apiAdapter';
import { ViewHelper } from '../../components/ViewHelper';

const RenderAction = (record: remote.file, type: 'entity' | 'relation', fsPath: string | undefined) => {
  const { fid, path } = record;

  const { dispatcher: workingDispatcher } = useContext(WorkingContext);
  const { dispatcher: navDiapatcher } = useContext(NavContext);

  return (
    <Link to={`/project/${gpid}/file/${fid}/${type}`}>
      <Button
        onClick={() => {
          if (inViewMode) {
            workingDispatcher({ payload: { viewProject: { file: path, mode: type } } });
          } else {
            workingDispatcher({ payload: { file: undefined } });
            workingDispatcher({ payload: { file: { fid, path, workingOn: type } } });
            navDiapatcher({ payload: type });
            getApi.postMessage({ command: 'open-file', payload: { fpath: path, base: fsPath as string } });
          }
        }}
      >
        {inViewMode ? 'View' : 'Mark'}
      </Button>
    </Link>
  );
};

const columns = [
  {
    title: 'File Path',
    dataIndex: 'path',
    key: 'fpath',
    render: (fpath: string) => (inViewMode ? fpath : (
      <a
        onClick={() => {
          getApi.postMessage({ command: 'open-file', payload: { fpath, mode: 'entity', base: gfsPath } });
        }}
      >
        {fpath}
      </a>
    )),
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
        render: (_: undefined, record: remote.file) => RenderAction(record, 'entity', gfsPath),
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
        render: (_: undefined, record: remote.file) => RenderAction(record, 'relation', gfsPath),
      },
    ],
  },
];

let gpid: number;
let gfsPath: string | undefined;
let inViewMode: boolean;

/** to support view mode (only view files rather than claim the project and do mark things),
 * the component should fetch pid from the url,
 * if url's pid === state's pid, then we are in mark mode,
 * else we are in view mode.
 */
export const FileViewer: React.FC = () => {
  const { pid: urlPid } = useParams();

  gpid = parseInt(urlPid as string, 10);

  const {
    state: {
      project: {
        pid: statePid,
        fsPath,
      } = { pid: undefined, fsPath: undefined },
    } = { project: { pid: undefined, fsPath: undefined } }, dispatcher,
  } = useContext(WorkingContext);

  inViewMode = gpid !== statePid;

  gfsPath = fsPath;

  const {
    tableProps, pagination,
  } = useAntdTable(
    /** since fid2path mapping demands a full set of data,
     * so get project will always aqruire all data,
     * and do a local pagination
     *
     * in production env, cache will be enabled,
     * which will works fine with paging functionality
     */
    () => request(`GET project/${urlPid}`)
      .then(({ file }: remote.resFiles) => ({ total: file.length, list: file })),
    {
      ...(IS_PRODUCTION ? {
        cacheKey: 'files',
        staleTime: 30000,
      } : {}),
      defaultPageSize: 100,
    },
  );

  const {
    dataSource: data,
    loading,
  } = tableProps;

  // in mark mode
  useEffect(() => {
    if (!inViewMode && data) {
      const c = data.map((i) => ({
        fid: i.fid,
        path: i.path,
      }));

      dispatcher({ payload: { project: { map: c } } });
    }
  }, [loading]);

  return (
    <>
      <Table
        sticky
        {...tableProps}
        pagination={{
          ...pagination as any,
          position: ['topLeft', 'bottomLeft'],
          showSizeChanger: false,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} records`,
          size: 'default',
        }}
        rowKey={(record) => record.fid}
        // @ts-ignore
        columns={columns}
      />
      {inViewMode ? <ViewHelper /> : undefined}
    </>
  );
};
