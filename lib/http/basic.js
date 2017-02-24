var Commons = require('./_common'),
    Slf4j = require('../logger').slf4j.Slf4j;

/**
 * Provides client configuration defaults.
 *
 * @returns {BasicHttpClientSettings}
 */
function getDefaults() {
    return {
        retryOnNetworkError: true,
        throwOnServerError: true,
        retryOnServerError: true,
        throwOnClientError: false,
        retryOnClientError: false,
        throwOn404: false,
        retryOn404: false,
        retries: 4,
        logger: new Slf4j('ama-team.voxengine-sdk.http.basic')
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
    ClientError: 'ClientRetry',
    NotFound: 'NotFound',
    Ok: 'Ok'
};

/**
 * @class BasicHttpClientSettings
 *
 * @property {bool} retryOnNetworkError
 * @property {bool} throwOnServerError
 * @property {bool} retryOnServerError
 * @property {bool} throwOnClientError
 * @property {bool} retryOnClientError
 * @property {bool} throwOnNotFound
 * @property {bool} retryOnNotFound
 * @property {Headers} headers
 * @property {int} retries
 * @property {VarArgLogger} logger
 */

/**
 * @class
 *
 * @param {netHttpRequestAsync} transport
 * @param {BasicHttpClientSettings} [settings]
 */
function BasicHttpClient(transport, settings) {

    settings = settings || {};
    var defaults = getDefaults(),
        logger = getSetting('logger');

    function computeStatus(code) {
        if (code < 200) return ResponseStatus.NetworkError;
        if (code < 400) return ResponseStatus.Ok;
        if (code == 404) return ResponseStatus.NotFound;
        if (code < 500) return ResponseStatus.ClientError;
        return ResponseStatus.ServerError;
    }

    function fetchSetting(source, key, def) { return source[key] !== undefined ? source[key] : def; }

    function getSetting(key, def) { return fetchSetting(settings, key, fetchSetting(defaults, key, def)); }

    function shouldRetry(status, attempt) {
        // number of attempts = 1 + number of retries, so it's 'greater than' rather than 'greater or equal to'
        // comparison
        if (attempt > getSetting('retries')) return false;
        return getSetting('retryOn' + status, false);
    }

    function shouldThrow(status) {
        return getSetting('throwOn' + status, false);
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
        var ExceptionClass = Commons.codeExceptionIndex[response.code] || Commons.NetworkException;
        throw new ExceptionClass(response.code, null, request, response);
    }

    function execute(request) {
        request.query = Commons.query.normalize(request.query);
        request.headers = Commons.headers.normalize(request.headers);
        if (request.payload === '') request.payload = null;
        return executionLoop(request, 1);
    }

    function executionLoop(req, attempt) {
        var qs = Commons.query.encode(req.query),
            url = req.url + (qs.length > 0 ? '?' + qs : ''),
            opts = new Net.HttpRequestOptions();
        opts.method = req.method.toUpperCase();
        opts.postData = req.payload;
        opts.headers = Commons.headers.encode(Commons.headers.merge(getSetting('headers', {}), req.headers));
        logger.debug('Executing request `{} {}`, attempt #{}', req.method, url, attempt);
        return transport(url, opts).then(function (resp) {
            var response = {code: resp.code, headers: Commons.headers.decode(resp.headers), payload: resp.text},
                status = computeStatus(resp.code || 0),
                toRetry = shouldRetry(status, attempt),
                toThrow = !toRetry && shouldThrow(status);
            logger.debug('Request `{} {}` (attempt #{}) ended with code `{}` / status `{}`, (retry: {}, throw: {})',
                    req.method, url, attempt, resp.code, status, toRetry, toThrow);
            if (toRetry) executionLoop(req, attempt + 1);
            if (toThrow) performThrow(status, req, response);
            return response;
        });
    }

    //noinspection JSUnusedGlobalSymbols
    this.execute = execute;
    this.request = function request(method, url, query, payload, headers) {
        return execute({url: url, method: method, headers: headers, query: query, payload: payload});
    };

    ['get', 'head'].forEach(function (m) {
        this[m] = function (url, query, headers) { return request(m, url, query, null, headers); };
    });
    ['post', 'put', 'patch', 'delete'].forEach(function (m) {
        this[m] = function (url, payload, headers) { return request(m, url, {}, payload, headers); };
    });
}

module.exports = {
    Client: BasicHttpClient,
    getDefaults: getDefaults
};
