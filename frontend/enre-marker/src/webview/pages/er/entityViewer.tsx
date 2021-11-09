import { useEventListener, useRequest } from 'ahooks';
import {
  Table, Badge, Tooltip, Button, Card, Typography, Modal, Descriptions, Alert, Divider, Select,
} from 'antd';
import {
  CheckOutlined, CloseOutlined, EditOutlined,
} from '@ant-design/icons';
import React, { useContext, useState } from 'react';
import { request } from '../../compatible/httpAdapter';
import { WorkingContext } from '../../context';

const { Option } = Select;

const ControlledEntityInfo: React.FC<{
  name: string,
  loc: remote.location,
  type: string
}> = ({ name, loc, type }) => {
  // TODO: consume type
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
        <Descriptions.Item label="Code name">{trackedName}</Descriptions.Item>
        <Descriptions.Item label="Starts at">{`line ${trackedLoc.start.line}, column ${trackedLoc.start.column}`}</Descriptions.Item>
        <Descriptions.Item label="Ends at">{`line ${trackedLoc.end.line}, column ${trackedLoc.end.column}`}</Descriptions.Item>
      </Descriptions>
      <Divider />
      <Select
        showSearch
        placeholder="Entity Type"
        style={{ width: '100%' }}
      >
        <Option value="1">
          map types to option
        </Option>
      </Select>
    </>
  );
};

const RenderExpandedRow = ({ name, loc, type }: remote.entity) => {
  const showModifyModal = () => {
    Modal.confirm({
      title: 'Modify to...',
      icon: <EditOutlined />,
      content: <ControlledEntityInfo name={name} loc={loc} type={type} />,
    });
  };

  return (
    <Card title={(
      <>
        <span>Operation to entity </span>
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
          onClick={showModifyModal}
        >
          Modify
        </Button>
      </Card.Grid>
    </Card>
  );
};

const columns = [
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
          default:
            return <Badge />;
        }
      }

      return (
        <Tooltip title="Waiting for review">
          <Badge status="processing" />
        </Tooltip>
      );
    },
  },
  {
    title: 'Code Name',
    dataIndex: 'name',
    key: 'name',
    render: (name: string) => <Button type="link">{name}</Button>,
  },
  {
    title: 'Entity Type',
    dataIndex: 'type',
    key: 'type',
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

export const EntityViewer: React.FC = () => {
  // @ts-ignore
  const { state: { project: { pid }, file: { fid } } } = useContext(WorkingContext);
  const { data, loading } = useRequest(() => request(`GET project/${pid}/file/${fid}/entity`).then(({ entity }: remote.resEntities) => entity));

  return (
    <Table
      loading={loading}
      dataSource={data}
      rowKey={(record) => record.eid}
      // @ts-ignore
      columns={columns}
      pagination={false}
      expandable={{
        expandRowByClick: true,
        rowExpandable: (record) => !record.status.hasBeenReviewed,
        expandIconColumnIndex: -1,
        expandedRowRender: RenderExpandedRow,
      }}
    />
  );
};
