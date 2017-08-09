/* eslint-env mocha */

var Headers = require('../../../lib/http/_common').Headers
var Fixtures = require('../../support/fixture').Fixtures
var fixtures = new Fixtures('http/_common', 'Headers')

describe('Unit', function () {
  describe('/http', function () {
    describe('/_common.js', function () {
      describe('.Headers', function () {
        fixtures.apply(Headers)
      })
    })
  })
})
