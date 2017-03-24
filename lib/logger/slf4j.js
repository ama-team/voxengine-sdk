/**
 * @module logger/slf4j
 */

var _ = require('./_common')
var Level = _.Level
var Threshold = _.Threshold
var levelOf = _.level
var toThreshold = _.threshold
var Tree = _.TreeNode

/**
 * This class acts as a structured closure in which Slf4j logger may operate.
 *
 * It encloses logger settings - currently writer and threshold - for every
 * specified package, so loggers refer to context they were associated in to
 * find their settings, and end user may configure any logger he wants without
 * knowing about those loggers (unless particular level has been associated
 * with particular logger - in that case end user has to override it directly).
 *
 * @class
 *
 * @param {Level} [threshold] Root threshold, {@see Level.Info} by default
 * @param {Writable|Logger} [writer]
 */
function Context (threshold, writer) {
  var self = this
  var writers = new Tree(writer || Logger)
  var levels = new Tree(threshold || Level.Info)

  function path (name) {
    return (name || '').toString().split('.').filter(function (_) { return _ })
  }

  /**
   * Retrieves level for provided logger
   *
   * @param {string} name
   * @return {Level}
   */
  this.getThreshold = function (name) { return levels.retrieve(path(name)) }

  /**
   * Sets level for specified logger
   *
   * @param {string} [name]
   * @param {Level} level
   */
  this.setThreshold = function (name, level) {
    if (!level) {
      level = name
      name = null
    }
    levels.put(path(name), level)
    return self
  }

  /**
   * @param {string} name
   *
   * @return {Writable|Logger}
   */
  this.getWriter = function (name) { return writers.retrieve(path(name)) }

  /**
   * @param {string} [name] Logger name
   * @param {Writable|Logger} writer
   */
  this.setWriter = function (name, writer) {
    if (!writer) {
      writer = name
      name = null
    }
    writers.put(path(name), writer)
    return self
  }

  /**
   * @param {string} name
   * @param {Level} [threshold]
   * @param {Logger|Writable} [writer]
   * @return {Slf4j}
   */
  this.create = function (name, threshold, writer) {
    if (threshold) self.setThreshold(name, threshold)
    if (writer) self.setWriter(name, writer);
    name = path(name).join('.')
    return new Slf4j(name, self)
  }
}

var DefaultContext = new Context()

/**
 * @class Slf4j
 *
 * @param {string} [name] Logger name.
 * @param {Context} [context] Logger context.
 *
 * @implements VarArgLogger
 */
function Slf4j (name, context) {
  if (!context) context = DefaultContext
  // backward compatibility for 0.1.x/0.2.x
  if (!(context instanceof Context)) {
    context = new Context(context, arguments[2]);
  }
  var mdc = {};

  function substitute (pattern, substitutions) {
    var e = substitutions.filter(function (s) { return s instanceof Error })
    var o = substitutions.filter(function (s) { return !(s instanceof Error) })
    var s = o.reduce(function (carrier, s) {
      return carrier.replace('{}', render(s))
    }, pattern)

    return e.reduce(function (carrier, e) {
      return carrier + '\n' + renderException(e)
    }, s)
  }

  function renderException (e) {
    return e.name + ': ' + e.message + '\nStack:\n' + e.stack
  }

  function render (v) {
    v = typeof v === 'undefined' ? '{undefined}' : v
    return v != null && v.constructor === String ? v : JSON.stringify(v)
  }

  function log (level, pattern, _) {
    level = levelOf(level)
    if (toThreshold(level) >= toThreshold(context.getThreshold(name))) {
      var prefix = '[' + level.toUpperCase() + ']'
      if (name) prefix += ' ' + name
      var mdcPrefix = Object.keys(mdc).map(function (key) {
        return key + '=' + render(mdc[key])
      }).join(', ')
      if (mdcPrefix) prefix += ' [' + mdcPrefix + ']'
      return context.getWriter(name)
        .write(substitute(prefix + ': ' + pattern, [].slice.call(arguments, 2)))
    }
  }

  this.log = log

  for (var i = Threshold.TRACE; i <= Threshold.ERROR; i++) {
    this[levelOf(i).toLowerCase()] = (function (self, threshold) {
      return function () {
        log.apply(null, ([threshold].concat([].slice.call(arguments))))
      }
    })(this, i)
  }

  this.getName = function () { return name }

  this.setWriter = function (writer) {
    context.setWriter(name, writer)
    return this
  }
  
  this.setThreshold = function (level) {
    context.setThreshold(name, level)
    return this
  }

  this.getThreshold = function () { return context.getThreshold(name) }

  this.attach = function (name, value) { mdc[name] = value }

  this.detach = function (name) { delete mdc[name] }

  this.attachAll = function (values) { mdc = values }

  this.detachAll = function () { mdc = {} }

  this.getWriter = function () { return context.getWriter(name) }

  /**
   * @function Slf4j#trace
   * @param {string} pattern Logging pattern with `{}` as a place for substitution
   * @param {...object} parameters List of pattern parameters
   */

  /**
   * @function Slf4j#debug
   * @param {string} pattern Logging pattern with `{}` as a place for substitution
   * @param {...object} parameters List of pattern parameters
   */

  /**
   * @function Slf4j#notice
   * @param {string} pattern Logging pattern with `{}` as a place for substitution
   * @param {...object} parameters List of pattern parameters
   */

  /**
   * @function Slf4j#info
   * @param {string} pattern Logging pattern with `{}` as a place for substitution
   * @param {...object} parameters List of pattern parameters
   */

  /**
   * @function Slf4j#warn
   * @param {string} pattern Logging pattern with `{}` as a place for substitution
   * @param {...object} parameters List of pattern parameters
   */

  /**
   * @function Slf4j#error
   * @param {string} pattern Logging pattern with `{}` as a place for substitution
   * @param {...object} parameters List of pattern parameters
   */
}

Object.keys(DefaultContext).forEach(function (method) {
  Slf4j[method] = DefaultContext[method].bind(DefaultContext)
})

module.exports = {
  Slf4j: Slf4j,
  Context: Context,
  /** @deprecated */
  Factory: Context,
  Level: Level
}
