import {
  Table,
  Button,
  Tooltip,
  Badge,
  Card,
  Modal,
  Typography,
  Select,
  Alert,
  Descriptions,
  Divider,
  Space,
  Radio,
  message,
  notification,
} from 'antd';
import {
  CheckOutlined, CloseOutlined, EditOutlined, PlusOutlined,
} from '@ant-design/icons';
import React, { useContext, useEffect, useState } from 'react';
import { useAntdTable } from 'ahooks';
import { useNavigate, useParams } from 'react-router-dom';
import { request } from '../../compatible/httpAdapter';
import { WorkingContext } from '../../context';
import { langTableIndex, typeTable } from '../../.static/config';
import { fid2Path, getApi } from '../../compatible/apiAdapter';
import { revealEntity, revealRelation } from '../../utils/reveal';
import langRelative from '../../utils/langRelative';

const { Option } = Select;

let mtype: any;

// eslint-disable-next-line max-len
const ControlledRelationInfo: React.FC<{ eFrom?: remote.entity, eTo?: remote.entity, type?: number }> = ({
  eFrom, eTo, type,
}) => {
  const [trackedType, setType] = useState(type);

  useEffect(() => {
    mtype = trackedType;
  });

  return (
    <>
      <Alert
        type="info"
        message="Can only modify a relation's type."
      />
      <Space direction="vertical" style={{ width: '100%', marginTop: '1.2em' }}>
        <Radio.Group style={{ width: '100%' }}>
          <Radio.Button value="From Entity" style={{ width: '50%', textAlign: 'center' }}>From Entity</Radio.Button>
          <Radio.Button value="To Entity" style={{ width: '50%', textAlign: 'center' }}>To Entity</Radio.Button>
        </Radio.Group>
        <Space direction="horizontal" size="middle" align="start" style={{ width: '100%' }}>
          <Descriptions column={1}>
            <Descriptions.Item label="Code name">{eFrom ? <Typography.Text style={{ width: '80px' }} ellipsis={{ tooltip: eFrom.name }}>{eFrom.name}</Typography.Text> : '-'}</Descriptions.Item>
            <Descriptions.Item label="Starts at">{eFrom ? `line ${eFrom.loc.start.line}, column ${eFrom.loc.start.column}` : '-'}</Descriptions.Item>
            <Descriptions.Item label="Ends at">{eFrom ? `line ${eFrom.loc.end.line}, column ${eFrom.loc.end.column}` : '-'}</Descriptions.Item>
            <Descriptions.Item label="Type">{eFrom ? typeTable[glang].entity[eFrom.eType] : '-'}</Descriptions.Item>
          </Descriptions>
          <Descriptions column={1}>
            <Descriptions.Item label="Code name">{eTo ? <Typography.Text style={{ width: '80px' }} ellipsis={{ tooltip: eTo.name }}>{eTo.name}</Typography.Text> : '-'}</Descriptions.Item>
            <Descriptions.Item label="Starts at">{eTo ? `line ${eTo.loc.start.line}, column ${eTo.loc.start.column}` : '-'}</Descriptions.Item>
            <Descriptions.Item label="Ends at">{eTo ? `line ${eTo.loc.end.line}, column ${eTo.loc.end.column}` : '-'}</Descriptions.Item>
            <Descriptions.Item label="Type">{eTo ? typeTable[glang].entity[eTo.eType] : '-'}</Descriptions.Item>
          </Descriptions>
        </Space>
      </Space>
      <Divider />
      <Select
        showSearch
        placeholder="Relation Type"
        style={{ width: '100%' }}
        filterOption={(input, option) => ((option?.key) as string)
          .toLowerCase().indexOf(input.toLowerCase()) >= 0}
        defaultValue={type}
        onSelect={setType}
      >
        {typeTable[glang].relation.map((t, i) => (
          <Option key={t} value={i}>
            {t}
          </Option>
        ))}
      </Select>
    </>
  );
};

const showModifyModal = (
  rid?: number,
  eFrom?: remote.entity,
  eTo?: remote.entity,
  type?: number,
) => {
  Modal.confirm({
    title: eFrom ? 'Modify to...' : 'Insert a relation...',
    icon: eFrom ? <EditOutlined /> : <PlusOutlined style={{ color: '#108ee9' }} />,
    content: <ControlledRelationInfo eFrom={eFrom} eTo={eTo} type={type} />,
    onOk: (close) => {
      if (type === mtype) {
        message.warning('Nothing changed comparing to the old one');
        return;
      }
      // FIXME: fullfil manuallyRelation for operation insert
      handleOperationClicked(type !== undefined ? 'modify' : 'insert', rid, { rType: mtype });
      close();
    },
  });
};

let lock: boolean = false;

const handleOperationClicked = (
  type: string,
  rid?: number,
  relation?: remote.manuallyRelation,
) => {
  if (!lock) {
    lock = true;

    const key = `operation${Math.floor(Math.random() * 100)}`;
    message.loading({
      content: 'Uploading to the server',
      duration: 0,
      key,
    });
    switch (type) {
      case 'pass':
        request(`POST project/${gpid}/file/${gfid}/relation`, {
          data: [
            { isManually: false, rid, isCorrect: true },
          ],
        }).then(() => {
          message.success({
            content: 'Mark succeeded',
            key,
          });
          gmutate((compound: any) => {
            const data = compound.list as Array<remote.relation>;
            const it = data.find((r) => r.rid === rid) as remote.relation;
            it.status.hasBeenReviewed = true;
            it.status.operation = 0;
            return compound;
          });
        }).catch((json) => {
          if (json) {
            message.error({
              content: json.message,
              key,
            });
          } else {
            message.destroy(key);
          }
        }).finally(() => { lock = false; });
        break;
      case 'remove':
        request(`POST project/${gpid}/file/${gfid}/relation`, {
          data: [
            {
              isManually: false, rid, isCorrect: false, fix: { shouldBe: 1 },
            },
          ],
        }).then(() => {
          message.success({
            content: 'Mark succeeded',
            key,
          });
          gmutate((compound: any) => {
            const data = compound.list as Array<remote.relation>;
            const it = data.find((r) => r.rid === rid) as remote.relation;
            it.status.hasBeenReviewed = true;
            it.status.operation = 1;
            return compound;
          });
        }).catch((json) => {
          if (json) {
            message.error({
              content: json.message,
              key,
            });
          } else {
            message.destroy(key);
          }
        }).finally(() => { lock = false; });
        break;
      case 'modify':
        /** currently can only modify a relation's type */
        request(`POST project/${gpid}/file/${gfid}/relation`, {
          data: [
            {
              isManually: false,
              rid,
              isCorrect: false,
              fix: {
                shouldBe: 2,
                newly: relation,
              },
            },
          ],
        }).then(() => {
          message.success({
            content: 'Mark succeeded',
            key,
          });
          gmutate((compound: any) => {
            const data = compound.list as Array<remote.relation>;
            const it = data.find((r) => r.rid === rid) as remote.relation;
            it.rType = (relation as remote.manuallyRelation).rType;
            it.status.hasBeenReviewed = true;
            it.status.operation = 2;
            it.status.newRelation = relation;
            return compound;
          });
        }).catch((json) => {
          if (json) {
            message.error({
              content: json.message,
              key,
            });
          } else {
            message.destroy(key);
          }
        }).finally(() => { lock = false; });
        break;
      case 'insert':
        request(`POST project/${gpid}/file/${gfid}/relation`, {
          data: [
            {
              isManually: true,
              relation,
            },
          ],
        }).then(() => {
          message.success({
            content: 'Mark succeeded',
            key,
          });
          grefresh();
        }).catch((json) => {
          if (json) {
            message.error({
              content: json.message,
              key,
            });
          } else {
            message.destroy(key);
          }
        }).finally(() => { lock = false; });
        break;
      default:
        message.error({
          content: 'Unknown operation type',
          key,
        });
        lock = false;
    }
  }
};

const RenderExpandedRow = ({
  rid, eFrom, eTo, rType,
}: remote.relation) => (
  <Card title={(
    <>
      <span>Operation to relation&nbsp;</span>
      <Typography.Text code>
        {eFrom.name}
      </Typography.Text>
      <span>
        {` --${typeTable[glang].relation[rType]}-> `}
      </span>
      <Typography.Text code>
        {eTo.name}
      </Typography.Text>
    </>
  )}
  >
    <Card.Grid style={{ padding: 0 }}>
      <Button
        type="link"
        icon={<CheckOutlined />}
        style={{ height: '72px', color: 'green' }}
        block
        onClick={() => handleOperationClicked('pass', rid)}
      >
        Correct
      </Button>
    </Card.Grid>
    <Card.Grid style={{ padding: 0 }}>
      <Button
        type="link"
        icon={<CloseOutlined />}
        style={{ height: '72px' }}
        block
        danger
        onClick={() => handleOperationClicked('remove', rid)}
      >
        Remove
      </Button>
    </Card.Grid>
    <Card.Grid style={{ padding: 0 }}>
      <Button
        type="link"
        icon={<EditOutlined />}
        style={{ height: '72px', color: 'darkorange' }}
        block
        onClick={() => showModifyModal(rid, eFrom, eTo, rType)}
      >
        Modify
      </Button>
    </Card.Grid>
  </Card>
);

const columns = [
  {
    title: 'Status',
    align: 'center',
    render: (_: undefined, record: remote.relation) => {
      if (record.status.hasBeenReviewed) {
        switch (record.status.operation) {
          case 0 as remote.operation.reviewPassed:
            return (
              <Tooltip title="Passed">
                <Badge status="success" />
              </Tooltip>
            );
          case 1 as remote.operation.remove:
            return (
              <Tooltip title="Removed">
                <Badge status="error" />
              </Tooltip>
            );
          case 2 as remote.operation.modify:
            return (
              <Tooltip title="Modified">
                <Badge status="warning" />
              </Tooltip>
            );
          case 3 as remote.operation.insert:
            return (
              <Tooltip title="Inserted">
                <Badge color="blue" />
              </Tooltip>
            );
          default:
            return <Badge />;
        }
      }

      return (
        <Tooltip title="Waiting for review">
          <Badge status="default" />
        </Tooltip>
      );
    },
  },
  {
    title: 'From Entity',
    children: [
      {
        title: 'Code Name',
        dataIndex: ['eFrom', 'name'],
        key: 'fn',
        render: (name: string, record: remote.relation) => (
          <Tooltip title={`Qualified name:\n${name}`}>
            <a
              onClick={() => {
                if (!inViewMode) {
                  getApi.postMessage({
                    command: 'highlight-relation',
                    payload: {
                      fpath: (gmap.find((i) => i.fid === record.toFid) as fid2Path).path,
                      base: gfsPath,
                      from: record.eFrom.loc,
                      to: record.eTo.loc,
                    },
                  });
                }
              }}
            >
              {langRelative[glang].displayCodeName(record.eFrom)}
            </a>
          </Tooltip>
        ),
      },
      {
        title: 'Entity Type',
        dataIndex: ['eFrom', 'eType'],
        key: 'ft',
        render: (value: number) => typeTable[glang].entity[value],
      },
    ],
  },
  {
    title: 'Relation Type',
    dataIndex: 'rType',
    key: 'type',
    align: 'center',
    render: (value: number) => typeTable[glang].relation[value],
  },
  {
    title: 'To Entity',
    children: [
      {
        title: 'Code Name',
        dataIndex: ['eTo', 'name'],
        key: 'tn',
        render: (name: string, record: remote.relation) => {
          const fpath = inViewMode
            ? undefined
            : (gmap.find((i) => i.fid === record.toFid) as fid2Path).path;
          return (
            <Tooltip title={`${inViewMode ? '' : `In file:\n${fpath}`}\nQualified name: ${name}`}>
              <a
                onClick={() => {
                  if (!inViewMode) {
                    getApi.postMessage({
                      command: 'highlight-relation',
                      payload: {
                        fpath,
                        base: gfsPath,
                        from: record.eFrom.loc,
                        to: record.eTo.loc,
                      },
                    });
                  }
                }}
              >
                {langRelative[glang].displayCodeName(record.eTo)}
              </a>
            </Tooltip>
          );
        },
      },
      {
        title: 'Entity Type',
        dataIndex: ['eTo', 'eType'],
        key: 'tt',
        render: (value: number) => typeTable[glang].entity[value],
      },
    ],
  },
];

let gmutate: any;
let grefresh: any;
let glang: langTableIndex;
let gpid: number;
let gfsPath: string;
let gfid: number;
let gmap: Array<fid2Path>;
let inViewMode: boolean;

export const RelationViewer: React.FC = () => {
  const { pid: urlPid, fid: urlFid } = useParams();

  gpid = parseInt(urlPid as string, 10);
  gfid = parseInt(urlFid as string, 10);

  const {
    state: {
      project: {
        pid,
        lang,
        fsPath,
        map,
      } = {
        pid: undefined, lang: undefined, fsPath: undefined, map: undefined,
      },
      file: { path } = { path: undefined },
      viewProject: { pid: viewPid, lang: viewLang } = { pid: undefined, lang: undefined },
    } = {
      project: {
        pid: undefined, lang: undefined, fsPath: undefined, map: undefined,
      },
      file: { fid: undefined, path: undefined },
      viewProject: { pid: undefined, lang: undefined },
    },
  } = useContext(WorkingContext);

  const navigate = useNavigate();

  if (gpid !== viewPid) {
    notification.warn({
      message: 'Url direct jumping is not supported',
      description: 'Now redirecting you to the project page. Please go into project\'s details from this page.',
    });
    navigate('/project');
  }

  inViewMode = gpid !== pid;

  /** set some global variables to avoid pass them as function's params */
  glang = (lang || viewLang) as langTableIndex;
  gfsPath = fsPath as string;
  gmap = map as Array<fid2Path>;

  const {
    tableProps, pagination, mutate, refresh,
  } = useAntdTable(
    ({ current, pageSize }) => request(`GET project/${gpid}/file/${gfid}/relation?page=${current}&size=${pageSize}`)
      .then(({ relation, total }: remote.resRelations) => ({
        list: relation.map((r) => revealRelation({
          ...r,
          eFrom: revealEntity(r.eFrom),
          eTo: revealEntity(r.eTo),
        })),
        total,
      })),
    {
      defaultPageSize: 100,
    },
  );

  const {
    dataSource: data,
    loading,
  } = tableProps;

  const [expandRow, setExpandRow] = useState(-1);

  gmutate = (executable: any) => {
    setExpandRow(-1);
    mutate(executable);
  };

  grefresh = () => {
    setExpandRow(-1);
    refresh();
  };

  useEffect(() => {
    if (data) {
      getApi.postMessage({ command: 'open-file', payload: { fpath: path, mode: 'relation-from', base: fsPath } });
      getApi.postMessage({ command: 'change-layout', payload: 'relation' });
      /** this will clear decorations if user jump from entity to relation page */
      getApi.postMessage({ command: 'show-entity', payload: undefined });
      getApi.postMessage({ command: 'highlight-entity', payload: undefined });
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
        rowKey={(record) => record.rid}
        // @ts-ignore
        columns={columns}
        expandable={inViewMode ? undefined : {
          expandRowByClick: true,
          expandedRowKeys: [expandRow],
          rowExpandable: (record) => !record.status.hasBeenReviewed,
          expandIconColumnIndex: -1,
          expandedRowRender:
            (record: remote.relation) => RenderExpandedRow(record),
          // only one line can expand in a single time
          onExpandedRowsChange: (rows) => {
            if (rows.length === 0) {
              setExpandRow(-1);
              getApi.postMessage({
                command: 'highlight-relation',
                payload: undefined,
              });
            } else {
              const selectedKey = rows[rows.length - 1] as number;
              const selectedRecord = data.find((i) => i.rid === selectedKey);
              setExpandRow(selectedKey);
              getApi.postMessage({
                command: 'highlight-relation',
                payload: {
                  fpath: ((map as Array<fid2Path>)
                    .find((i) => i.fid === selectedRecord.toFid) as fid2Path).path,
                  base: fsPath,
                  from: selectedRecord.eFrom.loc,
                  to: selectedRecord.eTo.loc,
                },
              });
            }
          },

        }}
      />
      {inViewMode ? undefined : (
        <Tooltip
          title="Manually insert a relation"
          placement="left"
        >
          <Button
            style={{
              position: 'absolute', right: '2.5em', bottom: '2.5em', zIndex: 999,
            }}
            type="primary"
            shape="circle"
            size="large"
            onClick={() => { notification.warn({ message: 'Not support yet' }); }}
          >
            <PlusOutlined />
          </Button>
        </Tooltip>
      )}
    </>
  );
};
