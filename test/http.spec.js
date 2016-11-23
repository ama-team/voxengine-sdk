var sinon = require('sinon'),
    chai = require('chai'),
    should = chai.should(),
    assert = chai.assert,
    chaiPromised = require('chai-as-promised'),
    clients = require('../lib/http'),
    HttpMethod = clients.HttpMethod,
    transportFactory = function () {
        var stub = sinon.stub(),
            returnValue;
        for (var i = 0; i < arguments.length; i++) {
            returnValue = arguments[i];
            returnValue.headers = returnValue.headers || {};
            stub.onCall(i).returns(Promise.resolve(returnValue));
        }
        return stub;
    },
    /**
     * @param transport
     * @param [settings]
     * @return {RestClient}
     */
    clientFactory = function (transport, settings) {
        settings = settings || {};
        return new clients.rest(transport, settings);
    };

// todo: not good
//noinspection JSUnusedGlobalSymbols
global.Net = {HttpRequestOptions: function () {
    this.headers = {};
    this.postData = null;
    this.method = null;
}};

chai.use(chaiPromised);

describe('/http-client.js', function () {
    describe('.rest', function () {

        it('should not use methodOverrideHeader on GET request', function () {
            var transport = transportFactory({code: 200}),
                client = clientFactory(transport, {methodOverrideHeader: 'X-HTTP-Method-Override'});
            return client.request(HttpMethod.Get, '/objects/1')
                .then(function () {
                    transport.getCall(0).args[1].headers.should.not.have.property('X-HTTP-Method-Override');
                });
        });

        it('should use methodOverrideHeader on PUT request', function () {
            var transport = transportFactory({code: 200}),
                client = clientFactory(transport, {methodOverrideHeader: 'X-HTTP-Method-Override'});
            return client.request(HttpMethod.Put, '/objects/1')
                .then(function () {
                    transport.getCall(0).args[1].headers.should.contain('X-HTTP-Method-Override: ' + HttpMethod.Put);
                });
        });

        it('should fail without methodOverrideHeader on PUT request', function () {
            var transport = transportFactory({code: 200}),
                client = clientFactory(transport);
            return client.request(HttpMethod.Put, '/objects/1').should.eventually.be.rejected;
        });

        it('should not retry if 1 is specified as max attempts', function () {
            var transport = transportFactory({code: 500}),
                client = clientFactory(transport, {retryOnServerError: true, attempts: 1});
            return client.request(HttpMethod.Get, '/').then(function() {
                assert.fail('This branch should not have been executed');
            }, function () {
                assert(transport.calledOnce);
            });
        });

        it('should retry twice if 3 is specified as max attempts', function () {
            var response = {code: 500},
                transport = transportFactory(response, response, response),
                client = clientFactory(transport, {retryOnServerError: true, attempts: 3});
            return client.request(HttpMethod.Get, '/').then(function() {
                assert.fail('This branch should not have been executed');
            }, function () {
                assert(transport.calledThrice);
            });
        });

        it('should retry on network fail by default', function () {
            var transport = transportFactory({code: -6}, {code: 200}),
                client = clientFactory(transport, {attempts: 2});
            return client.request(HttpMethod.Get, '/').then(function() {
                assert(transport.calledTwice);
            });
        });

        it('should not retry on network fail if this feature is turned off', function () {
            var transport = transportFactory({code: -6}, {code: 200}),
                client = clientFactory(transport, {retryOnNetworkError: false, attempts: 2});
            return client.request(HttpMethod.Get, '/').then(function() {
                assert.fail('This branch should not have been executed');
            }, function () {
                assert(transport.calledOnce);
            });
        });

        it('should retry on server error by default', function () {
            var transport = transportFactory({code: 500}, {code: 200}),
                client = clientFactory(transport, {attempts: 2});
            return client.request(HttpMethod.Get, '/').should.eventually.have.property('code', 200);
        });

        it('should not retry on server error if this feature is turned off', function () {
            var transport = transportFactory({code: 500}, {code: 200}),
                client = clientFactory(transport, {retryOnServerError: false, attempts: 2});
            return client.request(HttpMethod.Get, '/').then(function () {
                assert.fail('This branch should not have been executed');
            }, function () {
                assert(transport.calledOnce);
            });
        });

        it('should not retry on client error by default', function () {
            var transport = transportFactory({code: 400}, {code: 200}),
                client = clientFactory(transport, {attempts: 2});
            return client.request(HttpMethod.Get, '/').then(function () {
                assert.fail('This branch should not have been executed');
            }, function () {
                assert(transport.calledOnce);
            });
        });

        it('should retry on client error if this feature is turned on', function () {
            var transport = transportFactory({code: 400}, {code: 200}),
                client = clientFactory(transport, {retryOnClientError: true, attempts: 2});
            return client.request(HttpMethod.Get, '/').should.eventually.have.property('code', 200);
        });

        it('should serialize and deserialize data', function () {
            var data = {x: 12},
                transport = transportFactory({code: 200, body: JSON.stringify(data)}),
                client = clientFactory(transport);
            return client.request(HttpMethod.Get, '/', data).then(function (response) {
                JSON.stringify(data).should.be.deep.equal(transport.getCall(0).args[1].postData);
                return response.payload;
            }).should.eventually.be.deep.equal(data);
        });

        it('should correctly process headers injected as strings', function () {
            var transport = transportFactory({code: 200}),
                client = clientFactory(transport);
            return client.request(HttpMethod.Get, '/', {}, {}, {'Content-Type': 'application/json'})
                .then(function () {
                    transport.getCall(0).args[1].headers.should.be.deep.equal(['Content-Type: application/json']);
                });
        });

        it('should correctly assemble query ', function () {
            var transport = transportFactory({code: 200}),
                client = clientFactory(transport),
                expected = '/?query=%D1%84%D0%B0%D0%BD%D1%82%D0%B0%D1%81%D1%82%D0%B8%D0%BA%D0%B0&filter=cheap&filter=colorful&filter=1%3D1';
            return client.request(HttpMethod.Get, '/', {}, {query: 'фантастика', filter: ['cheap', 'colorful', '1=1']})
                .then(function () {
                    transport.getCall(0).args[0].should.be.equal(expected);
                });
        });
    });
});