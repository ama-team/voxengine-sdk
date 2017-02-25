//noinspection JSUnusedLocalSymbols
var chai = require('chai'),
    expect = chai.expect,
    assert = chai.assert,
    Commons = require('../../../lib/http/_common');

describe('/http', function () {
   describe('/_common.js', function () {
       it('should really provide defined exceptions', function () {
           var exceptions = [
               'NetworkException',
               'IllegalUrlException',
               'MissingHostException',
               'ConnectionErrorException',
               'RedirectVortexException',
               'NetworkErrorException',
               'TimeoutException',
               'VoxEngineErrorException'
           ];
           exceptions.forEach(function (id) {
               var clazz = Commons[id],
                   e = new clazz();
               expect(e.name).to.eq(id);
               expect(e.message).to.be.ok;
               expect(e.message).to.be.eq(clazz.prototype.message);
               expect(e.code).to.be.ok;
               expect(e.code).to.be.eq(clazz.prototype.code);
               expect(e).to.be.instanceOf(clazz);
           });
       });

       it('should provide inverse exception index', function () {
           for (var i = -1; i >= -8; i--) {
               expect(Commons.codeExceptionIndex[i].prototype.code).to.eq(i);
           }
       });

       it('should pass through provided code', function () {
           expect(new Commons.NetworkException(null, -120).code).to.eq(-120);
           expect(new Commons.TimeoutException(null, -120).code).to.eq(-120);
       });

       it('should save provided message', function () {
           expect(new Commons.NetworkException('dummy').message).to.eq('dummy');
           expect(new Commons.TimeoutException('dummy').message).to.eq('dummy');
       });

       describe('.params', function () {
           describe('.normalize', function () {
               it('should accept invalid input as empty', function () {
                   expect(Commons.params.normalize(null)).to.deep.eq({});
               });

               it('should not process array keys', function () {
                   var input = {param: ['a', 'b']};
                   expect(Commons.params.normalize(input)).to.deep.eq(input);
               });

               it('should arrayify non-array keys', function () {
                   var input = {param: 12, value: 'test'},
                       expected = {param: [12], value: ['test']};

                   expect(Commons.params.normalize(input)).to.deep.eq(expected);
               });

               it('should return expected value on complex input', function () {
                   var input = {alpha: 1, beta: [1, 3], gamma: []},
                       expected = {alpha: [1], beta: [1, 3], gamma: []};

                   expect(Commons.params.normalize(input)).to.deep.eq(expected);
               });
           });
       });
       
       describe('.query', function () {
           it('should encode empty query as empty string', function () {
               expect(Commons.query.encode({})).to.eq('');
           });

           it('should encode falsey input as empty string', function () {
               expect(Commons.query.encode(false)).to.eq('');
           });

           it('should correctly encode non-normalized query', function () {
               var query = {metadata: 12, variable: 'truth'},
                   expected = 'metadata=12&variable=truth';

               expect(Commons.query.encode(query)).to.eq(expected);
           });

           it('should correctly encode a real-world example', function () {
               var query = {metadata: ['vendor:ЗАО "АстроФизика"', 'flags.debug=true']},
                   expected = 'metadata=vendor%3A%D0%97%D0%90%D0%9E%20%22%D0%90%D1%81%D1%82%D1%80%D0%BE%D0%A4%D0%B8%D0%B7%D0%B8%D0%BA%D0%B0%22&metadata=flags.debug%3Dtrue';

               expect(Commons.query.encode(query)).to.eq(expected);
           });
       });

       describe('.headers', function () {
           describe('.encode', function () {
               it('should encode empty input as empty array', function () {
                   expect(Commons.headers.encode({})).to.be.deep.eq([]);
               });

               it('should encode falsey input as empty array', function () {
                   expect(Commons.headers.encode(undefined)).to.be.deep.eq([]);
               });

               it('should encode example as expected', function () {
                   var input = {
                           'X-Index': [23],
                           'X-Link': ['rel=user;href=/user/123', 'rel=self;href=/entity']
                       },
                       expected = [
                           'X-Index: 23',
                           'X-Link: rel=user;href=/user/123',
                           'X-Link: rel=self;href=/entity'
                       ];

                   expect(Commons.headers.encode(input)).to.be.deep.eq(expected);
               });

               it('should correctly encode non-normalized input', function () {
                   var input = {'X-Index': 23},
                       expected = ['X-Index: 23'];

                   expect(Commons.headers.encode(input)).to.deep.eq(expected);
               });
           });

           describe('.decode', function () {
               it('should decode empty input to empty object', function () {
                   expect(Commons.headers.decode({})).to.deep.eq({});
               });

               it('should decode falsey input to empty object', function () {
                   expect(Commons.headers.decode(undefined)).to.deep.eq({});
               });

               it('should correctly decode example', function () {
                   var input = {
                           server: 'WebStorm 2016.3.3',
                           'X-Content-Type-Options': 'nosniff',
                           'X-Frame-Options': 'SameOrigin'
                       },
                       expected = {
                           server: ['WebStorm 2016.3.3'],
                           'X-Content-Type-Options': ['nosniff'],
                           'X-Frame-Options': ['SameOrigin']
                       };
                   expect(Commons.headers.decode(input)).to.deep.eq(expected);
               });
           });

           describe('.merge', function () {
               var examples = [
                   {
                       input: [],
                       output: {}
                   },
                   {
                       input: [{alpha: [1]}],
                       output: {alpha: [1]}
                   },
                   {
                       input: [
                           {alpha: [1, 2]},
                           {gamma: [1, 2]}
                       ],
                       output: {
                           alpha: [1, 2],
                           gamma: [1, 2]
                       }
                   },
                   {
                       input: [
                           {alpha: [1, 1]},
                           {beta: [2, 2], gamma: [2, 2]},
                           {gamma: [3]}
                       ],
                       output: {
                           alpha: [1, 1],
                           beta: [2, 2],
                           gamma: [3]
                       }
                   }
               ];

               examples.forEach(function (example) {
                   it('should correctly merge provided example data', function () {
                       for (var i = 0; i < example.input.length; i++) {
                           allure.addArgument(i.toString(), JSON.stringify(example.input[i]));
                       }
                       expect(Commons.headers.merge.apply(null, example.input)).to.deep.eq(example.output);
                   });
               });
           });
       });
   });
});
