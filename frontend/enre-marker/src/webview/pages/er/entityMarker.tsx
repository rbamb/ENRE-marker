import { Button } from 'antd';
import React, { useState } from 'react';

export const EntityMarker: React.FC<{ data?: Array<remote.entity> }> = ({ data }) => {
  const [index, setIndex] = useState(0);

  return (
    <div>
      <div>
        entity infos
      </div>
      <div>
        operation
      </div>
      <div>
        keyboard shourtcut
      </div>
    </div>
  );
};
