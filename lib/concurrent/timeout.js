var Future = require('./Future').Future

/**
 * @class
 * @param {string} message
 */
function TimeoutException (message) {
  this.message = message || 'Timeout has exceeded'
  this.stack = (new Error()).stack
}

var _ = TimeoutException

_.prototype = Object.create(Error.prototype)
_.prototype.name = 'TimeoutException'
_.prototype.constructor = _

function CancellationException (message) {
  this.message = message || 'Promise has been cancelled'
  this.stack = (new Error()).stack
}

_ = CancellationException
_.prototype = Object.create(Error.prototype)
_.prototype.name = 'CancellationException'
_.prototype.constructor = _

/**
 * @interface ICancellablePromise
 * @template T
 * @extends Thenable.<T>
 */

/**
 * @function ICancellablePromise#cancel
 *
 * @param {boolean} [silent] Whether to cancel with CancellationException or
 * just pretend that nothing has happened
 *
 * @return ICancellablePromise The very same instance
 */

/**
 * @callback timeout~onTimeout
 *
 * @param {Function} resolve
 * @param {Function} reject
 */

/**
 * @param {Promise.<*>|Thenable.<*>} promise Promise to add time bound to
 * @param {int} [timeout] Timeout in milliseconds
 * @param {timeout~onTimeout|string} [callback] Callback to be run on timeout.
 *   If string is passed, it is used as a message in timeout exception.
 * @return {ICancellablePromise.<*>}
 */
function timeout (promise, timeout, callback) {
  if (typeof timeout !== 'number' || timeout < 0) {
    promise.cancel = function () { return promise }
    return promise
  }
  callback = callback || 'Timeout of ' + timeout + ' ms has exceeded'
  if (typeof callback === 'string') {
    var message = callback
    callback = function (_, reject) {
      reject(new TimeoutException(message))
    }
  }
  var wrapper = Future.wrap(promise)
  var bind = setTimeout(function () {
    callback(wrapper.resolve, wrapper.reject)
  }, timeout)
  var cancel = function (silent) {
    clearTimeout(bind)
    if (!silent) {
      wrapper.reject(new CancellationException())
    }
  }
  wrapper.then(cancel, cancel)
  wrapper.cancel = function (silent) {
    cancel(silent)
    return wrapper
  }
  return wrapper
}

/**
 * Delays processing of callback for specified time. If no callback is
 * given, returns empty promise that will resolve in specified time
 *
 * @param {int} time
 * @param {Function} [callback]
 *
 * @return {Thenable.<*>}
 */
function delay (time, callback) {
  callback = callback || function () {}
  var target = new Future()
  var resolve = function () {
    try {
      target.resolve(callback())
    } catch (e) {
      target.reject(e)
    }
  }
  var bind = setTimeout(resolve, time)
  target.cancel = function (silent) {
    clearTimeout(bind)
    silent ? resolve() : target.reject(new CancellationException())
    return target
  }
  return target
}

/**
 * Wraps given promise with another one which won't resolve earlier
 * than specified time.
 *
 * @param {Thenable.<*>} promise
 * @param {int} time Throttle time in milliseconds
 * @return {Thenable.<*>}
 */
function throttle (promise, time) {
  var delayed = delay(time)
  var target = delayed
    .then(function () {
      return promise
    })
  target.cancel = function (silent) {
    delayed.cancel(silent)
    return target
  }
  return target
}

module.exports = {
  timeout: timeout,
  delay: delay,
  throttle: throttle,
  TimeoutException: TimeoutException,
  CancellationException: CancellationException
}
