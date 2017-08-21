var timeout = require('./timeout')
var TaskQueue = require('./TaskQueue')

module.exports = {
  Race: require('./Race').Race,
  Future: require('./Future').Future,
  CancellationToken: require('./CancellationToken').CancellationToken,
  TimeoutException: timeout.TimeoutException,
  CancellationException: timeout.CancellationException,
  TaskQueue: TaskQueue.TaskQueue,
  RejectionException: TaskQueue.RejectionException,
  timeout: timeout.timeout,
  delay: timeout.delay,
  throttle: timeout.throttle
}
