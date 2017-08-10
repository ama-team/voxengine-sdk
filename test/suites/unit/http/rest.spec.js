/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

var sinon = require('sinon')
var chai = require('chai')
var assert = chai.assert
var Clients = require('../../../../lib/http/index')
var rest = require('../../../../lib/http/rest')
var Rest = rest.Client

chai.use(require('chai-as-promised'))
chai.should()

function through (_) {
  return _
}

// todo: save log output in allure

describe('Unit', function () {
  describe('/http', function () {
    describe('/rest.js', function () {
      var serializer

      beforeEach(function () {
        serializer = {
          serialize: sinon.spy(through),
          deserialize: sinon.spy(through)
        }
      })
      var transportFactory = function () {
        var responses = Array.prototype.slice.call(arguments, 0)
        var index = 0
        return sinon.spy(function () {
          return Promise.resolve(responses[index++ % responses.length])
        })
      }
      var clientFactory = function (transport, opts) {
        opts = opts || {methodOverrideHeader: 'X-MOH'}
        opts.serializer = opts.serializer || serializer
        return new Rest(opts, transport)
      }

      describe('.Client', function () {
        describe('.exists', function () {
          it('should return true for code 200 response', function () {
            var transport = transportFactory({code: 200})
            var client = clientFactory(transport)

            return client.exists('/entity').should.eventually.eq(true)
          })

          it('should return true for code 201 response', function () {
            var transport = transportFactory({code: 201})
            var client = clientFactory(transport)

            return client.exists('/entity').should.eventually.eq(true)
          })

          it('should return false for code 404 response', function () {
            var transport = transportFactory({code: 404})
            var client = clientFactory(transport)

            return client.exists('/entity').should.eventually.eq(false)
          })
        })

        describe('.get', function () {
          it('should return deserialized payload for code 200 response', function () {
            var payload = 'Some text'
            var transport = transportFactory({code: 200, text: payload})
            var client = clientFactory(transport)

            return client.get('/entity').should.eventually.eq(payload)
          })

          it('should return deserialized payload for code 201 on .get() call', function () {
            var payload = 'Some text'
            var transport = transportFactory({code: 200, text: payload})
            var client = clientFactory(transport)

            return client.get('/entity').should.eventually.eq(payload)
          })

          it('should return null for code 404 on .get() call', function () {
            var payload = 'Some text'
            var transport = transportFactory({code: 404, text: payload})
            var client = clientFactory(transport)

            return client.get('/entity').should.eventually.eq(null)
          })
        })

        var unsafe = ['create', 'set', 'modify', 'delete']

        unsafe.forEach(function (method) {
          describe('.' + method, function () {
            it('throws NotFoundException on 404 response', function () {
              var client = clientFactory(transportFactory({code: 404}))
              var ExceptionClass = Clients.NotFoundException
              var call = client[method]('/entity')

              return call.should.eventually.be.rejectedWith(ExceptionClass)
            })

            it('returns passed data on 200 response', function () {
              var payload = 'Some text'
              var client = clientFactory(transportFactory({
                code: 200,
                text: payload
              }))

              return client[method]('/entity').should.eventually.eq(payload)
            })

            it('should return passed data on 201 response', function () {
              var payload = 'Some text'
              var client = clientFactory(transportFactory({
                code: 201,
                text: payload
              }))

              return client[method]('/entity').should.eventually.eq(payload)
            })

            it('calls serializer on provided payload', function () {
              var options = {
                methodOverrideHeader: 'X-MOH',
                serializer: serializer
              }
              var client = new Rest(options, transportFactory({code: 200}))
              var payload = 'Some text'

              return client[method]('/entity', payload).then(function () {
                serializer.serialize.callCount.should.eq(1)
                serializer.serialize.getCall(0).args[0].should.eq(payload)
              })
            })
          })
        })

        it('works correctly without any settings provided', function () {
          var data = 'Some text'
          var payload = JSON.stringify(data)
          var client = new Rest(transportFactory({code: 200, text: payload}))

          return client.get('/entity').should.eventually.eq(data)
        })

        it('correctly processes empty response headers', function () {
          // yay, 100% coverage
          var executor = sinon.spy(function () {
            return Promise.resolve({code: 200, text: ''})
          })
          var basic = {execute: executor}
          var client = new Rest({client: basic})

          return client
            .request(Clients.Method.Get, '/entity')
            .then(function () {
              executor.callCount.should.eq(1)
            })
        })

        it('passes through query, headers and payload', function () {
          var executor = sinon.spy(function () {
            return Promise.resolve({code: 200, text: ''})
          })
          var basic = {execute: executor}
          var serializer = {serialize: through, deserialize: through}
          var client = new Rest({client: basic, serializer: serializer})
          var payload = 'Some text'
          var query = {alpha: [1, 2]}
          var headers = {alpha: [1, 2]}

          return client
            .request(Clients.Method.Post, '/entity', payload, query, headers)
            .then(function () {
              executor.callCount.should.eq(1)
              var request = executor.getCall(0).args[0]
              assert(request)
              request.query.should.deep.eq(query)
              request.headers.should.deep.eq(headers)
              request.payload.should.deep.eq(payload)
            })
        })
      })
    })
  })
})
