import React, { useState, useEffect } from 'react';
import { UserManagement } from '../login';

export const LaunchPad: React.FC = () => {
  const [page, setPage] = useState('');

  useEffect(() => {
    window.addEventListener('message', ({ data }) => {
      switch (data.type) {
        case 'switchPage':
          setPage(data.payload);
        break;
      }
    });
  });

  switch (page) {
    case 'login':
      return <UserManagement />;
    default:
      return <h1>No page declared</h1>;
  }
};
