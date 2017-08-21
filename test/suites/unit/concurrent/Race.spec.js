/* eslint-env mocha */

var Sinon = require('sinon')
var Chai = require('chai')
var expect = Chai.expect
var Race = require('../../../../lib').Concurrent.Race

describe('Unit', function () {
  describe('/Concurrent', function () {
    describe('/Race.js', function () {
      describe('.Race', function () {
        describe('< new', function () {
          it('allows to set arbitrary amount of places', function () {
            expect(new Race(5).getPlaces()).to.eq(5)
          })

          it('uses 1 place by default', function () {
            expect(new Race().getPlaces()).to.eq(1)
          })
        })

        describe('#racer', function () {
          it('allows function to be called not more than (places) times', function () {
            var value = {x: 12}
            var fn = Sinon.stub().returns(value)
            var race = new Race(2)
            var racer = race.racer(fn)
            expect(racer()).to.eq(value)
            expect(racer()).to.eq(value)
            expect(racer()).to.eq(undefined)
            expect(fn.callCount).to.eq(2)
          })

          it('allows all passed functions to be called not more than (places) times', function () {
            var value = {x: 12}
            var fn1 = Sinon.stub().returns(value)
            var fn2 = Sinon.stub().returns(value)
            var fn3 = Sinon.stub().returns(value)
            var race = new Race(3)
            var racer1 = race.racer(fn1)
            var racer2 = race.racer(fn2)
            var racer3 = race.racer(fn3)
            expect(racer1()).to.eq(value)
            expect(racer1()).to.eq(value)
            expect(racer2()).to.eq(value)
            expect(racer2()).to.eq(undefined)
            expect(racer3()).to.eq(undefined)
            expect(racer3()).to.eq(undefined)
            expect(fn1.callCount).to.eq(2)
            expect(fn2.callCount).to.eq(1)
            expect(fn3.callCount).to.eq(0)
          })
        })

        describe('#getWinners', function () {
          it('returns amount of winners', function () {
            var race = new Race(1)
            expect(race.getWinners()).to.eq(0)
            race.racer(function () {})()
            expect(race.getWinners()).to.eq(1)
          })
        })
      })
    })
  })
})
