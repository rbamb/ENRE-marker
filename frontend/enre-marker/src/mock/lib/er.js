const Mock = require('mockjs');
const { sha256 } = require('./common.js');

module.exports = {
  'GET project/:pid/file/:fid/entity': (req, res) => {
    res.json(Mock.mock({
      code: 200,
      message: 'success',
      'total|100-5000': 100,
      'entity|100': [{
        'eid|+1': 0,
        name: 'var name',
        loc: {
          start: {
            'line|+1': 1,
            'column|2-5': 2
          },
          end: {
            'line|+1': 1,
            'column|6-9': 6
          }
        },
        eType: 0,
        status: {
          'hasBeenReviewed|1': true,
          'operation|0-3': 0,
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
            eType: 1
          }
        }
      }]
    }));
  },

  'GET project/:pid/file/:fid/relation': (req, res) => {
    res.json(Mock.mock({
      code: 200,
      message: 'success',
      'total|100-5000': 100,
      'relation|100': [{
        'rid|+1': 0,
        eFrom: {
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
          eType: 0,
          'isManually|1': true,
          status: {
            'hasBeenReviewed|1': true,
            'operation|0-3': 0,
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
              eType: 1
            }
          }
        },
        eTo: {
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
          eType: 1,
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
              eType: 1,
            }
          }
        },
        'toFid|1-100': 0,
        'rType': 0,
        'isManually|1': true,
        status: {
          'hasBeenReviewed|1': true,
          'operation|0-2': 0,
          'newRelation': {
            eFrom: {},
            eTo: {},
            rType: 1,
          }
        }
      }]
    }));
  },

  'POST project/:pid/file/:fid/entity': (req, res) => {
    res.json(Mock.mock({
      code: 200,
      message: 'success',
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
