import React, { useContext } from 'react';
import { WorkingContext } from '../context';

export const ViewHelper: React.FC = () => {
  const {
    state: {
      viewProject: {
        name, version, lang, file, mode,
      },
    },
  } = useContext(WorkingContext);

  return (
    <div style={{
      position: 'absolute', right: '2.5em', bottom: '2.5em', zIndex: 999,
    }}
    >
      aaa
    </div>
  );
};
