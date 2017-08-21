/**
 * This simple class allows some other code to race in execution, executing at
 * most N times.
 *
 * @param {int} [places] Maximum amount of calls to be made, defaults to 1
 *
 * @class
 */
function Race (places) {
  places = typeof places === 'number' ? places : 1
  var winners = 0

  /**
   * Adds new racer by wrapping target function in a safety wrapper that will
   * control it's non-execution in case race has been already won. Wrapped
   * function will return original result if it has won the race or undefined
   * if race has been lost.
   *
   * @param {Function} f Function to wrap
   * @param {*} [that] Thing that will be injected as `this` during the call
   * @return {Function}
   */
  this.racer = function (f, that) {
    return function () {
      if (winners >= places) { return }
      winners++
      return f.apply(that, arguments)
    }
  }

  this.getWinners = function () { return winners }
  this.getPlaces = function () { return places }
}

module.exports = {
  Race: Race
}
