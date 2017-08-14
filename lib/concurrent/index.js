var timeout = require('./timeout')
var TaskQueue = require('./TaskQueue')

module.exports = {
  Future: require('./Future').Future,
  TimeoutException: timeout.TimeoutException,
  TaskQueue: TaskQueue.TaskQueue,
  RejectionException: TaskQueue.RejectionException,
  timeout: timeout.timeout,
  delay: timeout.delay,
  throttle: timeout.throttle
}
