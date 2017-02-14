/**
 * @module logger
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
};

var Threshold = {
    ALL: 0,
    TRACE: 1,
    DEBUG: 2,
    NOTICE: 3,
    INFO: 4,
    WARN: 5,
    ERROR: 6,
    OFF: 7
};

function toLevel(l) {
    if (l) {
        for (var k in Threshold) {
            if (Threshold[k] === l || l.toString().toUpperCase() === k) {
                return k;
            }
        }
    }
    return Level.All;
}

function toThreshold(l) {
    return Threshold[toLevel(l)];
}

/**
 * @interface Writable
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
 * @interface InterpolationLoggerInterface
 */

/**
 * @function InterpolationLoggerInterface#log
 *
 * @param {Level} level Log level
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {...object} parameters List of pattern parameters
 */

/**
 * @function InterpolationLoggerInterface#trace
 * 
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {...object} parameters List of pattern parameters
 */

/**
 * @function InterpolationLoggerInterface#debug
 * 
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {...object} parameters List of pattern parameters
 */

/**
 * @function InterpolationLoggerInterface#notice
 * 
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {...object} parameters List of pattern parameters
 */

/**
 * @function InterpolationLoggerInterface#info
 * 
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {...object} parameters List of pattern parameters
 */

/**
 * @function InterpolationLoggerInterface#warn
 * 
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {...object} parameters List of pattern parameters
 */

/**
 * @function InterpolationLoggerInterface#error
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
 * @interface ParameterLoggerInterface
 */

/**
 * @function ParameterLoggerInterface#log
 *
 * @param {Level} level Log level
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {object} parameters Pattern parameters object
 */

/**
 * @function ParameterLoggerInterface#trace
 *
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {object} parameters Pattern parameters object
 */

/**
 * @function ParameterLoggerInterface#debug
 *
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {object} parameters Pattern parameters object
 */

/**
 * @function ParameterLoggerInterface#notice
 *
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {object} parameters Pattern parameters object
 */

/**
 * @function ParameterLoggerInterface#info
 *
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {object} parameters Pattern parameters object
 */

/**
 * @function ParameterLoggerInterface#warn
 *
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {object} parameters Pattern parameters object
 */

/**
 * @function ParameterLoggerInterface#error
 *
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {object} parameters Pattern parameters object
 */

exports = module.exports = {
    Level: Level,
    Threshold: Threshold,
    toLevel: toLevel,
    toThreshold: toThreshold
};
