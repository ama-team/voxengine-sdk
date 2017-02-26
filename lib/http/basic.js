var Commons = require('./_common'),
    slf4j = require('../logger').slf4j;

/**
 * Provides client configuration defaults.
 *
 * @returns {BasicHttpClientSettings}
 */
function getDefaults() {
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
        loggerFactory: slf4j.factory()
    };
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
    Ok: 'Ok'
};

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
 * @property {object} loggerFactory Factory to produce a logger.
 */

/**
 * @class
 *
 * @param {netHttpRequestAsync} [transport]
 * @param {BasicHttpClientSettings|object} [settings]
 */
function BasicHttpClient(transport, settings) {
    transport = transport || Net.httpRequestAsync;
    settings = settings || {};
    var defaults = getDefaults(),
        logger = setting('loggerFactory')('ama-team.voxengine-sdk.http.basic'),
        self = this;

    function computeStatus(code) {
        if (code < 200 || !code) return ResponseStatus.NetworkError;
        if (code < 400) return ResponseStatus.Ok;
        if (code == 404) return ResponseStatus.NotFound;
        if (code < 500) return ResponseStatus.ClientError;
        return ResponseStatus.ServerError;
    }

    function fetch(source, key, def) {
        return source[key] !== undefined ? source[key] : def;
    }

    function setting(key, def) {
        return fetch(settings, key, fetch(defaults, key, def));
    }

    function shouldRetry(status, attempt) {
        // number of attempts = 1 + number of retries, so it's 'greater than' rather than 'greater or equal to'
        // comparison
        if (attempt > setting('retries')) return false;
        return setting('retryOn' + status, false);
    }

    function shouldThrow(status) {
        if (status === ResponseStatus.NetworkError) return true;
        return setting('throwOn' + status, false);
    }

    function performThrow(status, request, response) {
        // yes, i'm counting bytes and switch is more expensive
        if (status === ResponseStatus.ServerError)
            throw new Commons.ServerErrorException('Server returned erroneous response', request, response);
        else if (status === ResponseStatus.ClientError)
            throw new Commons.ClientErrorException('Client has performed an invalid request', request, response);
        else if (status === ResponseStatus.NotFound)
            throw new Commons.NotFoundException('Requested resource hasn\'t been found', request, response);
        // get exception with specified code, otherwise use default one
        var eClass = Commons.codeExceptionIndex[response.code] || Commons.NetworkException;
        throw new eClass(null, response.code, request, response);
    }

    /**
     * Executes HTTP request.
     *
     * @param {HttpRequest} request
     * @return {Promise.<HttpResponse>}
     */
    function execute(request) {
        request.method = request.method.toUpperCase();
        if (['POST', 'GET'].indexOf(request.method) === -1 && !setting('methodOverrideHeader')) {
            var m = 'Tried to execute non-GET/POST request without specifying methodOverrideHeader in settings';
            return Promise.reject(new Commons.InvalidConfigurationException(m));
        }
        request.query = Commons.query.normalize(request.query);
        request.headers = Commons.headers.normalize(request.headers);
        if (!request.payload) request.payload = null;
        request.url = setting('url') + request.url;
        return executionLoop(request, 1);
    }

    function executionLoop(request, attempt) {
        var qs = Commons.query.encode(request.query),
            url = request.url + (qs.length > 0 ? '?' + qs : ''),
            opts = new Net.HttpRequestOptions(),
            method = ['HEAD', 'GET'].indexOf(request.method) === -1 ? 'POST' : 'GET',
            headers = Commons.headers.merge(setting('headers', {}), request.headers);
        if (method !== request.method) {
            headers[setting('methodOverrideHeader')] = [request.method];
        }
        opts.method = method;
        opts.postData = request.payload;
        opts.headers = Commons.headers.encode(headers);
        logger.debug('Executing request `{} {}`, attempt #{}', request.method, url, attempt);
        return transport(url, opts).then(function (resp) {
            var response = {code: resp.code, headers: Commons.headers.decode(resp.headers), payload: resp.text},
                status = computeStatus(resp.code),
                toRetry = shouldRetry(status, attempt),
                toThrow = !toRetry && shouldThrow(status);
            logger.debug('Request `{} {}` (attempt #{}) ended with code `{}` / status `{}`, (retry: {}, throw: {})',
                    request.method, url, attempt, resp.code, status, toRetry, toThrow);
            if (toRetry) return executionLoop(request, attempt + 1);
            if (toThrow) performThrow(status, request, response);
            response.request = request;
            return response;
        });
    }

    function request(method, url, query, payload, headers) {
        return execute({url: url, method: method, headers: headers, query: query, payload: payload});
    }

    //noinspection JSUnusedGlobalSymbols
    this.execute = execute;
    this.request = request;

    ['get', 'head'].forEach(function (m) {
        self[m] = function (url, query, headers) { return request(m, url, query, null, headers); };
    });
    ['post', 'put', 'patch', 'delete'].forEach(function (m) {
        self[m] = function (url, payload, headers) { return request(m, url, {}, payload, headers); };
    });

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

module.exports = {
    Client: BasicHttpClient,
    getDefaults: getDefaults
};
