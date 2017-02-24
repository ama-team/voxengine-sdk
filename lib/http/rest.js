var Level = require('./../logger').Level,
    Method = require('./_common').Method;

/**
 * @param {Object.<string, string|string[]>} bag
 * @return {Object.<string, string[]>}
 */
function normalizeMultiParameterBag(bag) {
    if (!bag) {
        return {};
    }
    Object.keys(bag).forEach(function (key) {
        if (!(bag[key] instanceof Array)) {
            bag[key] = [bag[key]];
        }
    });
    return bag;
}

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
 * @implements Serializer
 * @constructor
 */
function JsonSerializer() {
    this.serialize = JSON.stringify;
    this.deserialize = JSON.parse;
}

/**
 * @class RestClientSettings
 *
 * @property {string|undefined} baseUrl String to prepend to every request route.
 * @property {Serializer|undefined} serializer Serializer to encode/decode messages, default: JsonSerializer
 * @property {number|undefined} attempts Maximum number of attempts for each request, default: `1`
 * @property {string|undefined} methodOverrideHeader Name of header that should conceal real request HTTP method,
 *   look up `X-HTTP-Method-Override` in nearest search engine. Default: none
 * @property {boolean|undefined} retryOnNetworkError Whether request should be retried on connection error,
 *   default: `true`
 * @property {boolean|undefined} retryOnServerError Whether request should be retried on server error (5xx),
 *   default: `true`
 * @property {boolean|undefined} retryOnClientError Whether request should be retried on client error (4xx),
 *   default: `false`
 * @property {Headers|undefined} fixedHeaders Object containing headers for every emitted request, default: `{}`
 * @property {InterpolationLoggerInterface|undefined} logger Sink to send log messages into, default: just empty
 *   callback
 */

/**
 * @class
 * @param {netHttpRequestAsync} transport
 * @param {RestClientSettings} settings
 */
function RestClient(transport, settings) {

    if (!transport) {
        throw {
            name: 'IllegalArgumentException',
            message: 'Invalid instance passed instead of Net.httpRequestAsync reference'
        }
    }

    var baseUrl= settings.baseUrl || '',
        serializer = settings.serializer || new JsonSerializer(),
        methodOverrideHeader = settings.methodOverrideHeader || null,
        maxAttempts = settings.attempts || 1,
        retryOnNetworkError = typeof settings.retryOnNetworkError === 'undefined' ? true : !!settings.retryOnNetworkError,
        retryOnServerError = typeof settings.retryOnServerError === 'undefined' ? true : !!settings.retryOnServerError,
        retryOnClientError = typeof settings.retryOnClientError === 'undefined' ? false : !!settings.retryOnClientError,
        fixedHeaders = settings.fixedHeaders || {},
        logger = settings.logger || {log: function () {}};

    /**
     * @param {Query} query
     * @return {string}
     */
    function assembleQueryString(query) {
        return Object.keys(query).reduce(function (carrier, key) {
            return carrier.concat(query[key].map(function (value) {
                return encodeURIComponent(key) + '=' + encodeURIComponent(value);
            }));
        }, []).join('&');
    }

    /**
     * @param {Headers} headers
     * @return {string[]}
     */
    function assembleHeaders(headers) {
        return Object.keys(headers).reduce(function (_, k) {
            return _.concat(headers[k].map(function (v) {
                return k + ': ' + v;
            }));
        }, []);
    }
    /**
     * @param {Headers} headers
     * @return {Headers}
     */
    function collectHeaders(headers) {
        var result = normalizeMultiParameterBag(fixedHeaders),
            extraHeaders = normalizeMultiParameterBag(headers);
        Object.keys(extraHeaders).forEach(function (key) {
            result[key] = extraHeaders[key];
        });
        return result;
    }

    function missingResourceHandler(response, request, attempt) {
        logger.log(Level.Warn,'Got missing resource response while executing request {} on attempt #{}: {}', request,
            attempt, response);
        throw {
            name: 'MissingResourceException',
            code: 404,
            headers: response.headers,
            payload: null
        };
    }

    function redirectHandler(response, request, attempt) {
        var location = response.headers.Location || response.headers.location;
        if (!location) {
            logger.log(Level.Warn, 'Invalid redirect response received ({}), retrying', response);
            return tryPerformRequest(request, attempt + 1);
        }
        logger.log(Level.Info, 'Received redirect response, trying location {}', location);
        var nextRequest = {
            method: request.method,
            url: location,
            headers: request.headers,
            body: request.body
        };
        return tryPerformRequest(nextRequest, 1);
    }

    function clientErrorHandler(response, request, attempt) {
        if (!retryOnClientError) {
            throw {
                name: 'ClientErrorException',
                message: 'Got unexpected client error in response, retry is restricted by configuration',
                request: request,
                response: response
            }
        }
        logger.log(Level.Error, 'Failed to execute request {}, attempt #{}: got client error ({})', request, attempt,
            response);
        return tryPerformRequest(request, attempt + 1);
    }

    function serverErrorHandler(response, request, attempt) {
        if (!retryOnServerError) {
            throw {
                name: 'ServerErrorException',
                message: 'Got unexpected server error in response, retry is restricted by configuration',
                request: request,
                response: response
            }
        }
        logger.log(Level.Warn, 'Failed to execute request {}, attempt #{}: got server error ({})', request, attempt,
            response);
        return tryPerformRequest(request, attempt + 1);
    }

    //noinspection JSUnusedLocalSymbols
    function invalidRequestErrorHandler(response, request, attempt) {
        throw {
            name: 'InvalidRequestException',
            message: 'Could not execute malformed request',
            request: request
        }
    }

    //noinspection JSUnusedLocalSymbols
    function successHandler(response, request, attempt) {
        return {
            code: response.code,
            headers: response.headers,
            payload: response.body ? serializer.deserialize(response.body) : null
        };
    }

    //noinspection JSUnusedLocalSymbols
    function networkErrorHandler(response, request, attempt) {
        if (!retryOnNetworkError) {
            throw {
                name: 'NetworkErrorException',
                message: 'Failed to perform request due to connection error, retry is restricted by configuration',
                request: request
            };
        }
        logger.log(Level.Warn, 'Failed to execute request {}, attempt #{}: got connection error', request, attempt);
        return tryPerformRequest(request, attempt + 1);
    }

    /**
     * @param {Request} request
     * @param {Number} attempt
     */
    function tryPerformRequest(request, attempt) {
        var url,
            queryString,
            exception,
            options,
            nonStandardMethod;

        if (attempt > maxAttempts) {
            exception = {
                name: 'MaximumRetryAmountExceededException',
                message: 'Could not execute request in provided amount of retries'
            };
            return Promise.reject(exception);
        }
        logger.log(Level.DEBUG, 'Trying to execute request {}', request);
        nonStandardMethod = [Method.Get, Method.Post].indexOf(request.method) === -1;
        if (nonStandardMethod && !methodOverrideHeader) {
            exception = {
                name: 'InvalidConfigurationException',
                message: 'Can\'t perform ' + request.method + ' request without `methodOverrideHeader` setting'
            };
            return Promise.reject(exception)
        }
        options = new Net.HttpRequestOptions();
        options.method = request.method === Method.Get ? Method.Get : Method.Post;
        options.headers = [];
        if (request.method !== options.method) {
            options.headers.push(methodOverrideHeader + ': ' + request.method);
        }
        assembleHeaders(request.headers).forEach(function (header) {
            options.headers.push(header);
        });

        queryString = assembleQueryString(request.query);
        url = request.url + (queryString.length > 0 ? '?' : '') + queryString;
        options.postData = request.payload;

        return transport(url, options)
            .then(function (result) {
                if (result.code == -2) {
                    return invalidRequestErrorHandler(result, request, attempt)
                }
                if (result.code == 404) {
                    return missingResourceHandler(result, request, attempt);
                }
                if (result.code >= 500) {
                    return serverErrorHandler(result, request, attempt);
                }
                if (result.code >= 400) {
                    return clientErrorHandler(result, request, attempt);
                }
                if (result.code >= 300) {
                    return redirectHandler(result, request, attempt);
                }
                if (result.code >= 200) {
                    return successHandler(result, request, attempt);
                }
                return networkErrorHandler(result, request, attempt);
            });
    }

    /**
     * Performs request (whoa, that hasn't been expected)
     *
     * @param {string} method HTTP method
     * @param {string} route Route to use
     * @param {Query} [query] Query parameters
     * @param {Object} [payload] Raw payload (serialized internally)
     * @param {Headers} [headers] Set of headers to use
     * @return {Promise.<Response>} Promise for response
     */
    this.request = function (method, route, payload, query, headers) {
        var request = {
                url: baseUrl + route,
                method : method,
                query: normalizeMultiParameterBag(query || {}),
                headers: collectHeaders(headers || {}),
                payload: payload ? serializer.serialize(payload) : null
            };
        return tryPerformRequest(request, 1);
    };

    //noinspection JSUnusedGlobalSymbols
    this.get = function (route, query, headers) {
        return this.request(Method.Get, route, null, query, headers);
    };

    //noinspection JSUnusedGlobalSymbols
    this.create = function (route, payload, headers) {
        return this.request(Method.Post, route, payload, null, headers);
    };

    //noinspection JSUnusedGlobalSymbols
    this.set = function (route, payload, headers) {
        return this.request(Method.Put, route, payload, null, headers);
    };

    //noinspection JSUnusedGlobalSymbols
    this.delete = function (route, payload, headers) {
        return this.request(Method.Delete, route, payload, null, headers);
    }
}

var Defaults = {
    methodOverrideHeader: 'X-HTTP-Method-Override',
    attempts: 5,
    serializer: new JsonSerializer()
};

/** @deprecated use {@link Defaults} */
RestClient.DEFAULT_SETTINGS = Defaults;

exports = module.exports = {
    Client: RestClient,
    Defaults: Defaults,
    /** @deprecated Use http.Method instead */
    Method: Method
};
