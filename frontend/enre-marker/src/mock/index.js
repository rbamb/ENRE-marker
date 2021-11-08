const express = require('express');
const server = express();
const port = 3000;
const cors = require('cors');

const Mock = require('mockjs');

server.use(cors({ origin: '*' }));

const api_0 = require('./lib/user.js');
const api_1 = require('./lib/project.js');
const api_2 = require('./lib/er.js');

const apis = { ...api_0, ...api_1, ...api_2 };

Object.keys(apis).forEach(key => {
  const seg = key.split(' ');

  server[seg[0].toLowerCase()](`/api/v1/${seg[1]}`, (req, res) => {
    setTimeout(() => {
      apis[key](req, res);
    }, seg.length !== 3 ? 0 : seg[2]);
  })
})

server.listen(port, () => {
  console.log(`Mock server started at http://localhost:${port}`);
});
