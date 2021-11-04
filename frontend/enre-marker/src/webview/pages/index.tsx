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
      <Link to='/project'>To Project</Link>
      <Link to='/'>To Account</Link>

      <Switch>
        <Route path='/' exact>
          <UserManagement />
        </Route>
        <Route path='/project' exact>
          <ProjectViewer />
        </Route>
      </Switch>
    </Router>
  );
};
