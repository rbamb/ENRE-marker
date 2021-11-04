const express = require('express');
const server = express();
const port = 3000;
const cors = require('cors');

const Mock = require('mockjs');

server.use(cors({ origin: '*' }));

server.post('/api/v1/user/login', (req, res) => {
  res.json(Mock.mock({
    code: 200,
    message: 'success',
    token: /([a-z]|[A-Z]|[0-9]){256}/
  }));
});

server.get('/api/v1/project', (req, res) => {
  res.json(Mock.mock({
    code: 200,
    message: 'success',
    "project|1-10": [{
      "pid|+1": 100,
      name: '@word',
      version: /([a-z]|[0-9]){7}/,
      "lang|+1": ['js', 'java', 'cpp', 'golang', 'python'],
      'progress|0-100': 0,
      'claimed|1': true
    }]
  }));
});

server.listen(port, () => {
  console.log(`Mock server started at http://localhost:${port}`);
});
