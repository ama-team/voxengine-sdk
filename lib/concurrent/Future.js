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
  var queue = []

  function schedulePropagation () {
    // if already scheduled
    if (propagation) { return }
    // @see https://promisesaplus.com/#point-34
    // setTimeout is used because process.nextTick is not something one mocks
    propagation = setTimeout(function () {
      propagation = null
      propagate()
    }, 0)
  }

  function propagate () {
    if (status === Status.Pending) { return }
    var staged = queue
    queue = []
    staged.forEach(function (callback) {
      callback(status, identity)
    })
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
   * @param {Future} promise
   * @param x
   */
  function promiseResolutionProcedure (promise, x) {
    if (promise.isResolved()) { return }
    if (x === promise) {
      var message = 'Can\'t resolve promise with itself'
      return promise.reject(new TypeError(message))
    }
    if (x instanceof Future) {
      if (x.isRejected()) { return promise.reject(x.getValue()) }
      if (x.isFulfilled()) { return promise.resolve(x.getValue()) }
    }
    if (!x || (typeof x !== 'function' && typeof x !== 'object')) {
      return promise.resolve(x)
    }
    try {
      var then = x.then
      if (typeof then !== 'function') { return promise.resolve(x) }
      then.call(x, function resolvePromise (y) {
        promiseResolutionProcedure(promise, y)
      }, function rejectPromise (r) {
        promise.reject(r)
      })
    } catch (e) {
      promise.reject(e)
    }
  }

  /**
   * Standard then-implementation
   *
   * @param {Function} [onFulfill]
   * @param {Function} [onReject]
   * @returns {Future.<T>}
   */
  this.then = function (onFulfill, onReject) {
    if (typeof onFulfill !== 'function') { onFulfill = null }
    if (typeof onReject !== 'function') { onReject = null }
    if (!onFulfill && !onReject) { return self }
    onReject = onReject || function (error) { throw error }
    onFulfill = onFulfill || function (value) { return value }
    var target = new Future()
    var callback = function (status, value) {
      var handler = status === Status.Fulfilled ? onFulfill : onReject
      try {
        promiseResolutionProcedure (target, handler(value))
      } catch (e) {
        target.reject(e)
      }
    }
    queue.push(callback)
    schedulePropagation()
    return target
  }

  this.getValue = function () { return identity }

  this.getStatus = function () { return status }

  this.hasStatus = function (s) { return status === s }

  this.isPending = function () { return self.hasStatus(Status.Pending) }
  this.isFulfilled = function () { return self.hasStatus(Status.Fulfilled) }
  this.isRejected = function () { return self.hasStatus(Status.Rejected) }
  this.isResolved = function () { return !self.hasStatus(Status.Pending) }

  this.toString = function () {
    var state = Status.name(status)
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
