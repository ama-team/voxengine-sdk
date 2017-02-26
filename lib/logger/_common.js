/**
 * @module logger/_common
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
 * @callback Writer
 *
 * @param {string} message Message to write
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
 * @interface VarArgLogger
 */

/**
 * @function VarArgLogger#log
 *
 * @param {Level} level Log level
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {...object} parameters List of pattern parameters
 */

/**
 * @function VarArgLogger#trace
 * 
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {...object} parameters List of pattern parameters
 */

/**
 * @function VarArgLogger#debug
 * 
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {...object} parameters List of pattern parameters
 */

/**
 * @function VarArgLogger#notice
 * 
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {...object} parameters List of pattern parameters
 */

/**
 * @function VarArgLogger#info
 * 
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {...object} parameters List of pattern parameters
 */

/**
 * @function VarArgLogger#warn
 * 
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {...object} parameters List of pattern parameters
 */

/**
 * @function VarArgLogger#error
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
 * @interface ParameterLogger
 * @deprecated Use ParameterLogger that will supersede this one next release
 */

/**
 * @interface ParameterLogger
 * @extends ParameterLogger
 */

/**
 * @function ParameterLogger#log
 *
 * @param {Level} level Log level
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {object} parameters Pattern parameters object
 */

/**
 * @function ParameterLogger#trace
 *
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {object} parameters Pattern parameters object
 */

/**
 * @function ParameterLogger#debug
 *
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {object} parameters Pattern parameters object
 */

/**
 * @function ParameterLogger#notice
 *
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {object} parameters Pattern parameters object
 */

/**
 * @function ParameterLogger#info
 *
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {object} parameters Pattern parameters object
 */

/**
 * @function ParameterLogger#warn
 *
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {object} parameters Pattern parameters object
 */

/**
 * @function ParameterLogger#error
 *
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {object} parameters Pattern parameters object
 */

/**
 * @interface ParameterLoggerFactory
 */

/**
 * @function ParameterLoggerFactory#create
 *
 * @param {string} name
 *
 * @return {ParameterLogger}
 */

/**
 * @function ParameterLoggerFactory#setWriter
 *
 * @param {Writable} writer
 */

/**
 * @function ParameterLoggerFactory#setThreshold
 *
 * @param {Level} threshold
 */

/**
 * @interface VarArgLoggerFactory
 */

/**
 * @function VarArgLoggerFactory#create
 *
 * @param {string} name
 *
 * @return {VarArgLogger}
 */

/**
 * @function VarArgLoggerFactory#setWriter
 *
 * @param {Writable} writer
 */

/**
 * @function VarArgLoggerFactory#setThreshold
 *
 * @param {Level} threshold
 */

/**
 * @namespace
 */
exports = module.exports = {
    Level: Level,
    Threshold: Threshold,
    toLevel: toLevel,
    toThreshold: toThreshold
};
