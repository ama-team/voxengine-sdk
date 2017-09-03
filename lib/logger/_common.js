/**
 * @module logger/_common
 */

/**
 * @enum
 * @readonly
 */
var Level = require('./Level').Level

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
   * @param {TreeNode<V>} child Child value
   * @return {TreeNode<V>} Returns added child
   */
  this.addChild = function (name, child) {
    children[name] = child
    return child
  }

  /**
   * Removes child
   *
   * @param {string} name Child name
   * @return {TreeNode<V>|null} Removed child value
   */
  this.removeChild = function (name) {
    var value = children[name]
    delete children[name]
    return value || null
  }

  /**
   * Fetches current node child by it's name.
   *
   * @param {string} name Child name.
   *
   * @return {TreeNode.<V>|null} Existing node or nothing.
   */
  this.child = function (name) { return children[name] || null }

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
  this.get = function () { return typeof value === 'undefined' ? null : value }

  /**
   * Retrieves node at path
   *
   * @param {string[]} path
   * @return {TreeNode<V>|null}
   */
  this.traverse = function (path) {
    if (path.length === 0) {
      return this
    }
    var name = path.shift()
    var cursor = this
    while (name && cursor) {
      cursor = cursor.child(name)
      name = path.shift()
    }
    return cursor || null
  }

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
    var name = path.shift()
    while (name) {
      cursor = cursor.child(name)
      if (!cursor) {
        break
      }
      branch.push(cursor)
      name = path.shift()
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
    var name = path.shift()
    while (name) {
      if (!cursor.child(name)) {
        cursor.addChild(name, new TreeNode(null))
      }
      cursor = cursor.child(name)
      name = path.shift()
    }
    return cursor.set(value)
  }

  /**
   * Fetches value closest to provided path. If node contains falsey value, it
   * is skipped.
   *
   * @param {string[]} path Path to pick the branch.
   * @return {V|null} Target value or null
   */
  this.retrieve = function (path) {
    return self.branch(path).reverse().reduce(function (carrier, node) {
      return carrier || node.get()
    }, null)
  }

  /**
   * Removes node at path and returns it's value
   * @param {string[]} path
   * @return {V|undefined}
   */
  this.remove = function (path) {
    if (path.length === 0) {
      throw new Error('You can\'t remove root node')
    }
    var segment = path.pop()
    var node = this.traverse(path)
    var child = node ? node.removeChild(segment) : null
    return child ? child.get() : null
  }
}

/**
 * This class acts as a structured closure in which logger may operate.
 *
 * It encloses logger settings - currently writer and threshold - for every
 * specified package, so loggers refer to context they were associated in to
 * find their settings, and end user may configure any logger he wants without
 * knowing about those loggers (unless particular level has been associated
 * with particular logger - in that case end user has to override it directly).
 *
 * @class
 * @template T
 * @implements ILoggerContext.<T>
 *
 * @param {Level} [lvl] Root threshold, {@see Level.Info} by default
 * @param {IWritable} [writer]
 */
function Context (lvl, writer) {
  var self = this
  var writers
  var levels

  function reset (lvl, writer) {
    writers = new TreeNode(writer)
    levels = new TreeNode(Level.find(lvl) || Level.Info)
  }

  reset(lvl, writer)

  this.reset = reset

  function path (name) {
    return (name || '').toString().split('.').filter(function (_) { return _ })
  }

  this.path = path

  /**
   * Retrieves level for provided logger
   *
   * @param {string} name
   * @return {Level}
   */
  this.getLevel = function (name) { return levels.retrieve(path(name)) }

  /**
   * Retrieves level for provided logger
   *
   * @deprecated
   *
   * @param {string} name
   * @return {Level}
   */
  this.getThreshold = this.getLevel

  /**
   * Sets level for specified logger
   *
   * @param {string} [name]
   * @param {Level} lvl
   */
  this.setLevel = function (name, lvl) {
    if (!lvl) {
      lvl = name
      name = null
    }
    levels.put(path(name), Level.find(lvl))
    return self
  }

  /**
   * Sets level for specified logger
   *
   * @deprecated
   *
   * @param {string} [name]
   * @param {Level} level
   */
  this.setThreshold = this.setLevel

  /**
   * Removes and returns level at provided path
   *
   * @param {string} name
   * @return {Level|undefined}
   */
  this.removeLevel = function (name) {
    var segments = path(name)
    if (segments.length === 0) {
      throw new Error('You can\'t remove default writer')
    }
    return levels.remove(segments)
  }

  /**
   * @param {string} name
   *
   * @return {IWritable}
   */
  this.getWriter = function (name) { return writers.retrieve(path(name)) }

  /**
   * @param {string} [name] Logger name
   * @param {IWritable} writer
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
   * Removes and returns writer under provided path
   *
   * @throws If attempted to remove root writer
   *
   * @param {string} name
   * @return {IWritable|undefined}
   */
  this.removeWriter = function (name) {
    var segments = path(name)
    if (segments.length === 0) {
      throw new Error('You can\'t remove default writer')
    }
    return writers.remove(segments)
  }

  /**
   * @abstract
   * @function Context#create
   * @param {string} name
   * @param {Level} [threshold]
   * @param {IWritable} [writer]
   * @return {T}
   */
}

/**
 * @namespace
 */
module.exports = {
  Level: Level,
  Context: Context,
  TreeNode: TreeNode
}
