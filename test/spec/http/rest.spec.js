var sinon = require('sinon'),
    chai = require('chai'),
    should = chai.should(),
    assert = chai.assert,
    chaiPromised = require('chai-as-promised'),
    Clients = require('../../../lib/http'),
    rest = require('../../../lib/http/rest'),
    Rest = rest.Client;

chai.use(chaiPromised);

// todo: save log output in allure

describe('/http', function () {
    describe('/rest.js', function () {
        var transportFactory = function () {
                var responses = Array.prototype.slice.call(arguments, 0),
                    index = 0;
                return sinon.spy(function () {
                    return Promise.resolve(responses[index++ % responses.length]);
                });
            },
            clientFactory = function (transport, opts) {
                opts = opts || {methodOverrideHeader: 'X-MOH'};
                opts.serializer = opts.serializer || {
                        serialize: function (_) {
                            return _;
                        },
                        deserialize: function (_) {
                            return _;
                        }
                    };
                return new Rest(opts, transport);
            };

        describe('.Client', function () {
            describe('.exists', function () {
                it('should return true for code 200 response', function () {
                    var transport = transportFactory({code: 200}),
                        client = clientFactory(transport);

                    return client.exists('/entity').should.eventually.eq(true);
                });

                it('should return true for code 201 response', function () {
                    var transport = transportFactory({code: 201}),
                        client = clientFactory(transport);

                    return client.exists('/entity').should.eventually.eq(true);
                });

                it('should return false for code 404 response', function () {
                    var transport = transportFactory({code: 404}),
                        client = clientFactory(transport);

                    return client.exists('/entity').should.eventually.eq(false);
                });
            });

            describe('.get', function () {
                it('should return deserialized payload for code 200 response', function () {
                    var payload = 'Some text',
                        transport = transportFactory({code: 200, text: payload}),
                        client = clientFactory(transport);

                    return client.get('/entity').should.eventually.eq(payload);
                });

                it('should return deserialized payload for code 201 on .get() call', function () {
                    var payload = 'Some text',
                        transport = transportFactory({code: 200, text: payload}),
                        client = clientFactory(transport);

                    return client.get('/entity').should.eventually.eq(payload);
                });

                it('should return null for code 404 on .get() call', function () {
                    var payload = 'Some text',
                        transport = transportFactory({code: 404, text: payload}),
                        client = clientFactory(transport);

                    return client.get('/entity').should.eventually.eq(null);
                });
            });

            var unsafe = ['create', 'set', 'modify', 'delete'];

            unsafe.forEach(function (method) {
                describe('.' + method, function () {
                    it('should throw NotFoundException on 404 response', function () {
                        var client = clientFactory(transportFactory({code: 404})),
                            eClass = Clients.NotFoundException;

                        return client[method].call(client, '/entity').should.eventually.be.rejectedWith(eClass);
                    });
                    
                    it('should return passed data on 200 response', function () {
                        var payload = 'Some text',
                            client = clientFactory(transportFactory({code: 200, text: payload}));

                        return client[method].call(client, '/entity').should.eventually.eq(payload);
                    });

                    it('should return passed data on 201 response', function () {
                        var payload = 'Some text',
                            client = clientFactory(transportFactory({code: 201, text: payload}));

                        return client[method].call(client, '/entity').should.eventually.eq(payload);
                    });

                    it('should call serializer on provided payload', function () {
                        var serializer = sinon.spy(function (data) {
                                return data;
                            }),
                            settings = {
                                methodOverrideHeader: 'X-MOH',
                                serializer: {
                                    serialize: serializer,
                                    deserialize: function (data) {
                                        return data;
                                    }
                                }
                            },
                            client = clientFactory(transportFactory({code: 200}), settings),
                            payload = 'Some text';

                        return client[method].call(client, '/entity', payload).then(function () {
                            serializer.callCount.should.eq(1);
                            serializer.getCall(0).args[0].should.eq(payload);
                        });
                    });
                });
            });

            it('should work correctly without any settings provided', function () {
                var data = 'Some text',
                    payload = JSON.stringify(data),
                    client = new Rest(null, transportFactory({code: 200, text: payload}));

                return client.get('/entity').should.eventually.eq(data);
            });

            it('should correctly process empty response headers', function () {
                // yay, 100% coverage
                var executor = sinon.spy(function () {
                        return Promise.resolve({code: 200, text: ''});
                    }),
                    basic = {execute: executor},
                    client = clientFactory(null, {client: basic});

                return client.request(Clients.Method.Get, '/entity').then(function () {
                    executor.callCount.should.eq(1);
                });
            });

            it('should pass through query, headers and payload', function () {
                var executor = sinon.spy(function () {
                        return Promise.resolve({code: 200, text: ''});
                    }),
                    basic = {execute: executor},
                    serializer = {
                        serialize: function (data) {
                            return data;
                        },
                        deserialize: function (data) {
                            return data;
                        }
                    },
                    client = clientFactory(null, {client: basic, serializer: serializer}),
                    payload = 'Some text',
                    query = {alpha: [1, 2]},
                    headers = {alpha: [1, 2]};

                return client
                    .request(Clients.Method.Post, '/entity', payload, query, headers)
                    .then(function () {
                        executor.callCount.should.eq(1);
                        var request = executor.getCall(0).args[0];
                        assert(request);
                        request.query.should.deep.eq(query);
                        request.headers.should.deep.eq(headers);
                        request.payload.should.deep.eq(payload);
                    });
            });
        });
    });
});
