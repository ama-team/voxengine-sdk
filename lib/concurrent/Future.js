var Race = require('./Race').Race

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
  Resolving: 1,
  Rejected: 2,
  Fulfilled: 3
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

  this.getValue = function () { return identity }

  this.getStatus = function () { return status }

  this.hasStatus = function (s) { return status === s }

  this.isPending = function () { return self.hasStatus(Status.Pending) }
  this.isFulfilled = function () { return self.hasStatus(Status.Fulfilled) }
  this.isRejected = function () { return self.hasStatus(Status.Rejected) }
  this.isResolved = function () {
    return status === Status.Fulfilled || status === Status.Rejected
  }

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
    if (!self.isResolved()) { return }
    var staged = queue
    queue = []
    staged.forEach(function (callback) {
      callback(status, identity)
    })
  }

  function setIdentity (nextStatus, value) {
    if (self.isResolved()) { return }
    status = nextStatus
    identity = value
    schedulePropagation()
  }

  var fulfill = setIdentity.bind(self, Status.Fulfilled)
  var reject = setIdentity.bind(self, Status.Rejected)

  function resolve (nextStatus, value) {
    if (!self.isPending()) { return self }
    extendedResolutionProcedure(nextStatus, value)
    return self
  }

  /**
   * Resolves (fulfills) current instance with provided value
   *
   * @param {T} [value]
   * @returns {Future.<T>} Current instance
   */
  this.fulfill = resolve.bind(this, Status.Fulfilled)

  this.resolve = this.fulfill

  /**
   * Rejects current instance with provided value
   *
   * @param {T} [value]
   * @returns {Future.<T>} Current instance
   */
  this.reject = resolve.bind(this, Status.Rejected)

  if (resolver) { resolver(this.resolve, this.reject) }

  /**
   * @param x
   */
  function promiseResolutionProcedure (x) {
    if (self.isResolved()) { return }
    status = Status.Resolving
    if (x === self) {
      var message = 'Can\'t resolve promise with itself'
      return setIdentity(Status.Rejected, new TypeError(message))
    }
    if (x instanceof Future && x.isResolved()) {
      return extendedResolutionProcedure(x.getStatus(), x.getValue())
    }
    if (!x || (typeof x !== 'function' && typeof x !== 'object')) {
      return fulfill(x)
    }
    var race = new Race(1)
    var resolvePromise = race.racer(promiseResolutionProcedure)
    var rejectPromise = race.racer(reject)
    try {
      var then = x.then
      if (typeof then !== 'function') { return fulfill(x) }
      then.call(x, resolvePromise, rejectPromise)
    } catch (e) {
      rejectPromise(e)
    }
  }

  function extendedResolutionProcedure (status, x) {
    status === Status.Rejected ? reject(x) : promiseResolutionProcedure(x)
    return self
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
        target.resolve(handler(value))
      } catch (e) {
        target.reject(e)
      }
    }
    queue.push(callback)
    schedulePropagation()
    return target
  }

  /**
   * Attaches current promise to provided thenable, accepting it's eventual
   * outcome.
   *
   * @param {Thenable} promise
   *
   * @return {Future}
   */
  this.wrap = function (promise) {
    promise.then(function (value) {
      self.fulfill(value)
    }, function (e) {
      self.reject(e)
    })
    return self
  }

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
 * @param {*} [value]
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
  return new Future().wrap(promise)
}

Future.Status = Status

module.exports = {
  Future: Future
}
