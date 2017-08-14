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
 * @param {int} timeout Timeout in milliseconds
 * @param {string} message
 * @return {Thenable.<*>}
 */
function timeout (promise, timeout, message) {
  if (timeout < 0) {
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

module.exports = {
  timeout: timeout,
  TimeoutException: TimeoutException
}
