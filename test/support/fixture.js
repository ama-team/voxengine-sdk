/* global allure */
/* eslint-env mocha */

var Path = require('path')
var FileSystem = require('fs')
var Yaml = require('js-yaml')
var Chai = require('chai')
var expect = Chai.expect

var root = Path.join(__dirname, '..')
var sources = Path.join(root, 'fixture')

function Fixture (method, definition) {
  this.apply = function (factory) {
    for (var i = 0; i < definition.length; i++) {
      var suite = definition[i]
      for (var j = 0; j < suite.tests.length; j++) {
        (function (suite, j) {
          var replacements = {index: j}
          var statement = suite.name || 'complies to assertion {index}'
          for (var key in replacements) {
            statement = statement.replace('{' + key + '}', replacements[key])
          }
          var test = suite.tests[j]
          it(statement, function () {
            var input = test.input
            var output = test.output
            for (var k = 0; k < input.length; k++) {
              allure.addArgument(k.toString(), JSON.stringify(input[k]))
            }
            var expectation = Yaml.safeDump(output || null)
            var name = 'expectation.yml'
            allure.createAttachment(name, expectation, 'application/x-yaml')
            var object = factory.call ? factory.call() : factory
            expect(object[method].apply(factory, input)).to.deep.eq(output)
          })
        })(suite, j)
      }
    }
  }
}

function Fixtures (source, feature) {
  var location = Path.join(sources, source, feature + '.yml')
  var content = FileSystem.readFileSync(location)
  var definitions = Yaml.safeLoad(content)
  var self = this

  Object.keys(definitions).forEach(function (method) {
    self[method] = new Fixture(method, definitions[method])
  })

  this.apply = function (object) {
    Object.keys(definitions).forEach(function (method) {
      describe('.' + method, function () {
        self[method].apply(object)
      })
    })
  }
}

module.exports = {
  Fixtures: Fixtures
}
