/**
 * @callback netHttpRequestAsync
 * @param {string} url
 * @param {Net.HttpRequestOptions} options
 * @return {Promise}
 */

/**
 * Header collection. When returned by internal methods, values are always present as an array.
 *
 * @typedef {Object.<string, string|string[]>} Headers
 */

/**
 * @typedef {Object.<string, string|string[]>} Query
 */

/**
 * Simple response wrapper
 *
 * @typedef {Object} Response
 *
 * @property {Number} code Response code
 * @property {Headers} headers Response headers
 * @property {String} payload Decoded response payload
 */

/**
 * Simple request wrapper
 *
 * @typedef {Object} Request
 *
 * @property {string} url Url to execute request against
 * @property {Method} method HTTP method
 * @property {Query|null} query Request query
 * @property {Headers|null} headers Request headers
 * @property {String} payload Serialized request payload
 */

/**
 * @enum {string}
 * @readonly
 */
var Method = {
    Get: 'GET',
    Post: 'POST',
    Put: 'PUT',
    Delete: 'DELETE'
};

function extend(parent, child, name) {
    child.prototype = Object.create(parent.prototype);
    child.prototype.constructor = child;
    child.prototype.name = name;
}

function NetworkException(message, code, request) {
    this.message = message || this.message;
    this.code = code || this.code;
    this.request = request;
    this.stack = new Error().stack;
}
// poor man's byte economy
var N = NetworkException;
extend(Error, N, 'NetworkException');
N.prototype.code = -1;
N.prototype.message = 'Unexpected exception during request';

var index = {
    '-1': N
};

/**
 * @class {IllegalUrlException}
 *
 * @param {string} message
 * @param {int} code
 */

/**
 * @class {MissingHostException}
 *
 * @param {string} message
 * @param {int} code
 */

/**
 * @class {ConnectionErrorException}
 *
 * @param {string} message
 * @param {int} code
 */

/**
 * @class {RedirectVortexException}
 *
 * @param {string} message
 * @param {int} code
 */

/**
 * @class {NetworkErrorException}
 *
 * @param {string} message
 * @param {int} code
 */

/**
 * @class {TimeoutException}
 *
 * @param {string} message
 * @param {int} code
 */


/**
 * @class {VoxEngineErrorException}
 *
 * @param {string} message
 * @param {int} code
 */

/**
 * @namespace
 * 
 * @property {Function} IllegalUrlException
 * @property {Function} MissingHostException
 * @property {Function} ConnectionErrorException
 * @property {Function} RedirectVortexException
 * @property {Function} NetworkErrorException
 * @property {Function} TimeoutException
 * @property {Function} VoxEngineErrorException
 */
var exports = {
    NetworkException: N,
    codeExceptionIndex: index,
    Method: Method
};

function declare(name, code, message) {
    var e = function () {
        N.apply(this, arguments);
    };
    extend(N, e, name);
    e.prototype.constructor = e;
    e.prototype.code = e.code = code;
    e.prototype.message = message;
    exports[name] = e;
    index[code] = e;
}

declare('IllegalUrlException', -2, 'Illegal URL exception');
declare('MissingHostException', -3, 'Could not find host');
declare('ConnectionErrorException', -4, 'Could not establish connection');
declare('RedirectVortexException', -5, 'Too many redirects');
declare('NetworkErrorException', -6, 'Network error exception');
declare('TimeoutException', -7, 'Request timeout exceeded');
declare('VoxEngineErrorException', -8, 'Internal exception during request');

function HttpException(message, request, response) {
    this.message = message;
    this.request = request;
    this.response = response;
    this.stack = new Error().stack;
}
extend(Error, HttpException, 'HttpException');
exports.HttpException = HttpException;

function ServerErrorException() {
    HttpException.apply(this, arguments);
}
extend(HttpException, ServerErrorException, 'ServerErrorException');
exports.ServerErrorException = ServerErrorException;

function ClientErrorException() {
    HttpException.apply(this, arguments);
}
extend(HttpException, ClientErrorException, 'ClientErrorException');
exports.ClientErrorException = ClientErrorException;

function NotFoundException() {
    HttpException.apply(this, arguments);
}
extend(HttpException, NotFoundException, 'NotFoundException');
exports.NotFoundException = NotFoundException;

function InvalidConfigurationException(message) {
    this.message = message || 'Invalid configuration';
    this.stack = new Error().stack;
}
extend(Error, InvalidConfigurationException, 'InvalidConfigurationException');
exports.InvalidConfigurationException = InvalidConfigurationException;

function normalize(bag) {
    bag = bag || {};
    Object.keys(bag).forEach(function (key) {
        if (!(bag[key] instanceof Array)) bag[key] = [bag[key]];
    });
    return bag;
}
exports.params = {
    normalize: normalize
};

exports.query = {
    encode: function (query) {
        query = normalize(query || {});
        return Object.keys(query).reduce(function (carrier, key) {
            return carrier.concat(query[key].map(function (value) {
                return encodeURIComponent(key) + '=' + encodeURIComponent(value);
            }));
        }, []).join('&');
    },
    normalize: normalize
};

exports.headers = {
    encode: function (headers) {
        headers = normalize(headers || {});
        return Object.keys(headers).reduce(function (_, k) {
            return _.concat(headers[k].map(function (v) {
                return k + ': ' + v;
            }));
        }, []);
    },
    decode: function (headers) {
        var ret = {};
        headers = headers || {};
        Object.keys(headers).map(function (key) { ret[key] = [headers[key]]; });
        return ret;
    },
    merge: function (a, b) {
        return []
            .filter.call(arguments, function (_) { return _; })
            .reduce(function (carrier, _) {
                Object.keys(_).forEach(function (key) { carrier[key] = _[key]; });
                return carrier;
            }, {});
    },
    normalize: normalize
};

module.exports = exports;
