/**
 * @callback netHttpRequestAsync
 * @param {string} url
 * @param {Net.HttpRequestOptions} options
 * @return {Promise}
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
 * @param {Slf4jAlikeLogger} logger
 * @param {string} baseUrl
 * @param {object} settings
 */
class RestClient {

    constructor (netHttpRequestAsync, logger, baseUrl, settings) {
        this.methodOverrideHeader = settings.methodOverrideHeader || null;
        this.attempts = settings.attempts || 1;
        this.retryOnConnectionError = settings.retryOnConnectionError || true;
        this.retryOnServerError = settings.retryOnServerError || true;
        this.retryOnClientError = settings.retryOnClientError || false;
        this.fixedHeaders = settings.fixedHeaders || {};
        this.logger = logger;

        if (!baseUrl) {
            throw {
                name: 'Illegal Argument',
                message: 'Invalid baseUrl passed'
            }
        }
        this.baseUrl = baseUrl;
        if (!netHttpRequestAsync) {
            throw {
                name: 'Illegal Argument',
                message: 'Invalid instance passed instead of Net.httpRequestAsync reference'
            }
        }
        this.netHttpRequestAsync = netHttpRequestAsync;
    }

    assembleHeaders (headers) {
        let result = {},
            key;
        for (key in fixedHeaders) {
            if (fixedHeaders.hasOwnProperty(key)) {
                result[key] = fixedHeaders[key];
            }
        }
        for (key in headers) {
            if (headers.hasOwnProperty(key)) {
                result[key] = headers[key];
            }
        }
        return result;
    }

    missingResourceHandler (response, request, attempt) {
        this.logger.log('Got missing resource response while executing request {} on attempt #{}: {}', request, attempt,
            response);
        return {
            code: 404,
            headers: response.headers,
            payload: null
        };
    }

    redirectHandler (response, request, attempt) {
        var location = response.headers.Location || response.headers.location;
        if (!location) {
            this.logger.log("Invalid redirect response received ({}), retrying", response);
            return tryPerformRequest(request, attempt + 1);
        }
        this.logger.log("Received redirect response, trying location {}", location);
        var nextRequest = {
            method: request.method,
            url: location,
            headers: request.headers,
            body: request.body
        };
        return this.tryPerformRequest(nextRequest, 1);
    }

    clientErrorHandler (response, request, attempt) {
        if (!this.retryOnClientError) {
            throw {
                name: 'Client Error',
                message: 'Got unexpected client error in response, retry is restricted by configuration',
                request: request,
                response: response
            }
        }
        this.logger.log('Failed to execute request {}, attempt #{}: got client error ({})', request, attempt, response);
        return this.tryPerformRequest(request, attempt + 1);
    }

    serverErrorHandler (response, request, attempt) {
        if (!this.retryOnServerError) {
            throw {
                name: 'Server Error',
                message: 'Got unexpected server error in response, retry is restricted by configuration',
                request: request,
                response: response
            }
        }
        this.logger.log('Failed to execute request {}, attempt #{}: got server error ({})', request, attempt, response);
        return this.tryPerformRequest(request, attempt + 1);
    }

    invalidRequestErrorHandler (response, request, attempt) {
        throw {
            name: 'Invalid Request',
            message: 'Could not executed malformed request',
            request: request
        }
    }

    successHandler (response, request, attempt) {
        return {
            code: response.code,
            headers: response.headers,
            payload: response.body ? JSON.parse(response.body) : null
        };
    }

    connectionErrorHandler (response, request, attempt) {
        if (!this.retryOnConnectionError) {
            throw {
                name: 'Connection Error',
                message: 'Failed to perform request due to connection error, retry is restricted by configuration',
                request: request
            };
        }
        this.logger.log('Failed to execute request {}, attempt #{}: got connection error', request, attempt);
        return this.tryPerformRequest(request, attempt + 1);
    }

    tryPerformRequest(request, attempt) {
        let exception,
            options;
        if (attempt > attempts) {
            exception = {
                name: 'Maximum retry amount exceeded',
                message: 'Could not execute request in provided amount of retries'
            };
            return new Promise().reject(exception);
        }
        this.logger.log("Trying to execute request {}", request);
        if (!(request.method in [HTTP_METHODS.GET, HTTP_METHODS.POST]) && !this.methodOverrideHeader) {
            exception = {
                name: 'Invalid configuration',
                message: 'Can\'t perform ' + request.method + ' without `methodOverrideHeader` setting'
            };
            return new Promise().reject(exception)
        }
        options = new Net.HttpRequestOptions();
        options.method = request.method == HTTP_METHODS.GET ? HTTP_METHODS.GET : HTTP_METHODS.POST;
        if (request.method != HTTP_METHODS.POST) {
            options.headers = [`${this.methodOverrideHeader}: ${request.method}`]
        }
        options.postData = request.body;

        return netHttpRequestAsync(request.url, options)
            .then(result => {
                if (result.code == 404) {
                    return this.missingResourceHandler(result, request, attempt);
                }
                if (result.code >= 500) {
                    return this.serverErrorHandler(result, request, attempt);
                }
                if (result.code >= 400) {
                    return this.clientErrorHandler(result, request, attempt);
                }
                if (result.code >= 300) {
                    return this.redirectHandler(result, request, attempt);
                }
                if (result.code >= 200) {
                    return this.successHandler(result, request, attempt);
                }
                if (result.code == -2) {
                    return this.invalidRequestErrorHandler(result, request, attempt)
                }
                return this.connectionErrorHandler(result, request, attempt);
            });
    }

    request (method, route, payload, headers) {
        let assembledHeaders = this.assembleHeaders(headers),
            url = this.baseUrl + route,
            body = payload ? JSON.stringify(payload) : null;
        return this.tryPerformRequest(method, url, body, assembledHeaders, 1);
    };

    get (route, headers) { this.request('GET', route, null, headers); }
    create (route, payload, headers) { this.request('POST', route, payload, headers); }
    set (route, payload, headers) { this.request('PUT', route, payload, headers); }
    remove (route, payload, headers) { this.request('DELETE', payload, headers); }
}

RestClient.DEFAULT_SETTINGS = {
    methodOverrideHeader: 'X-HTTP-Method-Override',
    attempts: 5
};

export default RestClient;