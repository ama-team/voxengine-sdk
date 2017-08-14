/* global Net */

var C = require('./_common')
var Q = C.Query
var H = C.Headers
var Slf4j = require('../logger').slf4j.Slf4j

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
 * RS is an abbreviation from ResponseStatus
 *
 * @enum
 * @readonly
 */
var RS = {
  NetworkError: 'NetworkError',
  ServerError: 'ServerError',
  ClientError: 'ClientError',
  NotFound: 'NotFound',
  Ok: 'Ok',
  fromCode: function (code) {
    if (code < 200 || !code) {
      return this.NetworkError
    }
    if (code < 400) {
      return this.Ok
    }
    if (code === 404) {
      return this.NotFound
    }
    if (code < 500) {
      return this.ClientError
    }
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
 * @property {HeaderBag} headers Headers to be used on every request.
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
  var logger = Slf4j.factory(setting('logger'), 'ama-team.voxengine-sdk.http.basic')
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
    return attempt <= setting('retries') && setting('retryOn' + status, false)
  }

  function shouldThrow (status) {
    return status === RS.NetworkError || setting('throwOn' + status, false)
  }

  function performThrow (status, request, response) {
    // yes, i'm counting bytes and switch is more expensive
    if (status === RS.ServerError) {
      throw new C.ServerErrorException('Server returned erroneous response', request, response)
    } else if (status === RS.ClientError) {
      throw new C.ClientErrorException('Client has performed an invalid request', request, response)
    } else if (status === RS.NotFound) {
      throw new C.NotFoundException('Requested resource hasn\'t been found', request, response)
    }
    // get exception with specified code, otherwise use default one
    var ErrorClass = C.codeExceptionIndex[response.code] || C.NetworkException
    throw new ErrorClass(null, response.code, request, response)
  }

  /**
   * Executes HTTP request.
   *
   * @param {HttpRequest} request
   * @return {Promise.<(HttpResponse|Error)>}
   */
  function execute (request) {
    var message
    if (!request.method) {
      message = 'Request method hasn\'t been specified'
      return Promise.reject(new C.InvalidConfigurationException(message))
    }
    var id = request.id = request.id || ++requests
    request.method = request.method.toUpperCase()
    if (['POST', 'GET'].indexOf(request.method) === -1 && !setting('methodOverrideHeader')) {
      message = 'Tried to execute non-GET/POST request without specifying methodOverrideHeader in settings'
      return Promise.reject(new C.InvalidConfigurationException(message))
    }
    request.query = Q.normalize(request.query)
    request.headers = H.normalize(request.headers)
    if (!request.payload) request.payload = null
    var url = request.url = setting('url') + (request.url || '')
    logger.debug('Executing request #{} `{} {}`', request.id, request.method, url)
    return executionLoop(request, 1)
      .then(function (response) {
        logger.debug('Request #{} `{} {}` got response with code {}', id,
          request.method, url, response.code)
        return response
      }, function (e) {
        logger.debug('Request #{} `{} {}` resulted in error {}', id,
          request.method, url, e.name)
        throw e
      })
  }

  function executionLoop (request, attempt) {
    var qs = Q.encode(request.query)
    var url = request.url + (qs.length > 0 ? '?' + qs : '')
    var opts = new Net.HttpRequestOptions()
    var method = ['HEAD', 'GET'].indexOf(request.method) === -1 ? 'POST' : 'GET'
    var headers = H.override(setting('headers', {}), request.headers)
    if (method !== request.method) {
      headers[setting('methodOverrideHeader')] = [request.method]
    }
    opts.method = method
    opts.postData = request.payload
    opts.headers = H.encode(headers)
    logger.trace('Executing request #{} `{} {}`, attempt #{}', request.id, request.method, url, attempt)
    return transport(url, opts).then(function (raw) {
      var response = {code: raw.code, headers: H.decode(raw.headers), payload: raw.text}
      var status = RS.fromCode(response.code)
      var toRetry = shouldRetry(status, attempt)
      var toThrow = !toRetry && shouldThrow(status)
      logger.trace('Request #{} `{} {}` (attempt #{}) ended with code `{}` / status `{}`, (retry: {}, throw: {})',
        request.id, request.method, url, attempt, response.code, status, toRetry, toThrow)
      if (toRetry) {
        return executionLoop(request, attempt + 1)
      }
      if (toThrow) {
        performThrow(status, request, response)
      }
      response.request = request
      return response
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
    self[method] = function (url, query, headers) {
      return request(method, url, query, null, headers)
    }
  })
  methods = ['post', 'put', 'patch', 'delete']
  methods.forEach(function (method) {
    self[method] = function (url, payload, headers, query) {
      return request(method, url, query, payload, headers)
    }
  })

  /**
   * Perform GET request.
   *
   * @function BasicHttpClient#get
   *
   * @param {string} url
   * @param {QueryBag} [query]
   * @param {HeaderBag} [headers]
   *
   * @return {HttpResponsePromise}
   */

  /**
   * Perform HEAD request.
   *
   * @function BasicHttpClient#head
   *
   * @param {string} url
   * @param {QueryBag} [query]
   * @param {HeaderBag} [headers]
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
   * @param {HeaderBag} [headers]
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
   * @param {HeaderBag} [headers]
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
   * @param {HeaderBag} [headers]
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
   * @param {HeaderBag} [headers]
   *
   * @return {HttpResponsePromise}
   */
}

BasicHttpClient.getDefaults = getDefaults

module.exports = {
  Client: BasicHttpClient,
  /** @deprecated */
  getDefaults: getDefaults
}
