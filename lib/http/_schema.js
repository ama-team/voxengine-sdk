/**
 * @callback netHttpRequestAsync
 * @global
 *
 * @param {string} url
 * @param {Net.HttpRequestOptions} options
 *
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
 * Simple request wrapper
 *
 * @typedef {Object} HttpRequest
 *
 * @property {(string|*)} id Request id
 * @property {string} url Url to execute request against
 * @property {Method} method HTTP method
 * @property {Query|null} query Request query
 * @property {Headers|null} headers Request headers
 * @property {String} payload Serialized request payload
 */

/**
 * Simple response wrapper
 *
 * @typedef {Object} HttpResponse
 *
 * @property {Number} code Response code
 * @property {Headers} headers Response headers
 * @property {String} payload Response payload
 * @property {HttpRequest} request
 */

/**
 * Promise that will resolve with {@link HttpResponse} with any HTTP code, or reject with {@link HttpException},
 * {@link NetworkException} or any of their children. Please note that {@link HttpResponse} is virtual class and can't be
 * `instanceof`-d.
 *
 * @typedef {Promise.<HttpResponse>} HttpResponsePromise
 */

/**
 * @enum {string}
 * @readonly
 */
var Method = {
  Head: 'HEAD',
  Get: 'GET',
  Post: 'POST',
  Put: 'PUT',
  Patch: 'PATCH',
  Delete: 'DELETE'
}

/**
 * @interface IHttpClient
 */

/**
 * @function IHttpClient#execute
 *
 * @param {HttpRequest} request
 *
 * @return {HttpResponsePromise}
 */

/**
 * @function IHttpClient#request
 *
 * @param {Method|string} method
 * @param {string} url
 * @param {Query} query
 * @param {string} payload
 * @param {Headers} headers
 *
 * @return {HttpResponsePromise}
 */

/**
 * @function IHttpClient#head
 *
 * @param {string} url
 * @param {Query} [query]
 * @param {Headers} [headers]
 *
 * @return {HttpResponsePromise}
 */

/**
 * @function IHttpClient#get
 *
 * @param {string} url
 * @param {Query} [query]
 * @param {Headers} [headers]
 *
 * @return {HttpResponsePromise}
 */

/**
 * @function IHttpClient#post
 *
 * @param {string} url
 * @param {string} [payload]
 * @param {Headers} [headers]
 *
 * @return {HttpResponsePromise}
 */

/**
 * @function IHttpClient#put
 *
 * @param {string} url
 * @param {string} [payload]
 * @param {Headers} [headers]
 *
 * @return {HttpResponsePromise}
 */

/**
 * @function IHttpClient#patch
 *
 * @param {string} url
 * @param {string} [payload]
 * @param {Headers} [headers]
 *
 * @return {HttpResponsePromise}
 */

/**
 * @function IHttpClient#delete
 *
 * @param {string} url
 * @param {string} [payload]
 * @param {Headers} [headers]
 *
 * @return {HttpResponsePromise}
 */

/**
 * @typedef {Object} RestRequest
 *
 * @property {Method|string} method
 * @property {string} route
 * @property {Query} query
 * @property {*} payload
 * @property {Headers} headers
 */

/**
 * @typedef {Object} RestResponse
 *
 * @param {*} payload
 * @param {int} code
 * @param {Headers} headers
 */

/**
 * @typedef {Promise.<RestResponse>} RestResponsePromise
 */

/**
 * @interface IRestClient
 */

/**
 * @function IRestClient#execute
 *
 * @param {RestRequest} request
 *
 * @return {RestResponsePromise}
 */

/**
 * @function IRestClient#request
 *
 * @param {Method|string} method
 * @param {string} route
 * @param {Query|undefined} [query]
 * @param {*|undefined} [payload]
 * @param {Headers|undefined} [headers]
 *
 * @return {RestResponsePromise}
 */

/**
 * @function IRestClient#exists
 *
 * @param {string} route
 * @param {Query} [query]
 * @param {Headers} [headers]
 *
 * @return {Promise.<boolean>}
 */

/**
 * @function IRestClient#get
 *
 * @param {string} route
 * @param {Query} [query]
 * @param {Headers} [headers]
 *
 * @return {Promise.<*>}
 */

/**
 * @function IRestClient#create
 *
 * @param {string} route
 * @param {*} [payload]
 * @param {Headers} [headers]
 *
 * @return {Promise.<*>}
 */

/**
 * @function IRestClient#set
 *
 * @param {string} route
 * @param {*} [payload]
 * @param {Headers} [headers]
 *
 * @return {Promise.<*>}
 */

/**
 * @function IRestClient#modify
 *
 * @param {string} route
 * @param {*} [payload]
 * @param {Headers} [headers]
 *
 * @return {Promise.<*>}
 */

/**
 * @function IRestClient#delete
 *
 * @param {string} route
 * @param {*} [payload]
 * @param {Headers} [headers]
 *
 * @return {Promise.<*>}
 */

/**
 * @namespace
 */
module.exports = {
  Method: Method
}
