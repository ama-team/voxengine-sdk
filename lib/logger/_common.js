/**
 * @module logger/_common
 */

/**
 * @enum
 * @readonly
 */
var Level = {
  All: 'ALL',
  Trace: 'TRACE',
  Debug: 'DEBUG',
  Notice: 'NOTICE',
  Info: 'INFO',
  Warn: 'WARN',
  Error: 'ERROR',
  Off: 'OFF'
}

var Threshold = {
  ALL: 1,
  TRACE: 2,
  DEBUG: 3,
  NOTICE: 4,
  INFO: 5,
  WARN: 6,
  ERROR: 7,
  OFF: 8
}

/**
 * Converts input to appropriate level
 *
 * @param {Level|Threshold|string} level
 * @return {Level}
 */
function level (level) {
  if (level) {
    for (var key in Threshold) {
      if (Threshold[key] === level || level.toString().toUpperCase() === key) {
        return key
      }
    }
  }
  return Level.All
}

/**
 * Converts unknown input into threshold
 *
 * @param {Level|Threshold|string} lvl
 * @return {Threshold}
 */
function threshold (lvl) {
  return Threshold[level(lvl)]
}

/**
 * @callback Writer
 *
 * @param {string} message Message to write
 */

/**
 * @function Writable#write
 * @param {String} message Message to write
 */

/**
 * Logger of this kind simply substitute all replace markers in pattern with supplied positional arguments, e.g.:
 *
 * logger.error('{} has {}', 'admin', 'kicked me out of steam server') =>
 *   '[ERROR] admin has kicked me out of steam server'
 *
 * @interface VarArgLogger
 */

/**
 * @function VarArgLogger#log
 *
 * @param {Level} level Log level
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {...object} parameters List of pattern parameters
 */

/**
 * @function VarArgLogger#trace
 *
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {...object} parameters List of pattern parameters
 */

/**
 * @function VarArgLogger#debug
 *
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {...object} parameters List of pattern parameters
 */

/**
 * @function VarArgLogger#notice
 *
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {...object} parameters List of pattern parameters
 */

/**
 * @function VarArgLogger#info
 *
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {...object} parameters List of pattern parameters
 */

/**
 * @function VarArgLogger#warn
 *
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {...object} parameters List of pattern parameters
 */

/**
 * @function VarArgLogger#error
 *
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {...object} parameters List of pattern parameters
 */

/**
 * This kind of logger takes an object as an argument to message and substitutes replace tokens using parameter names
 * specified in those markers, e.g.:
 *
 * logger.error('{name} has {action}', {name: 'admin', action: 'kicked me out of steam server'}) =>
 *   '[ERROR] admin has kicked me out of steam server'
 *
 * @interface ParameterLogger
 * @deprecated Use ParameterLogger that will supersede this one next release
 */

/**
 * @interface ParameterLogger
 * @extends ParameterLogger
 */

/**
 * @function ParameterLogger#log
 *
 * @param {Level} level Log level
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {object} parameters Pattern parameters object
 */

/**
 * @function ParameterLogger#trace
 *
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {object} parameters Pattern parameters object
 */

/**
 * @function ParameterLogger#debug
 *
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {object} parameters Pattern parameters object
 */

/**
 * @function ParameterLogger#notice
 *
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {object} parameters Pattern parameters object
 */

/**
 * @function ParameterLogger#info
 *
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {object} parameters Pattern parameters object
 */

/**
 * @function ParameterLogger#warn
 *
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {object} parameters Pattern parameters object
 */

/**
 * @function ParameterLogger#error
 *
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {object} parameters Pattern parameters object
 */

/**
 * @interface ParameterLoggerFactory
 */

/**
 * @function ParameterLoggerFactory#create
 *
 * @param {string} name
 *
 * @return {ParameterLogger}
 */

/**
 * @function ParameterLoggerFactory#setWriter
 *
 * @param {Writable} writer
 */

/**
 * @function ParameterLoggerFactory#setThreshold
 *
 * @param {Level} threshold
 */

/**
 * @interface VarArgLoggerFactory
 */

/**
 * @function VarArgLoggerFactory#create
 *
 * @param {string} name
 *
 * @return {VarArgLogger}
 */

/**
 * @function VarArgLoggerFactory#setWriter
 *
 * @param {Writable} writer
 */

/**
 * @function VarArgLoggerFactory#setThreshold
 *
 * @param {Level} threshold
 */

/**
 * This class represents basic tree branch consisting of a node and (optionally)
 * child nodes. It is created with sole purpose to provide easy support for
 * package hierarchy tooling, so `ama-team.voxengine` would be presented as node
 * (root) -> (ama-team) -> (voxengine), and it's properties would be stored as
 * trees, allowing easy and configurable overlapping.
 *
 * @class
 *
 * @template {V} Wrapped value type
 *
 * @param {V|null} value Initial value
 */
function TreeNode (value) {
  var self = this
  /**
   * @template {V}
   * @typedef {Object.<string, TreeNode<V>>}
   */
  var children = {}

  /**
   * Adds new child to current node.
   *
   * @param {string} name Child name
   * @param {TreeNode<V>} child Child itself
   * @return {TreeNode<V>} Returns added child
   */
  this.add = function (name, child) {
    children[name] = child
    return child
  }

  /**
   * Sets value for current node.
   *
   * @param {V} v
   * @return {TreeNode} Returns current instance.
   */
  this.set = function (v) {
    value = v
    return self
  }

  /**
   * Returns current node value.
   *
   * @return {V}
   */
  this.get = function () { return value || null }

  /**
   * Fetches current node child by it's name.
   *
   * @param {string} name Child name.
   *
   * @return {TreeNode.<V>|undefined} Existing node or nothing.
   */
  this.child = function (name) { return children[name] }

  /**
   * Picks branch as a list of nodes (starting from the root) that match
   * requested path the most. In the best case, branch would contain root and
   * all requested nodes, in the worst - branch would consist of root only.
   *
   * @param {string[]} path Branch path as list of child names.
   * @return {[TreeNode<V>]} Picked branch.
   */
  this.branch = function (path) {
    var branch = [self]
    var cursor = self
    var name
    while (name = path.shift()) {
      cursor = cursor.child(name)
      if (!cursor) break
      branch.push(cursor)
    }
    return branch
  }

  /**
   * Puts provided value at designated path down the tree.
   *
   * @param {string[]} path Path at which value has to be set.
   * @param {V} value Value to be set.
   * @return {TreeNode<V>} Created or updated node.
   */
  this.put = function (path, value) {
    var cursor = self
    var name
    while (name = path.shift()) {
      if (!cursor.child(name)) cursor.add(name, new TreeNode(null))
      cursor = cursor.child(name)
    }
    return cursor.set(value)
  }

  /**
   * Fetches value closest to provided path. If node contains falsey value, it
   * is skipped.
   *
   * @param {string} path Path to pick the branch.
   * @return {V|null} Target value or null
   */
  this.retrieve = function (path) {
    return self.branch(path).reverse().reduce(function (carrier, node) {
      return carrier ? carrier : node.get()
    }, null)
  }
}

/**
 * @namespace
 */
module.exports = {
  Level: Level,
  Threshold: Threshold,
  level: level,
  threshold: threshold,
  TreeNode: TreeNode
}
