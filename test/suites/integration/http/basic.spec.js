/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
/* global transportFactory */

var chai = require('chai')
var expect = chai.expect
var Clients = require('../../../../lib/http')
var Method = Clients.Method
var Client = Clients.Basic
var Loggers = require('../../../../lib/logger')

chai.use(require('chai-as-promised'))

function branchStopper () {
  chai.assert(false, 'This branch should have never been executed')
}

describe('Integration', function () {
  describe('/http', function () {
    describe('/basic.js', function () {
      describe('.Client', function () {
        var clientFactory = function (transport, options) {
          options = options || {}
          options.logger = {level: Loggers.Level.Trace}
          return new Client(options, transport)
        }

        var transport
        var client
        var BASE_URL = 'http://localhost'

        beforeEach(function () {
          transport = transportFactory({code: 200, headers: [], text: '{}'})
          client = clientFactory(transport, {url: BASE_URL})
        })

        describe('#request', function () {
          it('concatenates base url with provided url', function () {
            var path = '/search'
            return client
              .request(Method.Get, path)
              .then(function () {
                expect(transport.getCall(0).args[0]).to.eq(BASE_URL + path)
              })
          })

          it('refuses falsey method', function () {
            return client
              .request(null, '/')
              .then(branchStopper, function (error) {
                var ExceptionClass = Clients.InvalidConfigurationException
                expect(error).to.be.instanceOf(ExceptionClass)
              })
          })

          it('ignores falsey path', function () {
            return client
              .request(Method.Get)
              .then(function () {
                expect(transport.getCall(0).args[0]).to.eq(BASE_URL)
              })
          })

          it('encodes and passes provided headers', function () {
            var headers = {
              Cookie: ['a=b', 'c=d'],
              Authorization: 'Basic amM6MDQ1MQ=='
            }
            var expectation = [
              'Cookie: a=b',
              'Cookie: c=d',
              'Authorization: Basic amM6MDQ1MQ=='
            ]
            return client
              .request(Method.Get, '/', null, null, headers)
              .then(function () {
                var options = transport.getCall(0).args[1]
                expect(options.headers).to.deep.eq(expectation)
              })
          })

          it('encodes and passes provided query', function () {
            var query = {
              category: 'books',
              filter: ['title=Once upon*', 'author=*John*']
            }
            var expectation = '?category=books&filter=title%3dOnce%20upon*&filter=author%3d*John*'
            return client
              .request(Method.Get, '/', query)
              .then(function () {
                var url = transport.getCall(0).args[0]
                url = url.replace('http://localhost/', '')
                expect(url.toLowerCase()).to.eq(expectation.toLowerCase())
              })
          })

          it('passes through payload', function () {
            var payload = '{}'
            return client
              .request(Method.Post, '/', null, payload)
              .then(function () {
                var options = transport.getCall(0).args[1]
                expect(options.postData).to.deep.eq(payload)
              })
          })

          it('decodes and returns response', function () {
            var headers = [
              {key: 'Server', value: 'nginx/1.9.9'},
              {key: 'Set-Cookie', value: 'lang=en'}
            ]
            var dummy = {code: 200, headers: headers, text: '{}'}
            var transport = transportFactory(dummy)
            var expectation = {
              Server: ['nginx/1.9.9'],
              'Set-Cookie': ['lang=en']
            }
            return clientFactory(transport)
              .request(Method.Get, '/test')
              .then(function (response) {
                expect(response.code).to.eq(dummy.code)
                expect(response.headers).to.deep.eq(expectation)
                expect(response.payload).to.eq(dummy.text)
              })
          })

          it('ignores method override header on GET/POST request', function () {
            var options = {methodOverrideHeader: 'X-HMO'}
            var client = clientFactory(transport, options)
            return client
              .request(Method.Get, '/')
              .then(function () {
                var options = transport.getCall(0).args[1]
                expect(options.headers).to.be.empty
              })
          })

          it('prevents non-GET/POST request without method override header', function () {
            var transport = transportFactory()
            var client = clientFactory(transport)

            return client
              .request(Method.Patch, '/')
              .then(branchStopper, function (error) {
                expect(error).to.be.instanceOf(Clients.InvalidConfigurationException)
                expect(transport.callCount).to.eq(0)
              })
          })

          it('adds method override header for non-GET/POST request', function () {
            var transport = transportFactory({code: 200})
            var options = {methodOverrideHeader: 'X-HMO'}
            var client = clientFactory(transport, options)
            var method = Method.Patch

            return client
              .request(method, '/')
              .then(function () {
                var headers = transport.getCall(0).args[1].headers
                expect(headers).to.deep.eq(['X-HMO: ' + method])
              })
          })

          it('merges and overwrites default headers', function () {
            var headers = {overwritten: ['a', 'b'], kept: ['c', 'd']}
            var options = {headers: headers}
            var overrides = {introduced: ['e', 'f'], overwritten: ['g']}
            var expectation = [
              'introduced: e',
              'introduced: f',
              'overwritten: g',
              'kept: c',
              'kept: d'
            ]
            var client = clientFactory(transport, options)
            return client
              .request(Method.Get, '/', [], null, overrides)
              .then(function () {
                var headers = transport.getCall(0).args[1].headers
                expect(headers.sort()).to.deep.eq(expectation.sort())
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

            it('does not throw on ' + errorType + ' error if told so', function () {
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

          it('retries not more times than specified in settings', function () {
            var transport = transportFactory({code: 500})
            var options = {
              retries: 4,
              throwOnServerError: false,
              retryOnServerError: true
            }
            var client = clientFactory(transport, options)

            return client
              .request(Method.Get, '/')
              .then(function (response) {
                expect(response.code).to.eq(500)
                expect(transport.callCount).to.eq(5)
              })
          })

          it('handles response with unknown code', function () {
            var transport = transportFactory({code: -500})
            var client = clientFactory(transport, {retryOnNetworkError: false})

            return client
              .request(Method.Get, '/')
              .then(branchStopper, function (error) {
                expect(error).to.be.instanceOf(Clients.NetworkException)
                expect(error.code).to.eq(-500)
              })
          })

          it('handles response with no code', function () {
            var transport = transportFactory({})
            var client = clientFactory(transport, {retryOnNetworkError: false})

            return client
              .request(Method.Get, '/')
              .then(branchStopper, function (error) {
                expect(error).to.be.instanceOf(Clients.NetworkException)
                expect(error.code).to.eq(-1)
              })
          })
        })

        var methods = ['get', 'head']
        methods.forEach(function (method) {
          describe('#' + method, function () {
            it('provides ' + method + ' request method', function () {
              var options = {methodOverrideHeader: 'X-HMO'}
              var client = clientFactory(transport, options)
              var query = {alpha: 'beta'}
              var headers = {'X-Gamma': 'delta'}
              return client[method]('/', query, headers)
                .then(function () {
                  var call = transport.getCall(0)
                  expect(call.args[1].headers).to.contain('X-Gamma: delta')
                  expect(call.args[1].postData).to.be.not.ok
                  expect(call.args[0]).to.eq('/?alpha=beta')
                })
            })
          })
        })

        methods = ['post', 'put', 'patch', 'delete']
        methods.forEach(function (method) {
          describe('#' + method, function () {
            it('provides ' + method + ' request method', function () {
              var options = {methodOverrideHeader: 'X-HMO'}
              var client = clientFactory(transport, options)
              var payload = '{"alpha": "beta"}'
              var headers = {'X-Gamma': 'delta'}
              var query = {alpha: 'beta'}
              return client[method]('/', payload, headers, query)
                .then(function () {
                  var call = transport.getCall(0)
                  expect(call.args[1].headers).to.contain('X-Gamma: delta')
                  expect(call.args[1].postData).to.eq(payload)
                  expect(call.args[0]).to.eq('/?alpha=beta')
                })
            })
          })
        })
      })
    })
  })
})
