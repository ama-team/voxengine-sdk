/* eslint-env mocha */

var Query = require('../../../../lib/http/_common').Query
var Fixtures = require('../../../support/fixture').Fixtures
var fixtures = new Fixtures('http/_common', 'Query')

describe('Unit', function () {
  describe('/http', function () {
    describe('/_common.js', function () {
      describe('.Query', function () {
        fixtures.apply(Query)
      })
    })
  })
})
