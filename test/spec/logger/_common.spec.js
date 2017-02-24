//noinspection JSUnusedLocalSymbols
var sinon = require('sinon'),
    chai = require('chai'),
    should = chai.should(),
    expect = chai.expect,
    blackhole = chai.use(require('chai-string')),
    Commons = require('../../../lib/logger/_common'),
    Level = Commons.Level,
    toLevel = Commons.toLevel,
    Threshold = Commons.Threshold,
    toThreshold = Commons.toThreshold;

describe('/logger/_common.js', function () {
    describe('.toLevel', function () {
        it('should correctly process exact naming', function () {
            expect(toLevel('INFO')).to.eq(Level.Info);
        });

        it('should correctly process invalid case naming', function () {
            expect(toLevel('info')).to.eq(Level.Info);
        });

        it('should correctly process threshold value', function () {
            expect(toLevel(Threshold.INFO)).to.eq(Level.Info);
        });

        it('should return ALL on unknown name', function () {
            expect(toLevel('acute')).to.eq(Level.All);
        });

        it('should return ALL on invalid input', function () {
            ['', null, undefined, {}, false].forEach(function (input) {
                expect(toLevel(input)).to.eq(Level.All);
            });
        });
    });

    describe('.toThreshold', function () {
        it('should correctly process valid input', function () {
            expect(toThreshold(Level.Info)).to.eq(Threshold.INFO);
        });

        it('should pass through valid threshold', function () {
            Object.keys(Threshold).forEach(function (key) {
                expect(toThreshold(Threshold[key])).to.eq(Threshold[key]);
            });
        });

        it('should return ALL value on unknown input', function () {
            expect(toThreshold(1234)).to.eq(Threshold.ALL);
        });

        it('should return ALL on invalid input', function () {
            ['', null, undefined, {}, false].forEach(function (input) {
                expect(toThreshold(input)).to.eq(Threshold.ALL);
            });
        });
    });
});