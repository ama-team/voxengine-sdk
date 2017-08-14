/**
 * @module logger/slf4j
 */

var C = require('./_common')
var Level = C.Level
var Threshold = C.Threshold
var levelOf = C.level
var toThreshold = C.threshold
var Context = C.Context

/**
 * @class Slf4j
 *
 * @param {string} [name] Logger name.
 * @param {Context} [context] Logger context.
 *
 * @implements IVarArgLogger
 */
function Slf4j (name, context) {
  if (!context) {
    context = DefaultContext
  }
  // backward compatibility for 0.1.x/0.2.x
  if (!(context instanceof Context)) {
    context = new Slf4j.Context(context, arguments[2])
  }
  var mdc = {}

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
    // noinspection EqualityComparisonWithCoercionJS
    return v != null && v.constructor === String ? v : JSON.stringify(v)
  }

  function log (level, pattern) {
    level = levelOf(level)
    if (toThreshold(level) < toThreshold(context.getLevel(name))) {
      return
    }
    var prefix = '[' + level.toUpperCase() + ']'
    if (name) {
      prefix += ' ' + name
    }
    var mdcPrefix = Object.keys(mdc).map(function (key) {
      return key + '=' + render(mdc[key])
    }).join(', ')
    if (mdcPrefix) {
      prefix += ' [' + mdcPrefix + ']'
    }
    var subs = [].slice.call(arguments, 2)
    context.getWriter(name).write(substitute(prefix + ': ' + pattern, subs))
  }

  // noinspection JSUnusedGlobalSymbols
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

  this.getWriter = function () { return context.getWriter(name) }

  this.setLevel = function (level) {
    context.setLevel(name, level)
    return this
  }

  this.getLevel = function () { return context.getLevel(name) }

  /**
   * @deprecated
   */
  this.setThreshold = this.setLevel

  /**
   * @deprecated
   */
  this.getThreshold = this.getLevel

  this.getContext = function () { return context }

  this.attach = function (name, value) { mdc[name] = value }

  this.detach = function (name) { delete mdc[name] }

  this.attachAll = function (values) { mdc = values }

  this.detachAll = function () { mdc = {} }

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

/**
 * @class
 * @extends {Context.<Slf4j>}
 */
Slf4j.Context = function () {
  Context.apply(this, arguments)
  var self = this
  /**
   * @param {string} name
   * @param {Level} [threshold]
   * @param {IWritable} [writer]
   * @return {Slf4j}
   */
  this.create = function (name, threshold, writer) {
    if (threshold) {
      self.setLevel(name, threshold)
    }
    if (writer) {
      self.setWriter(name, writer)
    }
    return new Slf4j(name, self)
  }
}
Slf4j.Context.prototype = Object.create(Context.prototype)
Slf4j.Context.constructor = Slf4j.Context

var DefaultContext = new Slf4j.Context()

/**
 * @function Slf4j.create
 * @param {string} name
 * @param {Level} [level]
 * @param {IWritable} [writer]
 * @return {Slf4j}
 */

/**
 * @function Slf4j.getWriter
 * @param {string} name
 * @return {IWritable}
 */

/**
 * @function Slf4j.setWriter
 * @param {string} name
 * @param {IWritable} writer
 * @return {ILoggerContext.<Slf4j>}
 */

/**
 * @function Slf4j.getLevel
 * @param {string} name
 * @return {Level}
 */

/**
 * @function Slf4j.setLevel
 * @param {string} name
 * @param {Level} level
 * @return {ILoggerContext.<Slf4j>}
 */

/**
 * @deprecated
 * @function Slf4j.getThreshold
 * @param {string} name
 * @return {Level}
 */

/**
 * @deprecated
 * @function Slf4j.setThreshold
 * @param {string} name
 * @param {Level} level
 * @return {ILoggerContext.<Slf4j>}
 */
Object.keys(DefaultContext).forEach(function (method) {
  Slf4j[method] = DefaultContext[method].bind(DefaultContext)
})

/**
 * @param {LoggerOptions} [options]
 * @param {String} [name] Default name to use in case options don't include it
 * @param {Context} [context] Default context
 * @param {Level} [level] Default logging level
 * @return {IVarArgLogger}
 */
Slf4j.factory = function (options, name, context, level) {
  options = options || {}
  if (options.instance) {
    return options.instance
  }
  context = options.context || context || Slf4j
  return context.create(options.name || name, level || options.level)
}

module.exports = {
  Slf4j: Slf4j,
  /** @deprecated */
  Context: Slf4j.Context,
  Level: Level
}
