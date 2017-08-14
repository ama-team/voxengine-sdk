var exports = {
  Http: require('./http'),
  Logger: require('./logger'),
  Concurrent: require('./concurrent')
}
/** @deprecated */
exports.http = exports.Http
/** @deprecated */
exports.logger = exports.Logger

module.exports = exports
