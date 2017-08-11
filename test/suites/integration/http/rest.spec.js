/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
/* global transportFactory, basicFactory */

var Sinon = require('sinon')
var Chai = require('chai')
var expect = Chai.expect
var rest = require('../../../../lib/http/rest')
var Rest = rest.Client
var Commons = require('../../../../lib/http/_common')
var Method = Commons.Method
var Loggers = require('../../../../lib/logger')

Chai.use(require('chai-as-promised'))

function branchStopper () {
  Chai.assert(false, 'This branch should have never been executed')
}

var through = function (value) {
  return value
}

describe('Integration', function () {
  describe('/http', function () {
    describe('/rest.js', function () {
      var serializer

      beforeEach(function () {
        serializer = {
          serialize: Sinon.spy(through),
          deserialize: Sinon.spy(through)
        }
      })

      var clientFactory = function (transport, opts) {
        opts = opts || {methodOverrideHeader: 'X-MOH'}
        opts.logger = {level: Loggers.Level.Trace}
        opts.serializer = opts.serializer || serializer
        return new Rest(opts, transport)
      }

      var client = clientFactory(transportFactory({code: 200}))

      describe('.Client', function () {
        describe('#execute', function () {
          it('converts resource into url', function () {
            var basic = basicFactory({code: 200})
            var client = clientFactory(null, {client: basic})
            var resource = '/'

            return client
              .execute({method: Method.Get, resource: resource})
              .then(function () {
                expect(basic.execute.callCount).to.eq(1)
                var request = basic.execute.getCall(0).args[0]
                expect(request.url).to.eq(resource)
              })
          })

          it('provides 0.2.0 compatibility for route attribute', function () {
            var basic = basicFactory({code: 200})
            var client = clientFactory(null, {client: basic})
            var route = '/'

            return client
              .execute({method: Method.Get, route: route})
              .then(function () {
                expect(basic.execute.callCount).to.eq(1)
                var request = basic.execute.getCall(0).args[0]
                expect(request.url).to.eq(route)
              })
          })
        })

        describe('#request', function () {
          it('serializes provided payload', function () {
            var data = {x: 12}
            client
              .request(Method.Get)
              .then(function () {
                expect(serializer.serialize.callCount).to.eq(1)
                expect(serializer.serialize.getCall(0).args[0]).to.eq(data)
              })
          })

          it('deserializes received response', function () {
            var data = '{"x": 12}'
            var basic = basicFactory({code: 200, payload: data})
            var client = clientFactory(null, {client: basic})
            return client
              .request(Method.Get)
              .then(function () {
                expect(serializer.deserialize.callCount).to.eq(1)
                expect(serializer.deserialize.getCall(0).args[0]).to.eq(data)
              })
          })

          it('throws client error on 4xx by default', function () {
            var client = clientFactory(transportFactory({code: 400}))
            client
              .request(Method.Get, '/')
              .then(branchStopper, function (e) {
                expect(e).to.be.instanceOf(Commons.ClientErrorException)
              })
          })

          it('throws server error on 5xx by default', function () {
            var client = clientFactory(transportFactory({code: 500}))
            client
              .request(Method.Get, '/')
              .then(branchStopper, function (e) {
                expect(e).to.be.instanceOf(Commons.ServerErrorException)
              })
          })

          it('passes through query, headers and payload', function () {
            var basic = basicFactory({code: 200, payload: ''})
            var client = clientFactory(null, {client: basic})
            var payload = 'Some text'
            var query = {alpha: [1, 2]}
            var headers = {alpha: [1, 2]}

            return client
              .request(Commons.Method.Post, '/entity', payload, query, headers)
              .then(function () {
                expect(basic.execute.callCount).to.eq(1)
                var request = basic.execute.getCall(0).args[0]
                expect(request.query).to.deep.eq(query)
                expect(request.headers).to.deep.eq(headers)
                expect(request.payload).to.deep.eq(payload)
              })
          })
        })

        describe('#exists', function () {
          it('returns true for code 200 response', function () {
            var transport = transportFactory({code: 200})
            var client = clientFactory(transport)

            return expect(client.exists('/entity')).to.eventually.eq(true)
          })

          it('returns true for code 201 response', function () {
            var transport = transportFactory({code: 201})
            var client = clientFactory(transport)

            return expect(client.exists('/entity')).to.eventually.eq(true)
          })

          it('returns false for code 404 response', function () {
            var transport = transportFactory({code: 404})
            var client = clientFactory(transport)

            return expect(client.exists('/entity')).to.eventually.eq(false)
          })
        })

        describe('#get', function () {
          it('returns deserialized payload for code 200 response', function () {
            var payload = 'Some text'
            var transport = transportFactory({code: 200, text: payload})
            var client = clientFactory(transport)

            return client
              .get('/entity')
              .then(function (data) {
                expect(data).to.eq(payload)
                expect(serializer.deserialize.callCount).to.eq(1)
              })
          })

          it('returns deserialized payload for code 201 call', function () {
            var payload = 'Some text'
            var transport = transportFactory({code: 201, text: payload})
            var client = clientFactory(transport)

            return client
              .get('/entity')
              .then(function (data) {
                expect(data).to.eq(payload)
                expect(serializer.deserialize.callCount).to.eq(1)
              })
          })

          it('returns null for code 404 on .get() call', function () {
            var payload = 'Some text'
            var transport = transportFactory({code: 404, text: payload})
            var client = clientFactory(transport)

            return expect(client.get('/entity')).to.eventually.be.null
          })
        })

        var unsafe = ['create', 'set', 'modify', 'delete']

        unsafe.forEach(function (method) {
          describe('#' + method, function () {
            it('throws NotFoundException on 404 response', function () {
              var client = clientFactory(transportFactory({code: 404}))
              var ExceptionClass = Commons.NotFoundException
              var call = client[method]('/entity')

              return expect(call).to.eventually.be.rejectedWith(ExceptionClass)
            })

            it('throws ClientErrorException on 4xx responses', function () {
              var client = clientFactory(transportFactory({code: 400}))
              var ExceptionClass = Commons.ClientErrorException
              var call = client[method]('/entity')

              return expect(call).to.eventually.be.rejectedWith(ExceptionClass)
            })

            it('throws ServerErrorException on 5xx responses', function () {
              var client = clientFactory(transportFactory({code: 500}))
              var ExceptionClass = Commons.ServerErrorException
              var call = client[method]('/entity')

              return expect(call).to.eventually.be.rejectedWith(ExceptionClass)
            })

            it('returns passed data on 200 response', function () {
              var payload = 'Some text'
              var client = clientFactory(transportFactory({
                code: 200,
                text: payload
              }))

              return expect(client[method]('/entity')).to.eventually.eq(payload)
            })

            it('returns passed data on 201 response', function () {
              var payload = 'Some text'
              var client = clientFactory(transportFactory({
                code: 201,
                text: payload
              }))

              return expect(client[method]('/entity')).to.eventually.eq(payload)
            })
          })
        })
      })
    })
  })
})
