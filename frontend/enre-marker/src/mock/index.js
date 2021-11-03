const express = require('express');
const server = express();
const port = 3000;

const Mock = require('mockjs');

server.post('/api/v1/user/login', (req, res) => {
  const data = Mock.mock({
    code: 200,
    message: 'success',
    token: /([a-z]|[A-Z]|[0-9]){256}/
  });
  
  res.send(JSON.stringify(data));
});

server.get('/api/v1/project', (req, res) => {
  const data = Mock.mock({
    code: 200,
    message: 'success',
    "project|1-10": [{
      "pid|100-150": 100,
      name: '@word',
    }]
  });

  res.send(JSON.stringify(data));
});

server.listen(port, () => {
  console.log(`Mock server started at http://localhost:${port}`);
});
