var slf4j = require('./Slf4j')

module.exports = {
  /** @deprecated */
  slf4j: slf4j,
  Slf4j: slf4j.Slf4j,
  Level: require('./_common').Level
}
