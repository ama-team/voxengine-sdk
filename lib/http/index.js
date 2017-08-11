var _ = require('./_common')
var exports = {}

Object.keys(_).forEach(function (k) {
  exports[k] = _[k]
})
/** @deprecated */
exports.basic = require('./basic')
/** @deprecated */
exports.rest = require('./rest')
exports.Rest = exports.rest.Client
exports.Basic = exports.basic.Client

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
 * @property {Function} ServerErrorException
 * @property {Function} ClientErrorException
 * @property {Function} NotFoundException
 * @property {Function} InvalidConfigurationException
 * @property {Method} Method
 */
module.exports = exports
