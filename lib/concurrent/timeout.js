/**
 * @class
 * @param {string} message
 */
function TimeoutException (message) {
  this.message = message || 'Timeout has exceeded'
  this.stack = (new Error()).stack
}

TimeoutException.prototype = Object.create(Error.prototype)
TimeoutException.prototype.name = 'TimeoutException'
TimeoutException.prototype.constructor = TimeoutException

/**
 * @param {Promise.<*>|Thenable.<*>} promise Promise to add time bound to
 * @param {int} [timeout] Timeout in milliseconds
 * @param {string} [message]
 * @return {Thenable.<*>}
 */
function timeout (promise, timeout, message) {
  if (typeof timeout !== 'number' || timeout < 0) {
    return promise
  }
  return new Promise(function (resolve, reject) {
    promise.then(resolve, reject)
    setTimeout(function () {
      message = message || 'Timeout of ' + timeout + ' ms has exceeded'
      reject(new TimeoutException(message))
    }, timeout)
  })
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
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      try {
        resolve(callback())
      } catch (e) {
        reject(e)
      }
    }, time)
  })
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
  return new Promise(function (resolve) {
    setTimeout(resolve, time)
  }).then(function () {
    return promise
  })
}

module.exports = {
  timeout: timeout,
  delay: delay,
  throttle: throttle,
  TimeoutException: TimeoutException
}
