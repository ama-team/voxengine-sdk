/**
 * @callback Future~resolver
 *
 * @param {Function} resolve
 * @param {Function} reject
 */

/**
 * This is a very standard promise interface implementation, but with ability
 * to be externally completed or cancelled by `#resolve()` and `#reject()`
 * methods.
 *
 * It is named after Java's CompletableFuture.
 *
 * @class
 * @template T
 *
 * @param {Future~resolver} [resolver] Standard promise resolver
 */
function Future (resolver) {
  var self = this
  var fulfiller
  var rejector
  var container = new Promise(function (resolve, reject) {
    if (resolver) {
      resolver(resolve, reject)
    }
    fulfiller = resolve
    rejector = reject
  })

  /**
   * Rejects current instance with provided value
   *
   * @param {T} [value]
   * @returns {Future.<T>} Current instance
   */
  this.reject = function (value) {
    rejector(value)
    return self
  }

  /**
   * Resolves (fulfills) current instance with provided value
   *
   * @param {T} [value]
   * @returns {Future.<T>} Current instance
   */
  this.resolve = function (value) {
    fulfiller(value)
    return self
  }

  this.fulfill = this.resolve

  /**
   * Standard then-implementation
   *
   * @param {Function} [fulfillmentHandler]
   * @param {Function} [rejectionHandler]
   * @returns {Future.<T>}
   */
  this.then = function (fulfillmentHandler, rejectionHandler) {
    return Future.wrap(container.then(fulfillmentHandler, rejectionHandler))
  }
}

/**
 * Returns promise that awaits all passed promises.
 *
 * @param {Array.<Promise.<*>|Thenable<*>>} promises
 * @returns {Future.<*>}
 */
Future.all = function (promises) {
  return Future.wrap(Promise.all(promises))
}

/**
 * Returns result of first resolved promise, be it fulfillment or rejection
 *
 * @param {Array.<Promise.<*>|Thenable<*>>} promises
 * @returns {Future.<*>}
 */
Future.race = function (promises) {
  return Future.wrap(Promise.race(promises))
}

/**
 * Returns resolved promise.
 *
 * @param {*} value
 * @returns {Future.<*>}
 */
Future.resolve = function (value) {
  return new Future().resolve(value)
}

/**
 * Returns rejected promise.
 *
 * @param {*} value
 * @returns {Future.<*>}
 */
Future.reject = function (value) {
  return new Future().reject(value)
}

/**
 * Wraps given promise in a Future, giving user code an option
 * to reject/resolve it.
 *
 * @param {Promise.<*>|Thenable.<*>} promise
 * @returns {Future.<*>}
 */
Future.wrap = function (promise) {
  return new Future(promise.then.bind(promise))
}

module.exports = {
  Future: Future
}
