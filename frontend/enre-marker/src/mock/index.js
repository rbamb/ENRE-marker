const express = require('express');
const server = express();
const port = 3000;
const cors = require('cors');

const Mock = require('mockjs');

server.use(cors({ origin: '*' }));

const sha256 = /([a-z]|[A-Z]|[0-9]){256}/;

server.post('/api/v1/user/login', (req, res) => {
  res.json(Mock.mock({
    code: 200,
    message: 'success',
    token: sha256
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

server.post('/api/v1/project/:pid/claim', (req, res) => {
  console.log(`Getting url param pid = ${req.params.pid}`)

  res.json(Mock.mock({
    code: 200,
    message: 'success',
    dir: '/',
    'fileHash|1-10': [{
      'fid|+1': 0,
      path: '/some/path/to/a.js',
      hash: sha256
    }],
    hash: sha256
  }))
});

server.listen(port, () => {
  console.log(`Mock server started at http://localhost:${port}`);
});
