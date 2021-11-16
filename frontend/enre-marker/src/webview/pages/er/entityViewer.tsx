import { useEventListener, useRequest } from 'ahooks';
import {
  Table,
  Badge,
  Tooltip,
  Button,
  Card,
  Typography,
  Modal,
  Descriptions,
  Alert,
  Divider,
  Select,
  message,
} from 'antd';
import {
  CheckOutlined, CloseOutlined, EditOutlined, PlusOutlined,
} from '@ant-design/icons';
import React, { useContext, useEffect, useState } from 'react';
import { request } from '../../compatible/httpAdapter';
import { WorkingContext } from '../../context';
import { langTableIndex, typeTable } from '../../.static/config';
import { getApi } from '../../compatible/apiAdapter';

const { Option } = Select;

/** disable this rule since it will wrongly indent the return body */
// eslint-disable-next-line max-len
const ControlledEntityInfo: React.FC<{ lang: langTableIndex, name?: string, loc?: remote.location, type?: number }> = ({
  lang, name, loc, type,
}) => {
  const [trackedName, setName] = useState(name);
  const [trackedLoc, setLoc] = useState(loc);

  useEventListener('message', ({ data: { command, payload } }) => {
    if (command === 'selection-change') {
      setName(payload.name);
      setLoc(payload.loc);
    }
  });

  return (
    <>
      <Alert
        type="info"
        message="Select new range of the wanted entity name directly in the code editor left, and infos will be synced to here."
      />
      <Descriptions column={1} style={{ marginTop: '1em' }}>
        <Descriptions.Item label="Code name">{trackedName || '-'}</Descriptions.Item>
        <Descriptions.Item label="Starts at">{trackedLoc ? `line ${trackedLoc?.start.line}, column ${trackedLoc?.start.column}` : '-'}</Descriptions.Item>
        <Descriptions.Item label="Ends at">{trackedLoc ? `line ${trackedLoc?.end.line}, column ${trackedLoc?.end.column}` : '-'}</Descriptions.Item>
      </Descriptions>
      <Divider />
      <Select
        showSearch
        placeholder="Entity Type"
        style={{ width: '100%' }}
        defaultValue={type}
      >
        {typeTable[lang].entity.map((t, i) => (
          <Option key={t} value={i}>
            {t}
          </Option>
        ))}
      </Select>
    </>
  );
};

const showModifyModal = (
  pid: number,
  fid: number,
  lang: langTableIndex,
  name?: string,
  loc?: remote.location,
  type?: number,
) => {
  Modal.confirm({
    title: name ? 'Modify to...' : 'Insert an entity...',
    icon: name ? <EditOutlined /> : <PlusOutlined style={{ color: '#108ee9' }} />,
    content: <ControlledEntityInfo lang={lang} name={name} loc={loc} type={type} />,
  });
};

let lock: boolean = false;

const handleOperationClicked = (
  pid: number,
  fid: number,
  type: string,
  eid?: number,
  entity?: remote.manuallyEntity,
) => {
  if (!lock) {
    lock = true;
    message.loading({
      content: 'Uploading to the server',
      duration: 0,
      key: 'operation',
    });
    switch (type) {
      case 'pass':
        request(`POST project/${pid}/file/${fid}/entity`, {
          data: [
            { isManually: false, eid, isCorrect: true },
          ],
        }).then(() => {
          message.success({
            content: 'Mark succeeded',
            key: 'operation',
          });
          lock = false;
          refreshF();
        }).catch((json) => {
          message.error({
            content: json.message,
            key: 'operation',
          });
          lock = false;
        });
        break;
      case 'remove':
        request(`POST project/${pid}/file/${fid}/entity`, {
          data: [
            {
              isManually: false, eid, isCorrect: false, fix: { shouldBe: 1 },
            },
          ],
        }).then(() => {
          message.success({
            content: 'Mark succeeded',
            key: 'operation',
          });
          lock = false;
          refreshF();
        }).catch((json) => {
          message.error({
            content: json.message,
            key: 'operation',
          });
          lock = false;
        });
        break;
      case 'modify':
        request(`POST project/${pid}/file/${fid}/entity`, {
          data: [
            {
              isManually: false,
              eid,
              isCorrect: false,
              fix: {
                shouldBe: 2,
                newly: entity,
              },
            },
          ],
        }).then(() => {
          message.success({
            content: 'Mark succeeded',
            key: 'operation',
          });
          lock = false;
          refreshF();
        }).catch((json) => {
          message.error({
            content: json.message,
            key: 'operation',
          });
          lock = false;
        });
        break;
      case 'insert':
        request(`POST project/${pid}/file/${fid}/entity`, {
          data: [
            {
              isManually: true,
              entity,
            },
          ],
        }).then(() => {
          message.success({
            content: 'Mark succeeded',
            key: 'operation',
          });
          lock = false;
          refreshF();
        }).catch((json) => {
          message.error({
            content: json.message,
            key: 'operation',
          });
          lock = false;
        });
        break;
      default:
        message.error({
          content: 'Unknown operation type',
          key: 'operation',
        });
        lock = false;
    }
  }
};

const RenderExpandedRow = ({
  eid, name, loc, eType,
}: remote.entity, lang: langTableIndex, pid: number, fid: number) => (
  <Card title={(
    <>
      <span>Operation to entity&nbsp;</span>
      <Typography.Text code>{name}</Typography.Text>
    </>
  )}
  >
    <Card.Grid style={{ padding: 0 }}>
      <Button
        type="link"
        icon={<CheckOutlined />}
        style={{ height: '72px', color: 'green' }}
        block
        onClick={() => handleOperationClicked(pid, fid, 'pass', eid)}
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
        onClick={() => handleOperationClicked(pid, fid, 'remove', eid)}
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
        onClick={() => showModifyModal(pid, fid, lang, name, loc, eType)}
      >
        Modify
      </Button>
    </Card.Grid>
  </Card>
);

const columns = (lang: langTableIndex) => [
  {
    title: 'Status',
    align: 'center',
    render: (_: undefined, record: remote.entity) => {
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
            return 'COLOR';
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
    title: 'Code Name',
    dataIndex: 'name',
    key: 'name',
    render: (name: string) => <Button type="link" style={{ paddingLeft: 0 }}>{name}</Button>,
  },
  {
    title: 'Entity Type',
    dataIndex: 'eType',
    key: 'type',
    render: (value: number) => typeTable[lang].entity[value],
  },
  {
    title: 'Location',
    children: [
      {
        title: 'Start',
        children: [
          {
            title: 'Line',
            dataIndex: ['loc', 'start', 'line'],
            key: 'sl',
            align: 'center',
          },
          {
            title: 'Column',
            dataIndex: ['loc', 'start', 'column'],
            key: 'sc',
            align: 'center',
          },
        ],
      },
      {
        title: 'End',
        children: [
          {
            title: 'Line',
            dataIndex: ['loc', 'end', 'line'],
            key: 'el',
            align: 'center',
          },
          {
            title: 'Column',
            dataIndex: ['loc', 'end', 'column'],
            key: 'ec',
            align: 'center',
          },
        ],
      },
    ],
  },
];

let refreshF: any;

export const EntityViewer: React.FC = () => {
  const {
    state: {
      project: {
        pid,
        lang,
        fsPath,
      },
      file: { fid, path },
    },
  } = useContext(WorkingContext);

  const { data, loading, refresh } = useRequest(
    () => request(`GET project/${pid}/file/${fid}/entity`).then(({ entity }: remote.resEntities) => entity),
  );

  refreshF = refresh;

  useEffect(() => {
    if (data) {
      // in case directly go to this page by click the navbar
      getApi.postMessage({ command: 'open-file', payload: { fpath: path, mode: 'entity', base: fsPath } });
      getApi.postMessage({ command: 'show-entity', payload: data });
    }
  }, [loading]);

  return (
    <>
      <Table
        loading={loading}
        dataSource={data}
        rowKey={(record) => record.eid}
        // @ts-ignore
        columns={columns(lang, pid, fid)}
        pagination={false}
        expandable={{
          expandRowByClick: true,
          rowExpandable: (record) => !record.status.hasBeenReviewed,
          expandIconColumnIndex: -1,
          expandedRowRender: (entity) => RenderExpandedRow(
            entity,
            lang as langTableIndex,
            pid,
            fid,
          ),
        }}
      />
      <Tooltip
        title="Manually insert an entity"
        placement="left"
      >
        <Button
          style={{
            position: 'absolute', right: '2.5em', bottom: '2.5em', zIndex: 999,
          }}
          type="primary"
          shape="circle"
          size="large"
          onClick={() => showModifyModal(pid, fid, lang as langTableIndex)}
        >
          <PlusOutlined />
        </Button>
      </Tooltip>
    </>
  );
};
