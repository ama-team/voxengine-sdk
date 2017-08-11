var exports = {
  Http: require('./http'),
  Logger: require('./logger')
}
/** @deprecated */
exports.http = exports.Http
/** @deprecated */
exports.logger = exports.Logger

module.exports = exports
