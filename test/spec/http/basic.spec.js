//noinspection JSUnusedLocalSymbols
var chai = require('chai'),
    expect = chai.expect,
    assert = chai.assert,
    sinon = require('sinon'),
    Clients = require('../../../lib/http'),
    Method = Clients.Method,
    Client = Clients.basic.Client;

// todo
Logger = {write: console.log.bind(console)};

function branchStopper() {
    assert(false, 'This branch should have never been executed');
}

describe('/http', function () {
    describe('/basic.js', function () {
        var transportFactory = function (responses) {
                if (arguments.length === 0) {
                    throw new Error('Not enough arguments');
                }
                responses = Array.prototype.slice.call(arguments, 0);
                var index = 0;
                // poor man's onCall
                return sinon.spy(function () {
                     index = index % responses.length;
                     return Promise.resolve(responses[index++]);
                });
            };

        it('should correctly execute request', function () {
            return new Client(transportFactory({code: 200, headers: {}, text: '{}'}))
                .request(Method.Get, '/test')
                .then(function (response) {
                    expect(response.code).to.eq(200);
                    expect(response.headers).to.deep.eq({});
                    expect(response.payload).to.eq('{}');
                });
        });

        it('should correctly merge and overwrite headers', function () {
            var options = {headers: {overwritten: ['a', 'b'], kept: ['c', 'd']}},
                overrides = {introduced: ['e', 'f'], overwritten: ['g']},
                expected = [
                    'introduced: e',
                    'introduced: f',
                    'overwritten: g',
                    'kept: c',
                    'kept: d'
                ],
                transport = transportFactory({code: 200, headers: {}, text: '{}'});
            return new Client(transport, options)
                .request(Method.Get, '/test', [], null, overrides)
                .then(function () {
                    expect(transport.getCall(0).args[1].headers.sort()).to.deep.eq(expected.sort());
                })
        });

        ['get', 'head'].forEach(function (method) {
            it('should provide ' + method + ' request method', function () {
                var transport = transportFactory({code: 200, headers: {}, text: '{}'}),
                    client = new Client(transport);
                return client[method].call(client, '/test', {alpha: 'beta'}, {'X-Gamma': 'delta'})
                    .then(function () {
                        var call = transport.getCall(0);
                        expect(call.args[1].headers).to.deep.eq(['X-Gamma: delta']);
                        expect(call.args[1].postData).to.be.not.ok;
                        expect(call.args[0]).to.eq('/test?alpha=beta');
                    });
            });
        });

        ['post', 'put', 'patch', 'delete'].forEach(function (method) {
            it('should provide ' + method + ' request method', function () {
                var transport = transportFactory({code: 200, headers: {}, text: '{}'}),
                    client = new Client(transport),
                    payload = '{"alpha": "beta"}';
                return client[method].call(client, '/test', payload, {'X-Gamma': 'delta'})
                    .then(function () {
                        var call = transport.getCall(0);
                        expect(call.args[1].headers).to.deep.eq(['X-Gamma: delta']);
                        expect(call.args[1].postData).to.eq(payload);
                        expect(call.args[0]).to.eq('/test');
                    });
            });
        });

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
        };

        Object.keys(errorTypes).forEach(function (errorType) {
            var error = errorTypes[errorType];
            it('should retry on ' + errorType + ' error if told so', function () {
                var transport = transportFactory({code: error.code}, {code: 200}),
                    opts = {},
                    client;

                opts['retryOn' + errorType] = true;
                client = new Client(transport, opts);

                return client.get('/test').then(function (response) {
                    expect(response.code).to.eq(200);
                    expect(transport.callCount).to.eq(2);
                });
            });

            it('should not retry on ' + errorType + ' error unless told so', function () {
                var transport = transportFactory({code: error.code}, {code: 200}),
                    opts = {},
                    client;

                opts['retryOn' + errorType] = false;
                opts['throwOn' + errorType] = true;
                client = new Client(transport, opts);

                return client.get('/test').then(branchStopper, function (e) {
                    expect(e).to.be.instanceOf(error.exception);
                    expect(transport.callCount).to.eq(1);
                });
            });

            if (errorType === 'NetworkError') {
                return;
            }

            it('should not throw on ' + errorType + ' error if told so', function () {
                var transport = transportFactory({code: error.code}),
                    opts = {},
                    client;

                opts['retryOn' + errorType] = false;
                opts['throwOn' + errorType] = false;
                client = new Client(transport, opts);

                return client.get('/test').then(function (response) {
                    expect(response.code).eq(error.code);
                    expect(transport.callCount).to.eq(1);
                });
            });
        });

        it('should retry not more times than specified in settings', function () {
            var transport = transportFactory({code: 500}),
                client = new Client(transport, {retries: 4, throwOnServerError: false, retryOnServerError: true});

            return client.get('/test').then(function (response) {
                expect(response.code).to.eq(500);
                expect(transport.callCount).to.eq(5);
            });
        });

        it('should correctly handle response with unknown code', function () {
            var transport = transportFactory({code: -500}),
                client = new Client(transport, {retryOnNetworkError: false});

            return client.get('/test').then(branchStopper, function (error) {
                expect(error).to.be.instanceOf(Clients.NetworkException);
                expect(error.code).to.eq(-500);
            });
        });

        it('should correctly handle response with no code', function () {
            var transport = transportFactory({}),
                client = new Client(transport, {retryOnNetworkError: false});

            return client.get('/test').then(branchStopper, function (error) {
                expect(error).to.be.instanceOf(Clients.NetworkException);
                expect(error.code).to.eq(-1);
            });
        })
    });
});
