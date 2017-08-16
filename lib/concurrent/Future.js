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
  // null = pending, true = fulfilled, false = rejected
  var status = null
  var identity
  var dependants = []

  function propagate () {
    // @see https://promisesaplus.com/#point-34
    // setTimeout is used because process.nextTick is not something one mocks
    setTimeout(function () {
      if (status === null) { return }
      dependants.forEach(function (callback) { callback(status, identity) })
      dependants = []
    }, 0)
  }

  function resolve (success, value) {
    if (status === null) {
      status = success
      identity = value
      propagate()
    }
    return self
  }

  /**
   * Resolves (fulfills) current instance with provided value
   *
   * @param {T} [value]
   * @returns {Future.<T>} Current instance
   */
  this.resolve = resolve.bind(this, true)

  /**
   * Rejects current instance with provided value
   *
   * @param {T} [value]
   * @returns {Future.<T>} Current instance
   */
  this.reject = resolve.bind(this, false)

  if (resolver) { resolver(this.resolve, this.reject) }

  this.fulfill = this.resolve

  /**
   * Standard then-implementation
   *
   * @param {Function} [onFulfill]
   * @param {Function} [onReject]
   * @returns {Future.<T>}
   */
  this.then = function (onFulfill, onReject) {
    onFulfill = onFulfill instanceof Function ? onFulfill : null
    onReject = onReject instanceof Function ? onReject : null
    if (!onFulfill && !onReject) { return self }
    var target = new Future()
    var callback = function (success, value) {
      var handler = success ? onFulfill : onReject
      if (!(handler instanceof Function)) {
        return success ? target.resolve(value) : target.reject(value)
      }
      try {
        var result = handler(value)
        var thenable = result && result.then
        thenable ? result.then(target.resolve) : target.resolve(result)
      } catch (e) {
        target.reject(value)
      }
    }
    dependants.push(callback)
    propagate()
    return target
  }

  this.getValue = function () { return identity }

  this.getStatus = function () { return status }

  this.toString = function () {
    var state = status === null ? 'pending' : (status ? 'resolved' : 'rejected')
    return 'Future <' + state + (identity ? ':' + identity : '') + '>'
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
 * @param {*} [value]
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
