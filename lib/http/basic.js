/* global Net */

var Commons = require('./_common')
var Query = Commons.Query
var Headers = Commons.Headers
var slf4j = require('../logger').slf4j
var Slf4j = slf4j.Slf4j

/**
 * Provides client configuration defaults.
 *
 * @returns {BasicHttpClientSettings}
 */
function getDefaults () {
  return {
    url: '',
    retryOnNetworkError: true,
    throwOnServerError: true,
    retryOnServerError: true,
    throwOnClientError: true,
    retryOnClientError: false,
    throwOnNotFound: false,
    retryOnNotFound: false,
    retries: 4,
    logger: {}
  }
}

/**
 * Internal response type, used to simplify processing path finding.
 *
 * @enum
 * @readonly
 */
var ResponseStatus = {
  NetworkError: 'NetworkError',
  ServerError: 'ServerError',
  ClientError: 'ClientError',
  NotFound: 'NotFound',
  Ok: 'Ok',
  fromCode: function (code) {
    if (code < 200 || !code) return this.NetworkError
    if (code < 400) return this.Ok
    if (code === 404) return this.NotFound
    if (code < 500) return this.ClientError
    return this.ServerError
  }
}

/**
 * @typedef {Object} BasicHttpClientSettings
 *
 * @property {string} url
 * @property {boolean} retryOnNetworkError
 * @property {boolean} throwOnServerError
 * @property {boolean} retryOnServerError
 * @property {boolean} throwOnClientError
 * @property {boolean} retryOnClientError
 * @property {boolean} throwOnNotFound
 * @property {boolean} retryOnNotFound
 * @property {string} methodOverrideHeader
 * @property {Headers} headers Headers to be used on every request.
 * @property {int} retries Maximum number of retries allowed for request.
 * @property {LoggerOptions} logger Logger instance or context and/or name.
 */

/**
 * @class
 *
 * @implements IHttpClient
 *
 * @param {BasicHttpClientSettings|object} [settings]
 * @param {netHttpRequestAsync} [transport]
 */
function BasicHttpClient (settings, transport) {
  transport = transport || Net.httpRequestAsync
  settings = settings || {}
  var defaults = getDefaults()
  var logger = Slf4j.assemble(setting('logger'))
  var self = this
  var requests = 0

  function fetch (source, key, def) {
    return source[key] !== undefined ? source[key] : def
  }

  function setting (key, def) {
    return fetch(settings, key, fetch(defaults, key, def))
  }

  function shouldRetry (status, attempt) {
    // number of attempts = 1 + number of retries, so it's 'greater than' rather than 'greater or equal to'
    // comparison
    if (attempt > setting('retries')) return false
    return setting('retryOn' + status, false)
  }

  function shouldThrow (status) {
    if (status === ResponseStatus.NetworkError) return true
    return setting('throwOn' + status, false)
  }

  function performThrow (status, request, response) {
    // yes, i'm counting bytes and switch is more expensive
    if (status === ResponseStatus.ServerError) {
      throw new Commons.ServerErrorException('Server returned erroneous response', request, response)
    } else if (status === ResponseStatus.ClientError) {
      throw new Commons.ClientErrorException('Client has performed an invalid request', request, response)
    } else if (status === ResponseStatus.NotFound) {
      throw new Commons.NotFoundException('Requested resource hasn\'t been found', request, response)
    }
    // get exception with specified code, otherwise use default one
    var ErrorClass = Commons.codeExceptionIndex[response.code] || Commons.NetworkException
    throw new ErrorClass(null, response.code, request, response)
  }

  /**
   * Executes HTTP request.
   *
   * @param {HttpRequest} request
   * @return {Promise.<(HttpResponse|Error)>}
   */
  function execute (request) {
    request.id = request.id || ++requests
    request.method = request.method.toUpperCase()
    if (['POST', 'GET'].indexOf(request.method) === -1 && !setting('methodOverrideHeader')) {
      var m = 'Tried to execute non-GET/POST request without specifying methodOverrideHeader in settings'
      return Promise.reject(new Commons.InvalidConfigurationException(m))
    }
    request.query = Query.normalize(request.query)
    request.headers = Headers.normalize(request.headers)
    if (!request.payload) request.payload = null
    request.url = setting('url') + request.url
    logger.debug('Executing request #{} `{} {}`', request.id, request.method, request.url)
    return executionLoop(request, 1)
  }

  function executionLoop (request, attempt) {
    var qs = Query.encode(request.query)
    var url = request.url + (qs.length > 0 ? '?' + qs : '')
    var opts = new Net.HttpRequestOptions()
    var method = ['HEAD', 'GET'].indexOf(request.method) === -1 ? 'POST' : 'GET'
    var headers = Headers.merge(setting('headers', {}), request.headers)
    if (method !== request.method) headers[setting('methodOverrideHeader')] = [request.method]
    opts.method = method
    opts.postData = request.payload
    opts.headers = Headers.encode(headers)
    logger.trace('Executing request #{} `{} {}`, attempt #{}', request.id, request.method, url, attempt)
    return transport(url, opts).then(function (raw) {
      var response = {code: raw.code, headers: Headers.decode(raw.headers), payload: raw.text}
      var status = ResponseStatus.fromCode(response.code)
      var toRetry = shouldRetry(status, attempt)
      var toThrow = !toRetry && shouldThrow(status)
      logger.debug('Request #{} `{} {}` (attempt #{}) ended with code `{}` / status `{}`, (retry: {}, throw: {})',
        request.id, request.method, url, attempt, response.code, status, toRetry, toThrow)
      if (toRetry) return executionLoop(request, attempt + 1)
      if (toThrow) performThrow(status, request, response)
      response.request = request
      return response
    }, function (e) {
      logger.debug('Request #{} `{} {}` ended with error {}', request.id, request.method, url, e.name)
      throw e
    })
  }

  function request (method, url, query, payload, headers) {
    return execute({url: url, method: method, headers: headers, query: query, payload: payload})
  }

  // noinspection JSUnusedGlobalSymbols
  this.execute = execute
  this.request = request

  var methods = ['get', 'head']
  methods.forEach(function (method) {
    self[method] = function (url, query, headers) { return request(method, url, query, null, headers) }
  })
  methods = ['post', 'put', 'patch', 'delete']
  methods.forEach(function (method) {
    self[method] = function (url, payload, headers, query) { return request(method, url, query, payload, headers) }
  })

  /**
   * Perform GET request.
   *
   * @function BasicHttpClient#get
   *
   * @param {string} url
   * @param {Query} [query]
   * @param {Headers} [headers]
   *
   * @return {HttpResponsePromise}
   */

  /**
   * Perform HEAD request.
   *
   * @function BasicHttpClient#head
   *
   * @param {string} url
   * @param {Query} [query]
   * @param {Headers} [headers]
   *
   * @return {HttpResponsePromise}
   */

  /**
   * Perform POST request.
   *
   * @function BasicHttpClient#post
   *
   * @param {string} url
   * @param {string} [payload]
   * @param {Headers} [headers]
   *
   * @return {HttpResponsePromise}
   */

  /**
   * Perform PUT request.
   *
   * @function BasicHttpClient#put
   *
   * @param {string} url
   * @param {string} [payload]
   * @param {Headers} [headers]
   *
   * @return {HttpResponsePromise}
   */

  /**
   * Perform PATCH request.
   *
   * @function BasicHttpClient#patch
   *
   * @param {string} url
   * @param {string} [payload]
   * @param {Headers} [headers]
   *
   * @return {HttpResponsePromise}
   */

  /**
   * Perform DELETE request.
   *
   * @function BasicHttpClient#delete
   *
   * @param {string} url
   * @param {string} [payload]
   * @param {Headers} [headers]
   *
   * @return {HttpResponsePromise}
   */
}

BasicHttpClient.getDefaults = getDefaults

module.exports = {
  Client: BasicHttpClient,
  getDefaults: getDefaults,
  ResponseStatus: ResponseStatus
}
