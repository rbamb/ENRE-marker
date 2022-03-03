import React from 'react';
import {
  Typography, Row, Col, Statistic, Collapse,
} from 'antd';

const { Title } = Typography;
const { Panel } = Collapse;

export const ProjectDashboard: React.FC<{ project: remote.project }> = ({
  project: {
    pid, name, version,
  },
}) => {
  console.log('aaa');
  return (
    <>
      <Row>
        <Col flex={2}>
          <Typography>
            <Title>
              {name}
              <h5>{`@${version}`}</h5>
            </Title>
          </Typography>
        </Col>
        <Col flex={1}>
          <Statistic
            title="Overall Progress"
            value={0}
            suffix="%"
          />
        </Col>
      </Row>
      <Collapse ghost>
        <Panel header="Entities" key={0}>
          aaa
        </Panel>
        <Panel header="Relations" key={1}>
          aaa
        </Panel>
      </Collapse>
    </>
  );
};
