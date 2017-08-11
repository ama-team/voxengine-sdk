/**
 * @module http/_common
 */

var Schema = require('./_schema')

/**
 * Simple inheritance establisher
 *
 * @param parent
 * @param child
 * @param name
 */
function extend (parent, child, name) {
  child.prototype = Object.create(parent.prototype)
  child.prototype.constructor = child
  child.prototype.name = name
}

function NetworkException (message, code, request) {
  this.message = message || this.message
  this.code = code || this.code
  this.request = request
  this.stack = new Error().stack
}
// poor man's byte economy
var N = NetworkException
extend(Error, N, 'NetworkException')
N.prototype.code = -1
N.prototype.message = 'Unexpected exception during request'

var index = {
  '-1': N
}

/**
 * @class {IllegalUrlException}
 *
 * @property {string} message
 * @property {int} code
 */

/**
 * @class {MissingHostException}
 *
 * @property {string} message
 * @property {int} code
 */

/**
 * @class {ConnectionErrorException}
 *
 * @property {string} message
 * @property {int} code
 */

/**
 * @class {RedirectVortexException}
 *
 * @property {string} message
 * @property {int} code
 */

/**
 * @class {NetworkErrorException}
 *
 * @property {string} message
 * @property {int} code
 */

/**
 * @class {TimeoutException}
 *
 * @property {string} message
 * @property {int} code
 */

/**
 * @class {VoxEngineErrorException}
 *
 * @property {string} message
 * @property {int} code
 */

/**
 * @namespace
 *
 * @property {Function} IllegalUrlException
 * @property {Function} MissingHostException
 * @property {Function} ConnectionErrorException
 * @property {Function} RedirectVortexException
 * @property {Function} NetworkErrorException
 * @property {Function} TimeoutException
 * @property {Function} VoxEngineErrorException
 */
var exports = {
  NetworkException: N,
  codeExceptionIndex: index,
  Method: Schema.Method
}

function declare (name, code, message) {
  var e = function () {
    N.apply(this, arguments)
  }
  extend(N, e, name)
  e.prototype.constructor = e
  e.prototype.code = e.code = code
  e.prototype.message = message
  exports[name] = e
  index[code] = e
}

declare('IllegalUrlException', -2, 'Illegal URL exception')
declare('MissingHostException', -3, 'Could not find host')
declare('ConnectionErrorException', -4, 'Could not establish connection')
declare('RedirectVortexException', -5, 'Too many redirects')
declare('NetworkErrorException', -6, 'Network error exception')
declare('TimeoutException', -7, 'Request timeout exceeded')
declare('VoxEngineErrorException', -8, 'Internal exception during request')

function HttpException (message, request, response) {
  this.message = message
  this.request = request
  this.response = response
  this.stack = new Error().stack
}
extend(Error, HttpException, 'HttpException')
exports.HttpException = HttpException

function ServerErrorException () {
  HttpException.apply(this, arguments)
}
extend(HttpException, ServerErrorException, 'ServerErrorException')
exports.ServerErrorException = ServerErrorException

function ClientErrorException () {
  HttpException.apply(this, arguments)
}
extend(HttpException, ClientErrorException, 'ClientErrorException')
exports.ClientErrorException = ClientErrorException

function NotFoundException () {
  HttpException.apply(this, arguments)
}
extend(HttpException, NotFoundException, 'NotFoundException')
exports.NotFoundException = NotFoundException

function InvalidConfigurationException (message) {
  this.message = message || 'Invalid configuration'
  this.stack = new Error().stack
}
extend(Error, InvalidConfigurationException, 'InvalidConfigurationException')
exports.InvalidConfigurationException = InvalidConfigurationException

function normalize (bag) {
  bag = bag || {}
  Object.keys(bag).forEach(function (key) {
    if (!(bag[key] instanceof Array)) bag[key] = [bag[key]]
  })
  return bag
}

/** @deprecated */
exports.Params = {
  normalize: normalize
}

exports.Query = {
  /**
   * Encodes provided query to a url-safe string
   *
   * @param {Query} query
   * @returns {string}
   */
  encode: function (query) {
    query = normalize(query || {})
    return Object.keys(query).reduce(function (carrier, key) {
      return carrier.concat(query[key].map(function (value) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(value)
      }))
    }, []).join('&')
  },
  normalize: normalize
}

exports.Headers = {
  /**
   * Encodes headers object to VoxEngine / protocol presentation
   *
   * @param {Headers} headers
   * @returns {string[]}
   */
  encode: function (headers) {
    headers = normalize(headers || {})
    return Object.keys(headers).reduce(function (_, k) {
      return _.concat(headers[k].map(function (v) {
        return k + ': ' + v
      }))
    }, [])
  },
  /**
   * Headers in VoxImplant come in key-value pairs:
   *
   * - key: Server
   *   value: nginx/1.9.9
   * - key: Link
   *   value: Wed, 09 Aug 2017 18:16:58 GMT
   * - key: Link
   *   value: <https://voximplant.com/>; rel="home"
   * - key: Link
   *   value: <https://voximplant.com/docs>; rel="documentation"
   *
   * ([reference](http://voximplant.com/docs/references/appengine/Net.HttpRequestResult.html))
   *
   * This method converts such pairs into an object with headers collected by
   * their key:
   *
   * Server:
   *   - nginx/1.9.9
   * Link:
   *   - <https://voximplant.com/>; rel="home"
   *   - <https://voximplant.com/docs>; rel="documentation"
   *
   * @param {Object[]} headers
   * @return {Headers}
   */
  decode: function (headers) {
    return (headers || []).reduce(function (carrier, item) {
      carrier[item.key] = carrier[item.key] || []
      carrier[item.key].push(item.value)
      return carrier
    }, {})
  },

  /**
   * Merges two or more headers definitions, using latter's values on
   * intersecting keys.
   *
   * @param {...Headers} args
   * @returns {Headers}
   */
  override: function (args) {
    return []
      .filter.call(arguments, function (_) { return _ })
      .reduce(function (carrier, _) {
        Object.keys(_).forEach(function (key) { carrier[key] = _[key] })
        return carrier
      }, {})
  },
  normalize: normalize
}

/** @deprecated */
exports.Headers.merge = exports.Headers.override
/** @deprecated */
exports.headers = exports.Headers
/** @deprecated */
exports.query = exports.Query
/** @deprecated */
exports.params = exports.Params
module.exports = exports
