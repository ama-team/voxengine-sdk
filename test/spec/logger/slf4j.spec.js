var sinon = require('sinon'),
    chai = require('chai'),
    chaiString = require('chai-string'),
    assert = chai.assert,
    should = chai.should,
    Loggers = require('../../../lib/logger'),
    Slf4j = Loggers.slf4j.Slf4j,
    Level = Loggers.Level,
    expect = chai.expect;

chai.use(chaiString);

describe('/logger', function () {
    describe('/slf4j.js', function () {
        describe('.Slf4j', function () {
            var testMessage = 'Hey there, spectacular',
                loggerName = 'ama-team.voxengine-sdk.slf4j.Slf4j',
                logs,
                writer,
                logger;

            beforeEach(function () {
                logs = [];
                writer = {
                    write: sinon.spy(function (message) {
                        logs.push(message);
                    })
                };
                logger = new Slf4j(loggerName, Level.All, writer);
            });

            afterEach(function () {
                if ('allure' in global && logs.length) {
                    allure.createAttachment('output.log', logs.join('\n'), 'text/plain');
                }
            });

            it('should call writer.write on log call', function () {
                logger.error(testMessage);
                assert(writer.write.calledOnce);
                assert(writer.write.calledWithMatch(testMessage));
            });

            it('should pass logger name in output', function () {
                logger.error(testMessage);
                expect(logs[0]).to.be.contain(loggerName)
            });

            it('should feel ok without logger name', function () {
                logger = new Slf4j(undefined, Level.All, writer);
                logger.error(testMessage);
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
                logger = new Slf4j(loggerName, Level.Error, writer);
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
                    expected = ['[DEBUG] ' + loggerName + ': Unhandled exception:', name + ': ' + message, 'Stack:', stack].join('\n'),
                    pattern = 'Unhandled exception:';

                parameter.name = name;
                parameter.message = message;
                parameter.stack = stack;

                logger.debug(pattern, parameter);
                writer.write.getCall(0).args[0].should.equal(expected);
            });

            it('should allow threshold reconfiguration on-the-fly', function () {
                logger.debug('Message #{}', 1);
                logger.setThreshold(Level.Error);
                logger.debug('Message #{}', 2);

                writer.write.callCount.should.eq(1);
                writer.write.getCall(0).args[0].should.contain('Message #1');
            });
        });
    });
});