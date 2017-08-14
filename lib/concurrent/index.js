var timeout = require('./timeout')

module.exports = {
  Future: require('./Future').Future,
  TimeoutException: timeout.TimeoutException,
  timeout: timeout.timeout
}
