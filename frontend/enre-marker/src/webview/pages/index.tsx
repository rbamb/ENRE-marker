import React, { useState, useEffect } from 'react';
import { 
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from 'react-router-dom';
import { UserManagement } from './login';
import { ProjectViewer } from './project/viewer';

export const App: React.FC = () => {
  const [url, setUrl] = useState('/');

  useEffect(() => {
    window.addEventListener('message', ({ data }) => {
      switch (data.type) {
        case 'continueUrl':
          setUrl(data.payload);
        break;
      }
    });
  });

  return (
    <Router>
      <ul>
        <li>
          <Link to='/'>User Management</Link>
        </li>
      </ul>

      <Switch>
        <Route path='/project'>
          <ProjectViewer />
        </Route>
        <Route path='/'>
          <UserManagement />
        </Route>
      </Switch>
    </Router>
  );
};
