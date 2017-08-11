/* eslint-env mocha */

var Commons = require('../../../../lib/logger/_common')
var Fixtures = require('../../../support/fixture').Fixtures
var fixtures = new Fixtures('logger', '_common')

describe('Unit', function () {
  describe('/logger', function () {
    describe('/_common.js', function () {
      fixtures.apply(Commons)
    })
  })
})
