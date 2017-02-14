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
 * @property {Object|null} payload Decoded response payload
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
 * @property {Object|null} payload Serialized request payload
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

exports = module.exports = {
    Method: Method
};
