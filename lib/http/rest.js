/**
 * @module http/rest
 */

var C = require('./_common')
var M = C.Method
var Client = require('./basic').Client
var Slf4j = require('../logger').Slf4j

/**
 * @interface Serializer
 */

/**
 * @function Serializer.serialize
 *
 * @param {object}
 *
 * @return {string}
 */

/**
 * @function Serializer.deserialize
 *
 * @param {string}
 *
 * @return {object}
 */

/**
 * @class
 *
 * @implements Serializer
 */
function JsonSerializer () {
  this.serialize = JSON.stringify
  this.deserialize = JSON.parse
}

/**
 * @class RestClientSettings
 *
 * @property {string|undefined} url String to prepend to every request route.
 * @property {Serializer|undefined} serializer Serializer to encode/decode
 *   messages, default: JsonSerializer
 * @property {number|undefined} retries Maximum number of retries for each
 *   request, default: `4`
 * @property {string|undefined} methodOverrideHeader Name of header that should
 *   conceal real request HTTP method,
 *   look up `X-HTTP-Method-Override` in nearest search engine. Default: none
 * @property {boolean|undefined} retryOnNetworkError Whether request should be
 *   retried on connection error,
 *   default: `true`
 * @property {boolean|undefined} retryOnServerError Whether request should be
 *   retried on server error (5xx),
 *   default: `true`
 * @property {HeaderBag|undefined} headers Object containing headers for every
 *   emitted request, default: `{}`
 * @property {int|undefined} timeout Default request timeout in milliseconds,
 *   may be overriden on per-request level. Falsey values will use no timeout
 *   at all.
 * @property {LoggerOptions} logger Logger options.
 * @property {IHttpClient} client Underlying http client
 */

// noinspection JSClosureCompilerSyntax
/**
 * @class
 *
 * @implements IRestClient
 *
 * @param {RestClientSettings|Object} [settings]
 * @param {netHttpRequestAsync} [transport]
 */
function RestClient (settings, transport) {
  var self = this
  var opts = getDefaults()
  var client
  var logger
  var counter = 0

  if (settings instanceof Function) {
    transport = settings
    settings = {}
  }
  settings = settings || {}
  if (typeof settings === 'string' || settings instanceof String) {
    settings = {url: settings}
  }
  Object.keys(opts).forEach(function (key) {
    if (key in settings) {
      opts[key] = settings[key]
    }
  })
  client = settings.client || new Client(opts, transport)
  logger = Slf4j.factory(opts.logger, 'ama-team.voxengine-sdk.http.rest')

  function execute (request) {
    var id = ++counter
    request.id = request.id || id
    var basicRequest = {
      url: request.resource || request.route, // 0.2.0 compatibility
      method: request.method,
      query: request.query,
      headers: request.headers,
      timeout: typeof request.timeout === 'number' ? request.timeout : settings.timeout
    }
    logger.debug('Executing request #{} `{} {}`', request.id, request.method, request.resource)
    basicRequest.payload = request.payload ? opts.serializer.serialize(request.payload) : null
    return client
      .execute(basicRequest)
      .then(function (response) {
        logger.debug('Request #{} `{} {}` received response with code {}',
          request.id, request.method, request.resource, response.code)
        return {
          code: response.code,
          payload: response.payload ? opts.serializer.deserialize(response.payload) : null,
          headers: response.headers,
          request: request
        }
      }, function (e) {
        logger.debug('Request #{} `{} {}` has finished with error {}',
          request.id, request.method, request.resource, e.name)
        throw e
      })
  }

  /**
   * @inheritDoc
   */
  function request (method, resource, payload, query, headers, timeout) {
    return execute({resource: resource, method: method, query: query, payload: payload, headers: headers, timeout: timeout})
  }

  /**
   * @inheritDoc
   */
  this.execute = execute

  /**
   * @inheritDoc
   */
  this.request = request

  /**
   * @inheritDoc
   */
  this.exists = function (resource, query, headers, timeout) {
    return request(M.Head, resource, null, query, headers, timeout)
      .then(function (response) {
        return response.code !== 404
      })
  }

  /**
   * @inheritDoc
   */
  this.get = function (resource, query, headers, timeout) {
    return request(M.Get, resource, null, query, headers, timeout)
      .then(function (response) {
        return response.code === 404 ? null : response.payload
      })
  }

  var methods = {create: M.Post, set: M.Put, modify: M.Patch, delete: M.Delete}
  Object.keys(methods).forEach(function (method) {
    self[method] = function (resource, payload, headers, query, timeout) {
      return request(methods[method], resource, payload, query, headers, timeout)
        .then(function (response) {
          if (response.code === 404) {
            var message = 'Modification request has returned 404 status code'
            throw new C.NotFoundException(message, response.request, response)
          }
          return response.payload
        })
    }
  })
}

/**
 * @return {RestClientSettings}
 */
function getDefaults () {
  return {
    url: '',
    client: null,
    serializer: new JsonSerializer(),
    retries: 4,
    methodOverrideHeader: null,
    retryOnServerError: true,
    retryOnNetworkError: true,
    headers: {},
    logger: {}
  }
}

RestClient.getDefaults = getDefaults

module.exports = {
  Client: RestClient,
  /** @deprecated */
  getDefaults: getDefaults
}
