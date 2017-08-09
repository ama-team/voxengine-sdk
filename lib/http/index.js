var _ = require('./_common')
var exports = {}

// todo write jsdoc describing exports
Object.keys(_).forEach(function (k) {
  exports[k] = _[k]
})
exports.basic = require('./basic')
exports.rest = require('./rest')

/**
 * @namespace
 *
 * @property {Function} NetworkException
 * @property {Function} IllegalUrlException
 * @property {Function} MissingHostException
 * @property {Function} ConnectionErrorException
 * @property {Function} RedirectVortexException
 * @property {Function} NetworkErrorException
 * @property {Function} TimeoutException
 * @property {Function} VoxEngineErrorException
 * @property {Function} HttpException
 * @property {Method} Method
 */
module.exports = exports
