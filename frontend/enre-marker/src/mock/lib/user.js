const Mock = require('mockjs');
const { sha256 } = require('./common.js');

module.exports = {
  'POST user/login': (req, res) => {
    res.json(Mock.mock({
      code: 200,
      message: 'success',
      token: sha256,
      name: 'ThisRabbit'
    }));
  },

  'POST user/password': (req, res) => {
    res.json({
      code: 200,
      message: 'success',
    })
  }
}
