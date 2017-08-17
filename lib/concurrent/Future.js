/**
 * @callback Future~resolver
 *
 * @param {Function} resolve
 * @param {Function} reject
 */

/**
 * @enum
 * @readonly
 */
var Status = {
  Pending: 0,
  Rejected: 1,
  Fulfilled: 2
}

Status.name = function (value) {
  return Object.keys(Status).reduce(function (carrier, key) {
    return carrier || (Status[key] === value ? key : null)
  }, null)
}

/**
 * This is a very standard promise interface implementation, but with ability
 * to be externally completed or cancelled by `#resolve()` and `#reject()`
 * methods.
 *
 * It is named after Java's CompletableFuture.
 *
 * **NB:** this implementation doesn't account for cyclic references (which are
 * tremendously easy to implement).
 *
 * @class
 * @template T
 *
 * @param {Future~resolver} [resolver] Standard promise resolver
 */
function Future (resolver) {
  var self = this
  var status = Status.Pending
  var identity
  var propagation = null
  var source = null
  var dependants = []
  var consumers = []

  function schedulePropagation () {
    // if already scheduled
    if (propagation) { return }
    // @see https://promisesaplus.com/#point-34
    // setTimeout is used because process.nextTick is not something one mocks
    propagation = setTimeout(function () {
      propagation = null
      if (status === Status.Pending) { return }
      var staged = dependants
      dependants = []
      staged.forEach(function (callback) {
        callback(status, identity)
      })
    }, 0)
  }

  function setIdentity (nextStatus, value) {
    if (status !== Status.Pending) { return }
    status = nextStatus
    identity = value
    schedulePropagation()
  }

  function resolve (nextStatus, value) {
    if (status !== Status.Pending) { return self }
    setIdentity(nextStatus, value)
    return self
  }

  /**
   * Resolves (fulfills) current instance with provided value
   *
   * @param {T} [value]
   * @returns {Future.<T>} Current instance
   */
  this.resolve = resolve.bind(this, Status.Fulfilled)

  this.fulfill = this.resolve

  /**
   * Rejects current instance with provided value
   *
   * @param {T} [value]
   * @returns {Future.<T>} Current instance
   */
  this.reject = resolve.bind(this, Status.Rejected)

  if (resolver) { resolver(this.resolve, this.reject) }

  /**
   * Standard then-implementation
   *
   * @param {Function} [onFulfill]
   * @param {Function} [onReject]
   * @returns {Future.<T>}
   */
  this.then = function (onFulfill, onReject) {
    if (!(onFulfill instanceof Function)) { onFulfill = null }
    if (!(onReject instanceof Function)) { onReject = null }
    if (!onFulfill && !onReject) { return self }
    onReject = onReject || function (error) { throw error }
    onFulfill = onFulfill || function (value) { return value }
    var target = new Future()
    var callback = function (status, value) {
      var handler = status === Status.Fulfilled ? onFulfill : onReject
      try {
        var derived = handler(value)
        if (derived === self || derived === target) {
          var message = 'Can\'t resolve promise with itself'
          return target.reject(new TypeError(message))
        }
        if (derived && derived.then) {
          return derived.then(function (value) {
            target.resolve(value)
          }, function (error) {
            target.reject(error)
          })
        }
        target.resolve(derived)
      } catch (e) {
        target.reject(e)
      }
    }
    dependants.push(callback)
    schedulePropagation()
    return target
  }

  this.getValue = function () { return identity }

  this.getStatus = function () { return status }

  this.setSource = function (_) { source = _ }

  this.toString = function () {
    var state = Status.name(status)
    return 'Future <' + state + (identity ? ':' + identity : '') + '>'
  }

  this.getState = function () {
    return {
      dependants: dependants.slice(),
      status: status,
      state: Status.name(status),
      value: identity,
      propagationScheduled: !!propagation,
      source: source,
      consumers: consumers
    }
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
  return new Future(function (resolve, reject) {
    // silencing unhandled promise rejection
    promise.then(resolve, reject).then(null, function () {})
  })
}

Future.Status = Status

Future.debugMode = false

module.exports = {
  Future: Future
}
