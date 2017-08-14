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
 * @typedef {Object.<string, string|string[]>} HeaderBag
 */

/**
 * @typedef {Object.<string, string|string[]>} QueryBag
 */

/**
 * Simple request wrapper
 *
 * @typedef {Object} HttpRequest
 *
 * @property {(string|*)} id Request id
 * @property {string} url Url to execute request against
 * @property {Method} method HTTP method
 * @property {QueryBag|null} query Request query
 * @property {HeaderBag|null} headers Request headers
 * @property {string} payload Serialized request payload
 * @property {int} timeout
 */

/**
 * Simple response wrapper
 *
 * @typedef {Object} HttpResponse
 *
 * @property {Number} code Response code
 * @property {HeaderBag} headers Response headers
 * @property {String} payload Response payload
 * @property {HttpRequest} request
 */

/**
 * Promise that will resolve with {@link HttpResponse} with any HTTP
 * code, or reject with {@link HttpException}, {@link NetworkException}
 * or any of their children. Please note that {@link HttpResponse} is
 * virtual class and can't be `instanceof`-d.
 *
 * @typedef {Thenable.<(HttpResponse|Error)>} HttpResponsePromise
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
 * @param {QueryBag} query
 * @param {string} payload
 * @param {HeaderBag} headers
 *
 * @return {HttpResponsePromise}
 */

/**
 * @function IHttpClient#head
 *
 * @param {string} url
 * @param {QueryBag} [query]
 * @param {HeaderBag} [headers]
 *
 * @return {HttpResponsePromise}
 */

/**
 * @function IHttpClient#get
 *
 * @param {string} url
 * @param {QueryBag} [query]
 * @param {HeaderBag} [headers]
 *
 * @return {HttpResponsePromise}
 */

/**
 * @function IHttpClient#post
 *
 * @param {string} url
 * @param {string} [payload]
 * @param {HeaderBag} [headers]
 *
 * @return {HttpResponsePromise}
 */

/**
 * @function IHttpClient#put
 *
 * @param {string} url
 * @param {string} [payload]
 * @param {HeaderBag} [headers]
 *
 * @return {HttpResponsePromise}
 */

/**
 * @function IHttpClient#patch
 *
 * @param {string} url
 * @param {string} [payload]
 * @param {HeaderBag} [headers]
 *
 * @return {HttpResponsePromise}
 */

/**
 * @function IHttpClient#delete
 *
 * @param {string} url
 * @param {string} [payload]
 * @param {HeaderBag} [headers]
 *
 * @return {HttpResponsePromise}
 */

/**
 * @typedef {Object} RestRequest
 *
 * @property {Method|string} method
 * @property {string} route
 * @property {QueryBag} query
 * @property {*} payload
 * @property {HeaderBag} headers
 * @property {int} timeout
 */

/**
 * @typedef {Object} RestResponse
 *
 * @param {*} payload
 * @param {int} code
 * @param {HeaderBag} headers
 */

/**
 * @typedef {Thenable.<RestResponse>} RestResponsePromise
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
 * @param {string} resource
 * @param {*|undefined} [payload]
 * @param {QueryBag|undefined} [query]
 * @param {HeaderBag|undefined} [headers]
 * @param {int} [timeout]
 *
 * @return {RestResponsePromise}
 */

/**
 * @function IRestClient#exists
 *
 * @param {string} route
 * @param {QueryBag} [query]
 * @param {HeaderBag} [headers]
 * @param {int} [timeout]
 *
 * @return {Thenable.<boolean|Error>}
 */

/**
 * @function IRestClient#get
 *
 * @param {string} route
 * @param {QueryBag} [query]
 * @param {HeaderBag} [headers]
 * @param {int} [timeout]
 *
 * @return {Thenable.<*|Error>}
 */

/**
 * @function IRestClient#create
 *
 * @param {string} route
 * @param {*} [payload]
 * @param {HeaderBag} [headers]
 * @param {int} [timeout]
 *
 * @return {Thenable.<*|Error>}
 */

/**
 * @function IRestClient#set
 *
 * @param {string} route
 * @param {*} [payload]
 * @param {HeaderBag} [headers]
 * @param {int} [timeout]
 *
 * @return {Thenable.<*|Error>}
 */

/**
 * @function IRestClient#modify
 *
 * @param {string} route
 * @param {*} [payload]
 * @param {HeaderBag} [headers]
 * @param {int} [timeout]
 *
 * @return {Thenable.<*|Error>}
 */

/**
 * @function IRestClient#delete
 *
 * @param {string} route
 * @param {*} [payload]
 * @param {HeaderBag} [headers]
 * @param {int} [timeout]
 *
 * @return {Thenable.<*|Error>}
 */

/**
 * @namespace
 */
module.exports = {
  Method: Method
}
