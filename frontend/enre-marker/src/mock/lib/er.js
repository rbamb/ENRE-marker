const Mock = require('mockjs');
const { sha256 } = require('./common.js');

module.exports = {
  'GET project/:pid/file/:fid/entity': (req, res) => {
    res.json(Mock.mock({
      code: 200,
      message: 'success',
      'entity|1-10': [{
        'eid|+1': 0,
        name: 'var name',
        loc: {
          start: {
            line: 1,
            column: 2
          },
          end: {
            line: 1,
            column: 5
          }
        },
        type: 'variable',
        status: {
          'hasBeenReviewed|1': true,
          'operation|0-2': 0,
          'newEntity': {
            name: 'newName',
            loc: {
              start: {
                line: 1,
                column: 2
              },
              end: {
                line: 1,
                column: 6
              }
            },
            type: 'function'
          }
        }
      }]
    }));
  },

  'GET project/:pid/file/:fid/relation': (req, res) => {
    res.json(Mock.mock({
      code: 200,
      message: 'success',
      'relation|1-10': [{
        'rid|+1': 0,
        from: {
          'eid|+1': 0,
          name: 'var name from',
          loc: {
            start: {
              line: 1,
              column: 2
            },
            end: {
              line: 1,
              column: 5
            }
          },
          type: 'variable',
          'isManually|1': true,
          status: {
            'hasBeenReviewed|1': true,
            'operation|0-2': 0,
            'newEntity': {
              name: 'newName',
              loc: {
                start: {
                  line: 1,
                  column: 2
                },
                end: {
                  line: 1,
                  column: 6
                }
              },
              type: 'function'
            }
          }
        },
        to: {
          'eid|+1': 0,
          name: 'var name to',
          loc: {
            start: {
              line: 1,
              column: 2
            },
            end: {
              line: 1,
              column: 5
            }
          },
          type: 'variable',
          'isManually|1': true,
          status: {
            'hasBeenReviewed|1': true,
            'operation|0-2': 0,
            'newEntity': {
              name: 'newName',
              loc: {
                start: {
                  line: 2,
                  column: 2
                },
                end: {
                  line: 2,
                  column: 6
                }
              },
              type: 'function'
            }
          }
        },
        'toFid|1-100': 0,
        'type': 'use',
        'isManually|1': true,
        status: {
          'hasBeenReviewed|1': true,
          'operation|0-2': 0,
          'newRelation': {
            from: {},
            to: {},
            type: 'call'
          }
        }
      }]
    }));
  },

  'POST project/:pid/file/:fid/entity': (req, res) => {
    res.json(Mock.mock({
      code: 200,
      message: 'success',
      token: sha256
    }));
  },

  'POST project/:pif/file/:fid/relation': (req, res) => {
    res.json(Mock.mock({
      code: 200,
      message: 'success',
      token: sha256
    }));
  }
}
