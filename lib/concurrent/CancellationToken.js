var Future = require('./Future').Future
var Slf4j = require('../logger').Slf4j

// TODO: use interfaces instead of direct cancellation token class references

/**
 * This class exists to propagate cancellation through different concurrent
 * branches.
 *
 * In many task end user will need to track several execution branches,
 * cancelling ones that did not win as soon as winner is found, e.g.
 * simultaneously waiting for callee to pick up and caller to hang up. To do
 * so, a cancellation token may be passed and activated, so parallel branch
 * may know if it's competitor has won.
 *
 * @see https://msdn.microsoft.com/en-us/library/system.threading.cancellationtoken.aspx
 *
 * @class
 *
 * @param {CancellationToken[]} [deps] Token dependencies
 * @param {string} [name] Optional token name
 */
function CancellationToken (deps, name) {
  var future = new Future()
  var flag = false
  var self = this
  var loggerName = 'ama-team.voxengine-sdk.concurrent.cancellation-token'
  var logger = Slf4j.create(loggerName)
  logger.attach('name', name)

  /**
   * @return {boolean}
   */
  this.isCancelled = function () { return flag }

  this.cancel = function () {
    logger.trace('Token has been cancelled')
    future.resolve()
    flag = true
  }

  /**
   * @function CancellationToken#then
   *
   * @param {Function}
   *
   * @return {Thenable}
   */
  this.then = future.then

  /**
   * Adds new dependency
   *
   * @param {CancellationToken} token
   */
  this.addDependency = function (token) { token !== self && token.then(self.cancel) }

  deps = deps || []
  deps.forEach(this.addDependency)
}

module.exports = {
  CancellationToken: CancellationToken
}
