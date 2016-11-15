/**
 * @module http-client
 */

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
 * @typedef {Object} RestResponse
 *
 * @property {Number} code Response code
 * @property {string} reason Stringified response status
 * @property {Headers} headers Response headers
 * @property {Object|null} payload Decoded response payload
 */

/**
 * Simple request wrapper
 *
 * @typedef {Object} RestRequest
 *
 * @property {string} url Url to execute request against
 * @property {HTTP_METHODS} method HTTP method
 * @property {Query|null} query Request query
 * @property {Headers|null} headers Request headers
 * @property {Object|null} payload Serialized request payload
 */

/**
 * @enum {string}
 * @readonly
 */
const HTTP_METHODS = {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    DELETE: 'DELETE'
};

/**
 * @class
 * @constructor
 * @param {netHttpRequestAsync} netHttpRequestAsync
 * @param {module:logger.slf4j} logger
 * @param {string} baseUrl
 * @param {object} settings
 */
function RestClient(netHttpRequestAsync, logger, baseUrl, settings) {

    if (!netHttpRequestAsync) {
        throw {
            name: 'Illegal Argument',
            message: 'Invalid instance passed instead of Net.httpRequestAsync reference'
        }
    }

    if (!baseUrl) {
        throw {
            name: 'Illegal Argument',
            message: 'Invalid baseUrl passed'
        }
    }

    var methodOverrideHeader = settings.methodOverrideHeader || null,
        maxAttempts = settings.attempts || 1,
        retryOnConnectionError = settings.retryOnConnectionError || true,
        retryOnServerError = settings.retryOnServerError || true,
        retryOnClientError = settings.retryOnClientError || false,
        fixedHeaders = settings.fixedHeaders || {};

    function normalizeMultiParameterBag(bag) {
        var result = {};
        Object.keys(bag).forEach(function (key) {
            result[key] = typeof bag[key] === 'string' ? [bag[key]] : bag[key];
        });
        return result;
    }

    /**
     * @param {Headers} headers
     * @return {Headers}
     */
    function preprocessHeaders(headers) {
        var result = normalizeMultiParameterBag(fixedHeaders),
            extraHeaders = normalizeMultiParameterBag(headers);
        Object.keys(extraHeaders).forEach(function (key) {
            result[key] = extraHeaders[key];
        });
        return result;
    }

    /**
     * @param {Query} query
     * @return {Query}
     */
    function preprocessQuery(query) {
        return normalizeMultiParameterBag(query);
    }

    function missingResourceHandler(response, request, attempt) {
        logger.log('Got missing resource response while executing request {} on attempt #{}: {}', request, attempt,
            response);
        throw {
            code: 404,
            headers: response.headers,
            payload: null
        };
    }

    function redirectHandler(response, request, attempt) {
        var location = response.headers.Location || response.headers.location;
        if (!location) {
            logger.log("Invalid redirect response received ({}), retrying", response);
            return tryPerformRequest(request, attempt + 1);
        }
        logger.log("Received redirect response, trying location {}", location);
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
                name: 'Client Error',
                message: 'Got unexpected client error in response, retry is restricted by configuration',
                request: request,
                response: response
            }
        }
        logger.log('Failed to execute request {}, attempt #{}: got client error ({})', request, attempt, response);
        return tryPerformRequest(request, attempt + 1);
    }

    function serverErrorHandler(response, request, attempt) {
        if (!retryOnServerError) {
            throw {
                name: 'Server Error',
                message: 'Got unexpected server error in response, retry is restricted by configuration',
                request: request,
                response: response
            }
        }
        logger.log('Failed to execute request {}, attempt #{}: got server error ({})', request, attempt, response);
        return tryPerformRequest(request, attempt + 1);
    }

    //noinspection JSUnusedLocalSymbols
    function invalidRequestErrorHandler(response, request, attempt) {
        throw {
            name: 'Invalid Request',
            message: 'Could not execute malformed request',
            request: request
        }
    }

    //noinspection JSUnusedLocalSymbols
    function successHandler(response, request, attempt) {
        return {
            code: response.code,
            headers: response.headers,
            payload: response.body ? JSON.parse(response.body) : null
        };
    }

    //noinspection JSUnusedLocalSymbols
    function connectionErrorHandler(response, request, attempt) {
        if (!retryOnConnectionError) {
            throw {
                name: 'Connection Error',
                message: 'Failed to perform request due to connection error, retry is restricted by configuration',
                request: request
            };
        }
        logger.log('Failed to execute request {}, attempt #{}: got connection error', request, attempt);
        return tryPerformRequest(request, attempt + 1);
    }

    /**
     * @param {RestRequest} request
     * @param {Number} attempt
     */
    function tryPerformRequest(request, attempt) {
        var exception,
            options,
            overridableMethod;
        if (attempt > maxAttempts) {
            exception = {
                name: 'Maximum retry amount exceeded',
                message: 'Could not execute request in provided amount of retries'
            };
            return Promise.reject(exception);
        }
        logger.log("Trying to execute request {}", request);
        overridableMethod = request.method !== HTTP_METHODS.GET && request.method !== HTTP_METHODS.POST;
        if (overridableMethod && !methodOverrideHeader) {
            exception = {
                name: 'Invalid configuration',
                message: 'Can\'t perform ' + request.method + ' request without `methodOverrideHeader` setting'
            };
            return Promise.reject(exception)
        }
        options = new Net.HttpRequestOptions();
        options.method = request.method == HTTP_METHODS.GET ? HTTP_METHODS.GET : HTTP_METHODS.POST;
        if (request.method != HTTP_METHODS.POST) {
            options.headers = [methodOverrideHeader + ': ' + request.method]
        }
        options.postData = request.body;

        return netHttpRequestAsync(request.url, options)
            .then(function (result) {
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
                if (result.code == -2) {
                    return invalidRequestErrorHandler(result, request, attempt)
                }
                return connectionErrorHandler(result, request, attempt);
            });
    }

    /**
     * Performs request (whoa, that hasn't been expected)
     *
     * @param {string} method HTTP method
     * @param {string} route Route to use
     * @param {Query|null} query Query parameters
     * @param {Object|null} payload Raw payload (serialized internally)
     * @param {Headers} headers Set of headers to use
     * @return {Promise.<RestResponse>} Promise for response
     */
    this.request = function (method, route, query, payload, headers) {
        var request = {
                url: baseUrl + route,
                method : method,
                query: preprocessQuery(query || {}),
                headers: preprocessHeaders(headers || {}),
                payload: payload ? JSON.stringify(payload) : null
            };
        return tryPerformRequest(request, 1);
    };

    this.get = function (route, query, headers) {
        return this.request(HTTP_METHODS.GET, route, query, null, headers);
    };

    this.create = function (route, payload, headers) {
        return this.request(HTTP_METHODS.POST, route, null, payload, headers);
    };

    this.set = function (route, payload, headers) {
        return this.request(HTTP_METHODS.PUT, route, null, payload, headers);
    };

    this.delete = function (route, payload, headers) {
        return this.request(HTTP_METHODS.DELETE, route, null, payload, headers);
    }
}

RestClient.DEFAULT_SETTINGS = {
    methodOverrideHeader: 'X-HTTP-Method-Override',
    attempts: 5
};

module.exports.rest = RestClient;