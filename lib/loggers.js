/**
 * @module logger
 */

/**
 * @enum
 * @readonly
 */
var LogLevel = {
    /** @deprecated */
    ALL: 0,
    All: 0,
    /** @deprecated */
    TRACE: 1,
    Trace: 1,
    /** @deprecated */
    DEBUG: 2,
    Debug: 2,
    /** @deprecated */
    NOTICE: 3,
    Notice: 3,
    /** @deprecated */
    INFO: 4,
    Info: 4,
    /** @deprecated */
    WARN: 5,
    Warn: 5,
    /** @deprecated */
    ERROR: 6,
    Error: 6,
    /** @deprecated */
    OFF: 7,
    Off: 7
};

var InverseLogLevelIndex = Object.keys(LogLevel).reduce(function (container, key) {
    container[LogLevel[key]] = key;
    return container;
}, []);

/**
 * @interface LoggerInterface
 */

/**
 * @function LoggerInterface#log
 *
 * @param {LogLevel} level Log level
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {...object} parameters List of pattern parameters
 */

/**
 * @interface RichLoggerInterface
 * @extends LoggerInterface
 */

/**
 * @function RichLoggerInterface#trace
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {...object} parameters List of pattern parameters
 */

/**
 * @function RichLoggerInterface#debug
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {...object} parameters List of pattern parameters
 */

/**
 * @function RichLoggerInterface#notice
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {...object} parameters List of pattern parameters
 */

/**
 * @function RichLoggerInterface#info
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {...object} parameters List of pattern parameters
 */

/**
 * @function RichLoggerInterface#warn
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {...object} parameters List of pattern parameters
 */

/**
 * @function RichLoggerInterface#error
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {...object} parameters List of pattern parameters
 */

/**
 * @interface Writable
 */

/**
 * @function Writable#write
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
 * @implements RichLoggerInterface
 */
function Slf4jAlikeLogger(writer, threshold) {

    writer = writer || Logger;

    if (!(threshold in InverseLogLevelIndex)) {
        threshold = LogLevel.INFO;
    }

    function substitute(pattern, substitutions) {
        var e = substitutions.filter(function (s) { return s instanceof Error; }),
            o = substitutions.filter(function (s) { return !(s instanceof Error); }),
            s = o.reduce(function (carrier, s) { return carrier.replace('{}', render(s)); }, pattern);

        return e.reduce(function (carrier, e) { return carrier + '\n' + renderException(e); }, s);
    }

    function renderException(e) {
        return e.name + ': ' + e.message + '\nStack:\n' + e.stack;
    }

    function render(v) {
        v = typeof v === 'undefined' ? '{undefined}' : v;
        return v != null && v.constructor === String ? v : JSON.stringify(v);
    }

    this.log = function (level, pattern) {
        if (level >= threshold) {
            var prefix = '[' + InverseLogLevelIndex[level].toUpperCase() + '] ';
            return writer.write(substitute(prefix + pattern, Array.prototype.slice.call(arguments, 2)));
        }
    };

    for (var i = LogLevel.Trace; i <= LogLevel.Error; i++) {
        this[InverseLogLevelIndex[i].toLowerCase()] = (function(self, level) {
            return function () {
                self.log.apply(self, [level].concat(Array.prototype.slice.call(arguments)));
            };
        })(this, i);
    }

    /**
     * @function Slf4jAlikeLogger#trace
     * @param {string} pattern Logging pattern with `{}` as a place for substitution
     * @param {...object} parameters List of pattern parameters
     */

    /**
     * @function Slf4jAlikeLogger#debug
     * @param {string} pattern Logging pattern with `{}` as a place for substitution
     * @param {...object} parameters List of pattern parameters
     */

    /**
     * @function Slf4jAlikeLogger#notice
     * @param {string} pattern Logging pattern with `{}` as a place for substitution
     * @param {...object} parameters List of pattern parameters
     */

    /**
     * @function Slf4jAlikeLogger#info
     * @param {string} pattern Logging pattern with `{}` as a place for substitution
     * @param {...object} parameters List of pattern parameters
     */

    /**
     * @function Slf4jAlikeLogger#warn
     * @param {string} pattern Logging pattern with `{}` as a place for substitution
     * @param {...object} parameters List of pattern parameters
     */

    /**
     * @function Slf4jAlikeLogger#error
     * @param {string} pattern Logging pattern with `{}` as a place for substitution
     * @param {...object} parameters List of pattern parameters
     */
}

exports = module.exports = {
    slf4j: Slf4jAlikeLogger,
    LogLevel: LogLevel
};
