var Future = require('./Future').Future

// TODO: use interfaces instead of direct cancellation token class references

/**
 * @class
 *
 * @param {CancellationToken[]} [deps]
 */
function CancellationToken (deps) {
  var future = new Future()
  var flag = false
  var self = this

  /**
   * @return {boolean}
   */
  this.isCancelled = function () { return flag }

  this.cancel = function () {
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
