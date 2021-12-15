import { FileTextOutlined, Loading3QuartersOutlined, NodeIndexOutlined } from '@ant-design/icons';
import {
  Menu, notification, Tag, Typography,
} from 'antd';
import React, { useContext } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { langTable } from '../../.static/config';
import { WorkingContext } from '../../context';
import { getShortFileName } from '../../utils/getShortFileName';

export const ViewHelper: React.FC = () => {
  const { pid: urlPid, fid: urlFid } = useParams();

  const {
    state: {
      viewProject: {
        name, version, lang, file, mode,
      },
    },
    dispatcher,
  } = useContext(WorkingContext);

  let selectedKey: 'view-file' | 'view-entity' | 'view-relation';
  if (urlFid === undefined) {
    selectedKey = 'view-file';
  } else if (mode === 'entity') {
    selectedKey = 'view-entity';
  } else {
    selectedKey = 'view-relation';
  }

  return (
    <div
      style={{
        width: '50%',
        minWidth: '500px',
        maxWidth: '600px',
        height: '5.1em',
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: '1em',
        margin: 'auto',
        zIndex: 999,
        backgroundColor: 'rgba(250,250,250,.5)',
        borderRadius: '2.5em',
        padding: '0.2em 3em',
        backdropFilter: 'saturate(180%) blur(20px)',
        // fix previous property in browser preview env at safari
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        border: '1px solid #f0f0f0',
      }}
    >
      <Typography.Text
        style={{
          marginBottom: 0,
          textAlign: 'center',
          width: '100%',
        }}
        ellipsis
      >
        Viewing&nbsp;
        <Tag color={langTable[lang].color} style={{ marginRight: 0 }}>
          {langTable[lang].text}
        </Tag>
        &nbsp;project&nbsp;
        {`${name} #${version}`}
        {urlFid !== undefined ? ` in file ${getShortFileName(file, false)}` : undefined}
      </Typography.Text>
      <Menu
        mode="horizontal"
        style={{
          backgroundColor: 'rgba(0,0,0,0)',
          borderBottom: 0,
          justifyContent: 'center',
        }}
        selectedKeys={[selectedKey]}
        onClick={({ key }) => {
          switch (key) {
            case 'view-file':
              dispatcher({ payload: { viewProject: { file: undefined, mode: undefined } } });
              break;
            case 'view-entity':
              dispatcher({ payload: { viewProject: { mode: 'entity' } } });
              break;
            case 'view-relation':
              dispatcher({ payload: { viewProject: { mode: 'relation' } } });
              break;
            default:
              notification.error({ message: `Unknown menu key ${key}` });
          }
        }}
      >
        <Menu.Item
          style={{ padding: '0 24px' }}
          key="view-file"
          icon={<FileTextOutlined />}
          tabIndex={0}
        >
          <NavLink to={`/project/${urlPid}/file`}>
            Files
          </NavLink>
        </Menu.Item>
        <Menu.Item
          style={{ padding: '0 24px' }}
          key="view-entity"
          icon={<Loading3QuartersOutlined />}
          tabIndex={0}
          disabled={urlFid === undefined}
        >
          <NavLink to={`/project/${urlPid}/file/${urlFid}/entity`}>
            Entities
          </NavLink>
        </Menu.Item>
        <Menu.Item
          style={{ padding: '0 24px' }}
          key="view-relation"
          icon={<NodeIndexOutlined />}
          tabIndex={0}
          disabled={urlFid === undefined}
        >
          <NavLink to={`/project/${urlPid}/file/${urlFid}/relation`}>
            Relations
          </NavLink>
        </Menu.Item>
      </Menu>
    </div>
  );
};
