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
} from 'antd';
import {
  CheckOutlined, CloseOutlined, EditOutlined, PlusOutlined,
} from '@ant-design/icons';
import React, { useContext, useState } from 'react';
import { useRequest, useEventListener } from 'ahooks';
import { request } from '../../compatible/httpAdapter';
import { WorkingContext } from '../../context';
import { langTableIndex, typeTable } from '../../.static/config';

const { Option } = Select;

// eslint-disable-next-line max-len
const ControlledRelationInfo: React.FC<{ lang: langTableIndex, eFrom?: remote.entity, eTo?: remote.entity, type?: number }> = ({
  lang, eFrom, eTo, type,
}) => {
  const [ef, setEf] = useState(eFrom);
  const [et, setEt] = useState(eTo);

  useEventListener('message', ({ data: { command, payload } }) => {
    if (command === 'selection-change') {
      // TODO:
    }
  });

  return (
    <>
      <Alert
        type="info"
        message="Place the cursor in the range of an entity's code name, and that entity's info will be synced to here."
      />
      <Space direction="vertical" style={{ width: '100%', marginTop: '1.2em' }}>
        <Radio.Group style={{ width: '100%' }}>
          <Radio.Button value="From Entity" style={{ width: '50%', textAlign: 'center' }}>From Entity</Radio.Button>
          <Radio.Button value="To Entity" style={{ width: '50%', textAlign: 'center' }}>To Entity</Radio.Button>
        </Radio.Group>
        <Space direction="horizontal" size="middle" align="start" style={{ width: '100%' }}>
          <Descriptions column={1}>
            <Descriptions.Item label="Code name">{ef ? <Typography.Text style={{ width: '80px' }} ellipsis={{ tooltip: ef.name }}>{ef.name}</Typography.Text> : '-'}</Descriptions.Item>
            <Descriptions.Item label="Starts at">{ef ? `line ${ef.loc.start.line}, column ${ef.loc.start.column}` : '-'}</Descriptions.Item>
            <Descriptions.Item label="Ends at">{ef ? `line ${ef.loc.end.line}, column ${ef.loc.end.column}` : '-'}</Descriptions.Item>
            <Descriptions.Item label="Type">{ef ? typeTable[lang].entity[ef.eType] : '-'}</Descriptions.Item>
          </Descriptions>
          <Descriptions column={1}>
            <Descriptions.Item label="Code name">{et ? <Typography.Text style={{ width: '80px' }} ellipsis={{ tooltip: et.name }}>{et.name}</Typography.Text> : '-'}</Descriptions.Item>
            <Descriptions.Item label="Starts at">{et ? `line ${et.loc.start.line}, column ${et.loc.start.column}` : '-'}</Descriptions.Item>
            <Descriptions.Item label="Ends at">{et ? `line ${et.loc.end.line}, column ${et.loc.end.column}` : '-'}</Descriptions.Item>
            <Descriptions.Item label="Type">{et ? typeTable[lang].entity[et.eType] : '-'}</Descriptions.Item>
          </Descriptions>
        </Space>
      </Space>
      <Divider />
      <Select
        showSearch
        placeholder="Relation Type"
        style={{ width: '100%' }}
        defaultValue={type}
      >
        {typeTable[lang].relation.map((t, i) => (
          <Option key={t} value={i}>
            {t}
          </Option>
        ))}
      </Select>
    </>
  );
};

const showModifyModal = (
  lang: langTableIndex,
  eFrom?: remote.entity,
  eTo?: remote.entity,
  type?: number,
) => {
  Modal.confirm({
    title: eFrom ? 'Modify to...' : 'Insert a relation...',
    icon: eFrom ? <EditOutlined /> : <PlusOutlined style={{ color: '#108ee9' }} />,
    content: <ControlledRelationInfo lang={lang} eFrom={eFrom} eTo={eTo} type={type} />,
  });
};

const RenderExpandedRow = ({ eFrom, eTo, rType }: remote.relation, lang: langTableIndex) => (
  <Card title={(
    <>
      <span>Operation to relation&nbsp;</span>
      <Typography.Text code>
        {eFrom.name}
      </Typography.Text>
      <span>
        {` --${typeTable[lang].relation[rType]}-> `}
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
        onClick={() => showModifyModal(lang, eFrom, eTo, rType)}
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
        render: (name: string) => <Button type="link" style={{ paddingLeft: 0 }}>{name}</Button>,
      },
      {
        title: 'Entity Type',
        dataIndex: ['eFrom', 'eType'],
        key: 'ft',
        render: (value: number) => typeTable[lang].entity[value],
      },
    ],
  },
  {
    title: 'Relation Type',
    dataIndex: 'rType',
    key: 'type',
    render: (value: number) => typeTable[lang].relation[value],
  },
  {
    title: 'To Entity',
    children: [
      {
        title: 'Code Name',
        dataIndex: ['eTo', 'name'],
        key: 'tn',
        render: (name: string) => <Button type="link" style={{ paddingLeft: 0 }}>{name}</Button>,
      },
      {
        title: 'Entity Type',
        dataIndex: ['eTo', 'eType'],
        key: 'tt',
        render: (value: number) => typeTable[lang].entity[value],
      },
    ],
  },
];

export const RelationViewer: React.FC = () => {
  const { state: { project: { pid, lang }, file: { fid } } } = useContext(WorkingContext);
  const { data, loading } = useRequest(() => request(`GET project/${pid}/file/${fid}/relation`).then(({ relation }: remote.resRelations) => relation));

  return (
    <>
      <Table
        loading={loading}
        dataSource={data}
        rowKey={(record) => record.rid}
        // @ts-ignore
        columns={columns(lang)}
        pagination={false}
        expandable={{
          expandRowByClick: true,
          rowExpandable: (record) => !record.status.hasBeenReviewed,
          expandIconColumnIndex: -1,
          expandedRowRender:
            (record: remote.relation) => RenderExpandedRow(record, lang as langTableIndex),
        }}
      />
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
          onClick={() => { showModifyModal(lang as langTableIndex); }}
        >
          <PlusOutlined />
        </Button>
      </Tooltip>
    </>
  );
};
