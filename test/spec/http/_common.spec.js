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
   });
});
