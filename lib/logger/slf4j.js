/**
 * @module logger/slf4j
 */

var _ = require('./_common'),
    Level = _.Level,
    Threshold = _.Threshold,
    toLevel = _.toLevel,
    toThreshold = _.toThreshold;

/**
 * @class Slf4j
 *
 * @param {string} [name] Logger name.
 * @param {Level} [threshold] Logger threshold.
 * @param {Logger|Writable} [writer] Particular log writer, which may push log messages to file, console, or whatever it
 *   is.
 *
 * @implements VarArgLogger
 */
function Slf4j(name, threshold, writer) {

    writer = writer || Logger;
    var thresh = toThreshold(threshold);

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

    //noinspection JSUnusedGlobalSymbols
    this.setThreshold = function (threshold) {
        thresh = toThreshold(threshold);
    };

    this.getThreshold = function () {
        return toLevel(thresh);
    };

    this.getWriter = function () {
        return writer;
    };

    function log(level, pattern, _) {
        level = toLevel(level);
        if (toThreshold(level) >= thresh) {
            var prefix = '[' + level.toUpperCase() + '] ' + (name ? name + ': ' : '');
            return writer.write(substitute(prefix + pattern, [].slice.call(arguments, 2)));
        }
    }

    this.log = log;

    for (var i = Threshold.TRACE; i <= Threshold.ERROR; i++) {
        this[toLevel(i).toLowerCase()] = (function (self, threshold) {
            return function () {
                log.apply(null, ([threshold].concat([].slice.call(arguments))));
            };
        })(this, i);
    }

    /**
     * @function Slf4j#trace
     * @param {string} pattern Logging pattern with `{}` as a place for substitution
     * @param {...object} parameters List of pattern parameters
     */

    /**
     * @function Slf4j#debug
     * @param {string} pattern Logging pattern with `{}` as a place for substitution
     * @param {...object} parameters List of pattern parameters
     */

    /**
     * @function Slf4j#notice
     * @param {string} pattern Logging pattern with `{}` as a place for substitution
     * @param {...object} parameters List of pattern parameters
     */

    /**
     * @function Slf4j#info
     * @param {string} pattern Logging pattern with `{}` as a place for substitution
     * @param {...object} parameters List of pattern parameters
     */

    /**
     * @function Slf4j#warn
     * @param {string} pattern Logging pattern with `{}` as a place for substitution
     * @param {...object} parameters List of pattern parameters
     */

    /**
     * @function Slf4j#error
     * @param {string} pattern Logging pattern with `{}` as a place for substitution
     * @param {...object} parameters List of pattern parameters
     */
}

//noinspection JSUnusedLocalSymbols
/**
 * @class
 *
 * @implements VarArgLoggerFactory
 *
 * @param {Level} [threshold]
 * @param {Logger|Writable} [writer]
 */
function Factory(threshold, writer) {
    var t = threshold,
        w = writer;

    /**
     * Creates new logger.
     *
     * @param {string} [name] Logger name
     * @constructs Slf4j
     *
     * @returns {Slf4j} New logger instance
     */
    this.create = function (name) {
        return new Slf4j(name, t, w);
    };

    this.setThreshold = function (threshold) {
        t = threshold;
    };

    this.setWriter = function (writer) {
        w = writer;
    };
}

module.exports = {
    Slf4j: Slf4j,
    Factory: Factory,
    Level: Level
};
