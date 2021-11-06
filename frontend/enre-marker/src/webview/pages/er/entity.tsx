import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { EntityMarker } from './entityMarker';
import { EntityViewer } from './entityViewer';

export const Entity: React.FC = () => {
  const [searchParams] = useSearchParams();
  const action = searchParams.get('action');

  if (action === 'mark') {
    return <EntityMarker />;
  }
  return <EntityViewer />;
};
