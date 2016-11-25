var sinon = require('sinon'),
    chai = require('chai'),
    chaiString = require('chai-string'),
    assert = chai.assert,
    should = chai.should(),
    loggers = require('../../lib/loggers');

chai.use(chaiString);

describe('/logger.js', function () {
    describe('.slf4j', function () {
        var testMessage = 'Hey there, spectacular',
            logs,
            writer,
            logger;

        beforeEach(function () {
            logs = [];
            writer = {
                write: function (message) {
                    logs.push(message);
                }
            };
            sinon.spy(writer, 'write');
            logger = new loggers.slf4j(writer, loggers.LogLevel.ALL);
        });

        afterEach(function () {
            if ('allure' in global && logs.length) {
                allure.createAttachment('out.log', logs.join('\n'), 'text/plain');
            }
        });

        it('should call writer.write on log call', function () {
            logger.error(testMessage);
            assert(writer.write.calledOnce);
            assert(writer.write.calledWithMatch(testMessage));
        });

        it('should pass message with level equal to threshold', function () {
            logger.error(testMessage);
            assert(writer.write.calledOnce);
            assert(writer.write.calledWithMatch(testMessage));
        });

        it('should pass message with level higher than threshold', function () {
            logger.error(testMessage);
            assert(writer.write.calledOnce);
            assert(writer.write.calledWithMatch(testMessage));
        });

        it('should swallow message with level lesser than threshold', function () {
            logger = new loggers.slf4j(writer, loggers.LogLevel.ERROR);
            logger.debug(testMessage);
            assert(writer.write.notCalled);
        });

        it('should correctly render object', function () {
            var parameter = {x: 12};
            logger.debug('parametrized: {}', parameter);
            writer.write.getCall(0).args[0].should.endWith('parametrized: ' + JSON.stringify(parameter));
        });

        it('should correctly render string', function () {
            var parameter = 'value';
            logger.debug('parametrized: {}', parameter);
            writer.write.getCall(0).args[0].should.endWith('parametrized: value');
        });

        it('should correctly render boolean', function () {
            var parameter = true;
            logger.debug('parametrized: {}', parameter);
            writer.write.getCall(0).args[0].should.endWith('parametrized: true');
        });

        it('should correctly render number', function () {
            var parameter = 42;
            logger.debug('parametrized: {}', parameter);
            writer.write.getCall(0).args[0].should.endWith('parametrized: 42');
        });

        it('should correctly render null', function () {
            var parameter = null;
            logger.debug('parametrized: {}', parameter);
            writer.write.getCall(0).args[0].should.endWith('parametrized: null');
        });

        it('should correctly render undefined', function () {
            var parameter = undefined;
            logger.debug('parametrized: {}', parameter);
            writer.write.getCall(0).args[0].should.endWith('parametrized: {undefined}');
        });

        it('should correctly render error', function () {
            var parameter = new Error(),
                stack = 'superFunc() at file:60:64\nanotherFunc() at file:60:64',
                name = 'TestingException',
                message = 'An exception has been thrown',
                expected = ['[DEBUG] Unhandled exception:', name + ': ' + message, 'Stack:', stack].join('\n'),
                pattern = 'Unhandled exception:';

            parameter.name = name;
            parameter.message = message;
            parameter.stack = stack;

            logger.debug(pattern, parameter);
            writer.write.getCall(0).args[0].should.equal(expected);
        });
    });
});