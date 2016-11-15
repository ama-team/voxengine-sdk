/**
 * @module logger
 */

/**
 * @interface Writable
 */

/**
 * @function
 * @name Writable#write
 * @param {String} message Log message
 */

/**
 * @class
 * @param {Logger|Writable} writer
 * @constructor
 */
function Slf4jAlikeLogger(writer) {

    function substitute(pattern, substitutions) {
        return substitutions.reduce(function (carrier, substitution) {
            return carrier.replace('{}', substitution);
        }, pattern)
    }

    this.log = function (pattern) {
        return writer.write(substitute(pattern, Array.prototype.slice.call(arguments, 1)));
    }
}

module.exports.slf4j = Slf4jAlikeLogger;