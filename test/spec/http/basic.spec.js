/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

var chai = require('chai')
var expect = chai.expect
var assert = chai.assert
var sinon = require('sinon')
var Clients = require('../../../lib/http')
var Method = Clients.Method
var Client = Clients.basic.Client

chai.use(require('chai-as-promised'))

function branchStopper () {
  assert(false, 'This branch should have never been executed')
}

describe('Unit', function () {
  describe('/http', function () {
    describe('/basic.js', function () {
      var transportFactory = function (responses) {
        if (arguments.length === 0) {
          throw new Error('Not enough arguments')
        }
        responses = Array.prototype.slice.call(arguments, 0)
        var index = 0
          // poor man's onCall
        return sinon.spy(function () {
          index = index % responses.length
          return Promise.resolve(responses[index++])
        })
      }
      var clientFactory = function (transport, options) {
        return new Client(options || {}, transport)
      }

      it('correctly executes request', function () {
        return clientFactory(transportFactory({code: 200, headers: [], text: '{}'}))
          .request(Method.Get, '/test')
          .then(function (response) {
            expect(response.code).to.eq(200)
            expect(response.headers).to.deep.eq({})
            expect(response.payload).to.eq('{}')
          })
      })

      it('correctly merges and overwrites headers', function () {
        var options = {headers: {overwritten: ['a', 'b'], kept: ['c', 'd']}, methodOverrideHeader: 'X-HMO'}
        var overrides = {introduced: ['e', 'f'], overwritten: ['g']}
        var expectation = [
          'introduced: e',
          'introduced: f',
          'overwritten: g',
          'kept: c',
          'kept: d'
        ]
        var transport = transportFactory({code: 200, headers: [], text: '{}'})
        return clientFactory(transport, options)
          .request(Method.Get, '/test', [], null, overrides)
          .then(function () {
            var headers = transport.getCall(0).args[1].headers
            expect(headers.sort()).to.deep.eq(expectation.sort())
          })
      })

      var methods = ['get', 'head']
      methods.forEach(function (method) {
        it('provides ' + method + ' request method', function () {
          var transport = transportFactory({code: 200, headers: [], text: '{}'})
          var client = clientFactory(transport, {methodOverrideHeader: 'X-HMO'})
          return client[method]('/test', {alpha: 'beta'}, {'X-Gamma': 'delta'})
            .then(function () {
              var call = transport.getCall(0)
              expect(call.args[1].headers).to.contain('X-Gamma: delta')
              expect(call.args[1].postData).to.be.not.ok
              expect(call.args[0]).to.eq('/test?alpha=beta')
            })
        })
      })

      methods = ['post', 'put', 'patch', 'delete']
      methods.forEach(function (method) {
        it('should provide ' + method + ' request method', function () {
          var transport = transportFactory({code: 200, headers: [], text: '{}'})
          var client = clientFactory(transport, {methodOverrideHeader: 'X-HMO'})
          var payload = '{"alpha": "beta"}'
          return client[method]('/test', payload, {'X-Gamma': 'delta'})
            .then(function () {
              var call = transport.getCall(0)
              expect(call.args[1].headers).to.contain('X-Gamma: delta')
              expect(call.args[1].postData).to.eq(payload)
              expect(call.args[0]).to.eq('/test')
            })
        })
      })

      var errorTypes = {
        NetworkError: {
          code: -1,
          exception: Clients.NetworkException
        },
        ServerError: {
          code: 500,
          exception: Clients.ServerErrorException
        },
        ClientError: {
          code: 400,
          exception: Clients.ClientErrorException
        },
        NotFound: {
          code: 404,
          exception: Clients.NotFoundException
        }
      }

      Object.keys(errorTypes).forEach(function (errorType) {
        var error = errorTypes[errorType]
        it('retries on ' + errorType + ' error if told so', function () {
          var transport = transportFactory({code: error.code}, {code: 200})
          var opts = {}
          var client

          opts['retryOn' + errorType] = true
          client = clientFactory(transport, opts)

          return client
            .get('/test')
            .then(function (response) {
              expect(response.code).to.eq(200)
              expect(transport.callCount).to.eq(2)
            })
        })

        it('does not retry on ' + errorType + ' error unless told so', function () {
          var transport = transportFactory({code: error.code}, {code: 200})
          var opts = {}
          var client

          opts['retryOn' + errorType] = false
          opts['throwOn' + errorType] = true
          client = clientFactory(transport, opts)

          return client
            .get('/test')
            .then(branchStopper, function (e) {
              expect(e).to.be.instanceOf(error.exception)
              expect(transport.callCount).to.eq(1)
            })
        })

        if (errorType === 'NetworkError') {
          return
        }

        it('should not throw on ' + errorType + ' error if told so', function () {
          var transport = transportFactory({code: error.code})
          var opts = {}
          var client

          opts['retryOn' + errorType] = false
          opts['throwOn' + errorType] = false
          client = clientFactory(transport, opts)

          return client
            .get('/test')
            .then(function (response) {
              expect(response.code).eq(error.code)
              expect(transport.callCount).to.eq(1)
            })
        })
      })

      it('should retry not more times than specified in settings', function () {
        var transport = transportFactory({code: 500})
        var options = {
          retries: 4,
          throwOnServerError: false,
          retryOnServerError: true
        }
        var client = clientFactory(transport, options)

        return client
          .get('/test')
          .then(function (response) {
            expect(response.code).to.eq(500)
            expect(transport.callCount).to.eq(5)
          })
      })

      it('correctly handles response with unknown code', function () {
        var transport = transportFactory({code: -500})
        var client = clientFactory(transport, {retryOnNetworkError: false})

        return client.get('/test').then(branchStopper, function (error) {
          expect(error).to.be.instanceOf(Clients.NetworkException)
          expect(error.code).to.eq(-500)
        })
      })

      it('should correctly handle response with no code', function () {
        var transport = transportFactory({})
        var client = clientFactory(transport, {retryOnNetworkError: false})

        return client
          .get('/test')
          .then(branchStopper, function (error) {
            expect(error).to.be.instanceOf(Clients.NetworkException)
            expect(error.code).to.eq(-1)
          })
      })

      it('does not let execute non-get/post request without method override header', function () {
        var transport = transportFactory({})
        var client = clientFactory(transport)

        return client.put('/test').then(branchStopper, function (error) {
          expect(error).to.be.instanceOf(Clients.InvalidConfigurationException)
          expect(transport.callCount).to.eq(0)
        })
      })

      it('adds method override header for non-get/post request', function () {
        var transport = transportFactory({code: 200})
        var client = clientFactory(transport, {methodOverrideHeader: 'X-HMO'})

        return client.put('/test').then(function () {
          expect(transport.getCall(0).args[1].headers).to.deep.eq(['X-HMO: PUT'])
        })
      })
    })
  })
})
