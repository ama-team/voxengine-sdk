/**
 * @module logger
 */

/**
 * @enum
 * @readonly
 */
var LogLevel = {
    ALL: 0,
    TRACE: 1,
    DEBUG: 2,
    NOTICE: 3,
    INFO: 4,
    WARN: 5,
    ERROR: 6,
    OFF: 7
};

var InverseLogLevelIndex = Object.keys(LogLevel).reduce(function (container, key) {
    container[LogLevel[key]] = key;
    return container;
}, []);

/**
 * @interface LoggerInterface
 */

/**
 * @function LoggerInterface.log
 *
 * @param {LogLevel} level Log level
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {...object} parameters List of pattern parameters
 */

/**
 * @interface Writable
 */

/**
 * @function
 * @name Writable#write
 * @param {String} message Message to write
 */

/**
 * @class Slf4jAlikeLogger
 *
 * @param {Logger|Writable} writer Particular log writer, which may push log messages to file, console, or whatever it
 *   is.
 * @param {LogLevel} [threshold] Logger threshold
 *
 * @implements LoggerInterface
 */
function Slf4jAlikeLogger(writer, threshold) {

    writer = writer || Logger;

    if (!(threshold in InverseLogLevelIndex)) {
        threshold = LogLevel.INFO;
    }

    function substitute(pattern, substitutions) {
        return substitutions.reduce(function (carrier, s) {
            s = typeof s === 'undefined' ? '{undefined}' : s;
            return carrier.replace('{}', s != null && s.constructor === String ? s : JSON.stringify(s));
        }, pattern);
    }
    this.log = function (level, pattern) {
        if (level >= threshold) {
            var prefix = '[' + InverseLogLevelIndex[level] + '] ';
            return writer.write(substitute(prefix + pattern, Array.prototype.slice.call(arguments, 2)));
        }
    };

    for (var i = LogLevel.TRACE; i <= LogLevel.ERROR; i++) {
        this[InverseLogLevelIndex[i].toLowerCase()] = (function(self, level) {
            return function () {
                self.log.apply(self, [level].concat(Array.prototype.slice.call(arguments)));
            };
        })(this, i);
    }

    /**
     * @function Slf4jAlikeLogger.trace
     *
     * @param {string} pattern
     * @param {object...} substitutions
     */

    /**
     * @function Slf4jAlikeLogger.debug
     *
     * @param {string} pattern
     * @param {object...} substitutions
     */

    /**
     * @function Slf4jAlikeLogger.notice
     *
     * @param {string} pattern
     * @param {object...} substitutions
     */

    /**
     * @function Slf4jAlikeLogger.info
     *
     * @param {string} pattern
     * @param {object...} substitutions
     */

    /**
     * @function Slf4jAlikeLogger.warn
     *
     * @param {string} pattern
     * @param {object...} substitutions
     */

    /**
     * @function Slf4jAlikeLogger.error
     *
     * @param {string} pattern
     * @param {object...} substitutions
     */
}

exports = module.exports = {
    slf4j: Slf4jAlikeLogger,
    LogLevel: LogLevel
};