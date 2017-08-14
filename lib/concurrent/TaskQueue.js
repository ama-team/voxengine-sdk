var timeout = require('./timeout').timeout
var Future = require('./Future').Future
var Slf4j = require('../logger/slf4j').Slf4j

function RejectionException (message) {
  this.message = message || 'Task has been rejected'
  this.stack = (new Error()).stack
}

RejectionException.prototype = Object.create(Error.prototype)
RejectionException.prototype.constructor = RejectionException
RejectionException.prototype.name = 'RejectionException'

/**
 * @typedef {Object} TaskQueue~Options
 *
 * @property {LoggerOptions} logger
 * @property {string} [name] Queue name
 */

/**
 * @typedef {Object} TaskQueue~TaskOptions
 *
 * @property {int} [timeout]
 * @property {string} [name]
 */

/**
 * @typedef {Object} TaskQueue~Task
 *
 * @property {int} id
 * @property {Function} factory
 * @property {int} timeout
 * @property {Promise.<*>|Thenable.<*>} completion
 * @property {string} name
 */

/**
 * @typedef {Object} TaskQueue~Statistics
 *
 * @property {int} enqueued
 * @property {int} completed
 * @property {int} successful
 * @property {int} discarded
 * @property {int} rejected
 */

/**
 * Task queue that allows sequential task processing.
 *
 * @class
 * @param {TaskQueue~Options} [options]
 */
function TaskQueue (options) {
  options = options || {}

  var queue = []

  var enqueued = 0
  var completed = 0
  var successful = 0
  var rejected = 0
  var discarded = 0

  var paused = true
  var closed = false
  var termination = new Future()
  /**
   * @type {TaskQueue~Task|null}
   */
  var current = null

  var logger = Slf4j.factory(options.logger, 'ama-team.voxengine-sdk.concurrent.task-queue')

  function setName (name) {
    logger.attach('name', name)
  }

  /**
   * Sets queue name which will turn up in logs.
   *
   * @function TaskQueue#setName
   *
   * @param {string} name
   */
  this.setName = setName

  if (options.name) {
    setName(options.name)
  }

  /**
   * Executed provided task
   *
   * @param {TaskQueue~Task} task
   */
  function execute (task) {
    try {
      return timeout(Promise.resolve(task.factory()), task.timeout)
    } catch (e) {
      return Promise.reject(e)
    }
  }

  /**
   * Handler to be run after task has been fulfilled.
   *
   * @param {*} value
   */
  function taskFulfillmentHandler (value) {
    logger.debug('Task "{}", #{} has completed successfully', current.name,
      current.id)
    completed++
    successful++
    current.completion.resolve(value)
  }

  /**
   * Handler to be run after task has been rejected
   *
   * @param {Error|*} error
   */
  function taskRejectionHandler (error) {
    completed++
    logger.debug('Task "{}", #{} has rejected with {}', current.name,
      current.id, (error && error.name ? error.name : error))
    current.completion.reject(error)
  }

  /**
   * Cleanup handler to be run after task has been handled
   */
  function postCompletionHook () {
    current = null
    if (closed && queue.length === 0) {
      termination.resolve()
    } else {
      proceed()
    }
  }

  /**
   * Pick up next task for processing, if necessary
   */
  function proceed () {
    if (paused || current || queue.length === 0) {
      return
    }
    current = queue.shift()
    logger.debug('Executing task "{}", #{}', current.name, current.id)
    execute(current)
      .then(taskFulfillmentHandler, taskRejectionHandler)
      .then(postCompletionHook)
  }

  /**
   * Adds new task to queue.
   *
   * @param {Function} factory Function representing task execution. It
   *   should return Promise if it relies on I/O.
   * @param {TaskQueue~TaskOptions} [options]
   * @return {Future.<*>}
   */
  this.push = function (factory, options) {
    if (closed) {
      rejected++
      var error = new RejectionException('Can\'t enqueue task: queue is closed')
      return Promise.reject(error)
    }
    options = options || {}
    enqueued++
    var task = {
      id: enqueued,
      name: options.name || 'Task #' + enqueued,
      factory: factory,
      timeout: options.timeout,
      completion: new Future()
    }
    logger.debug('Registering task "{}", #{}', task.name, task.id)
    queue.push(task)
    proceed()
    return task.completion
  }

  /**
   * Start processing
   *
   * @return {TaskQueue}
   */
  this.start = function () {
    logger.debug('Starting queue processing')
    paused = false
    proceed()
    return this
  }

  /**
   * Pause processing until #start() is called.
   *
   * @return {Promise.<*>|Thenable.<*>}
   */
  this.pause = function () {
    logger.debug('Pausing queue processing')
    paused = true
    return current ? current.completion : Promise.resolve()
  }

  this.isPaused = function () {
    return paused
  }

  this.isClosed = function () {
    return closed
  }

  function close () {
    logger.debug('Shutting down queue')
    closed = true
    var last = queue.length > 0 ? queue[queue.length - 1] : current
    if (last) {
      return last.completion.then(getStatistics, getStatistics)
    }
    return Promise.resolve(getStatistics())
  }

  /**
   * Abruptly terminates queue, discarding all tasks in queue
   *
   * @return {Promise.<TaskQueue~Statistics>}
   */
  this.terminate = function () {
    logger.debug('Terminating queue, discarding awaiting {} tasks',
      queue.length)
    discarded += queue.length
    while (queue.length > 0) {
      var task = queue.shift()
      logger.trace('Discarding task "{}", #{}', task.name, task.id)
    }
    return close()
  }

  /**
   * Closes queue for processing, waiting for all remaining tasks to
   * complete and then resolving returned promise.
   *
   * @function TaskQueue#close
   *
   * @return {Promise.<TaskQueue~Statistics>}
   */
  this.close = close

  function getStatistics () {
    return {
      enqueued: enqueued,
      completed: completed,
      successful: successful,
      rejected: rejected,
      discarded: discarded
    }
  }

  /**
   * @function TaskQueue#getStatistics
   *
   * @return {TaskQueue~Statistics}
   */
  this.getStatistics = getStatistics

  this.getLength = function () {
    return queue.length
  }
}

TaskQueue.started = function (options) {
  return new TaskQueue(options).start()
}

module.exports = {
  TaskQueue: TaskQueue,
  RejectionException: RejectionException
}
