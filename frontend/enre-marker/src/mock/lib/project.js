const Mock = require('mockjs');
const { sha256 } = require('./common.js');

module.exports = {
  'GET project': (req, res) => {
    res.json(Mock.mock({
      code: 200,
      message: 'success',
      "project|1-10": [{
        "pid|+1": 100,
        githubUrl: 'xxx/yyy',
        name: '@word',
        version: /([a-z]|[0-9]){7}/,
        "lang|+1": ['js', 'java', 'cpp', 'go', 'python'],
        'progress|0-100': 0,
        'claimed|1': true,
        'state|0-1': 0,
      }]
    }));
  },

  'POST project/:pid/claim': (req, res) => {
    console.log(`Getting url param pid = ${req.params.pid}`)

    res.json(Mock.mock({
      code: 200,
      message: 'success',
      'collaborator|1-10': [{
        'uid|1-100': 1,
        name: '@name',
      }]
    }))
  },

  'GET project/:pid': (req, res) => {
    console.log(`Getting url param pid = ${req.params.pid}`)

    res.json(Mock.mock({
      code: 200,
      message: 'success',
      'file|1-10': [{
        'fid|+1': 0,
        path: '/some/path/to/a.js',
        entity: {
          'count|0-200': 0,
          'progress|0-100': 0
        },
        relation: {
          'count|0-200': 0,
          'progress|0-100': 0
        },
      }],
    }))
  }
}
