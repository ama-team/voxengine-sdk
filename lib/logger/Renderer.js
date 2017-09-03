var DefaultHandlers = [
  Object.prototype.toString,
  Array.prototype.toString,
  Function.prototype.toString,
  Error.prototype.toString
]

var Renderer = {
  /**
   * @param {*} value
   * @param {boolean} expanded Whether to return expanded or short representation
   * @return {string}
   */
  any: function (value, expanded) {
    var type = typeof value
    switch (type) {
      case 'function':
        return value.name ? '<Function: ' + value.name + '>' : '<Function>'
      case 'undefined':
        return '<undefined>'
      case 'number':
      case 'boolean':
      case 'string':
      case 'symbol':
        return value
    }
    return value instanceof Error ? Renderer.error(value, expanded) : Renderer.object(value, expanded)
  },
  /**
   * @param {Error} value
   * @param {boolean} expanded Whether to return expanded or short representation
   * @return {string}
   */
  error: function (value, expanded) {
    if (expanded) {
      return [Renderer.error(value, false), 'Stack:', value.stack].join('\r\n')
    }
    if (DefaultHandlers.indexOf(value.toString) === -1) {
      return '<' + value.toString() + '>'
    }
    return '<' + (value.name || '<unknown error>') + ': ' + (value.message || '<no message>') + '>'
  },
  /**
   * @param {object} value
   * @param {boolean} expanded Whether to return expanded or short representation
   * @return {string}
   */
  object: function (value, expanded) {
    if (value === null) {
      return '<null>'
    }
    if (typeof value.toString === 'function' && DefaultHandlers.indexOf(value.toString) === -1 && !expanded) {
      return value.toString()
    }
    return JSON.stringify(value)
  }
}

module.exports = {
  Renderer: Renderer
}
