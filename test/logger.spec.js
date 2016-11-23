var sinon = require('sinon'),
    chai = require('chai'),
    chaiString = require('chai-string'),
    assert = chai.assert,
    should = chai.should(),
    loggers = require('../lib/loggers'),
    writerFactory = function () { return {'write': function (message) {}}; };

chai.use(chaiString);

describe('/logger.js', function () {
    describe('.slf4j', function () {
        var testMessage = 'Hey there, spectacular';

        it('should call writer.write on log call', function () {
            var writer = sinon.stub(writerFactory()),
                logger = new loggers.slf4j(writer, loggers.LogLevel.ALL);

            logger.error(testMessage);
            assert(writer.write.calledOnce);
            assert(writer.write.calledWithMatch(testMessage));
        });

        it('should pass message with level equal to threshold', function () {
            var writer = sinon.stub(writerFactory()),
                logger = new loggers.slf4j(writer, loggers.LogLevel.ERROR);

            logger.error(testMessage);
            assert(writer.write.calledOnce);
            assert(writer.write.calledWithMatch(testMessage));
        });

        it('should pass message with level higher than threshold', function () {
            var writer = sinon.stub(writerFactory()),
                logger = new loggers.slf4j(writer, loggers.LogLevel.DEBUG);

            logger.error(testMessage);
            assert(writer.write.calledOnce);
            assert(writer.write.calledWithMatch(testMessage));
        });

        it('should swallow message with level lesser than threshold', function () {
            var writer = sinon.stub(writerFactory()),
                logger = new loggers.slf4j(writer, loggers.LogLevel.ERROR);

            logger.debug(testMessage);
            assert(writer.write.notCalled);
        });

        it('should correctly render object', function () {
            var writer = sinon.stub(writerFactory()),
                logger = new loggers.slf4j(writer, loggers.LogLevel.ALL),
                parameter = {x: 12};
            logger.debug('parametrized: {}', parameter);
            writer.write.getCall(0).args[0].should.endWith('parametrized: ' + JSON.stringify(parameter));
        });

        it('should correctly render string', function () {
            var writer = sinon.stub(writerFactory()),
                logger = new loggers.slf4j(writer, loggers.LogLevel.ALL),
                parameter = 'value';
            logger.debug('parametrized: {}', parameter);
            writer.write.getCall(0).args[0].should.endWith('parametrized: value');
        });

        it('should correctly render boolean', function () {
            var writer = sinon.stub(writerFactory()),
                logger = new loggers.slf4j(writer, loggers.LogLevel.ALL),
                parameter = true;
            logger.debug('parametrized: {}', parameter);
            writer.write.getCall(0).args[0].should.endWith('parametrized: true');
        });

        it('should correctly render number', function () {
            var writer = sinon.stub(writerFactory()),
                logger = new loggers.slf4j(writer, loggers.LogLevel.ALL),
                parameter = 42;
            logger.debug('parametrized: {}', parameter);
            writer.write.getCall(0).args[0].should.endWith('parametrized: 42');
        });

        it('should correctly render null', function () {
            var writer = sinon.stub(writerFactory()),
                logger = new loggers.slf4j(writer, loggers.LogLevel.ALL),
                parameter = null;
            logger.debug('parametrized: {}', parameter);
            writer.write.getCall(0).args[0].should.endWith('parametrized: null');
        });

        it('should correctly render undefined', function () {
            var writer = sinon.stub(writerFactory()),
                logger = new loggers.slf4j(writer, loggers.LogLevel.ALL),
                parameter = undefined;
            logger.debug('parametrized: {}', parameter);
            writer.write.getCall(0).args[0].should.endWith('parametrized: {undefined}');
        });
    });
});