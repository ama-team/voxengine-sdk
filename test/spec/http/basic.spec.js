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

describe('/http', function () {
    describe('/basic.js', function () {
        var transportFactory = function (code, headers, text) {
                return sinon.spy(function () {
                    return Promise.resolve({code: code, headers: headers || {}, text: text || null});
                });
            };

        it('should correctly execute request', function () {
            return new Client(transportFactory(200, {}, '{}'))
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
                transport = transportFactory(200, {}, '{}');
            return new Client(transport, options)
                .request(Method.Get, '/test', [], null, overrides)
                .then(function () {
                    expect(transport.getCall(0).args[1].headers.sort()).to.deep.eq(expected.sort());
                })
        })
    });
});
