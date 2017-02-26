/**
 * @module http/rest
 */

var Commons = require('./_common'),
    Method = Commons.Method,
    basic = require('./basic'),
    slf4j = require('../logger').slf4j;

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
function JsonSerializer() {
    this.serialize = JSON.stringify;
    this.deserialize = JSON.parse;
}

/**
 * @class RestClientSettings
 *
 * @property {string|undefined} url String to prepend to every request route.
 * @property {Serializer|undefined} serializer Serializer to encode/decode messages, default: JsonSerializer
 * @property {number|undefined} retries Maximum number of retries for each request, default: `4`
 * @property {string|undefined} methodOverrideHeader Name of header that should conceal real request HTTP method,
 *   look up `X-HTTP-Method-Override` in nearest search engine. Default: none
 * @property {boolean|undefined} retryOnNetworkError Whether request should be retried on connection error,
 *   default: `true`
 * @property {boolean|undefined} retryOnServerError Whether request should be retried on server error (5xx),
 *   default: `true`
 * @property {Headers|undefined} headers Object containing headers for every emitted request, default: `{}`
 * @property {object} loggerFactory Factory for logger creation.
 * @property {IHttpClient} client Underlying http client
 */

//noinspection JSClosureCompilerSyntax
/**
 * @class
 *
 * @implements IRestClient
 *
 * @param {netHttpRequestAsync} transport
 * @param {RestClientSettings|Object} [settings]
 */
function RestClient(transport, settings) {

    var self = this,
        opts = getDefaults(),
        client,
        clientOpts = basic.getDefaults(),
        logger;

    settings = settings || {};
    Object.keys(opts).forEach(function (_) {
        if (_ in settings) clientOpts[_] = opts[_] = settings[_];
    });
    client = settings.client || new basic.Client(transport, settings);
    //noinspection JSUnusedAssignment
    logger = opts.loggerFactory('ama-team.voxengine-sdk.http.rest');

    function execute(request) {
        var _ = {url: request.route, method : request.method, query: request.query || {}, headers: request.headers || {}};
        _.payload = request.payload ? opts.serializer.serialize(request.payload) : null;
        return client.execute(_).then(function (res) {
            return {
                code: res.code,
                payload: res.payload ? opts.serializer.deserialize(res.payload) : null,
                headers: res.headers || {},
                request: request
            };
        });
    }

    /**
     * @inheritDoc
     */
    function request(method, route, payload, query, headers) {
        return execute({route: route, method: method, query: query, payload: payload, headers: headers});
    }

    /**
     * @inheritDoc
     */
    this.execute = execute;

    /**
     * @inheritDoc
     */
    this.request = request;

    /**
     * @inheritDoc
     */
    this.exists = function (route, query, headers) {
        return execute({method: Method.Head, route: route, query: query, headers: headers})
            .then(function (response) {
                return response.code !== 404;
            });
    };

    /**
     * @inheritDoc
     */
    this.get = function (route, query, headers) {
        return self
            .request(Method.Get, route, null, query, headers)
            .then(function (response) {
                return response.code === 404 ? null : response.payload;
            });
    };

    var methods = {create: Method.Post, set: Method.Put, modify: Method.Patch, delete: Method.Delete};
    Object.keys(methods).forEach(function (method) {
        self[method] = function (route, payload, headers) {
            return request(methods[method], route, payload, {}, headers)
                .then(function (response) {
                    if (response.code === 404) {
                        var m = 'Modification request has returned 404 status code';
                        throw new Commons.NotFoundException(m, response.request, response);
                    }
                    return response.payload;
                });
        };
    });
}

function getDefaults() {
    return {
        url: '',
        client: null,
        serializer: new JsonSerializer(),
        retries: 4,
        methodOverrideHeader: null,
        retryOnServerError: true,
        retryOnNetworkError: true,
        headers: {},
        loggerFactory: slf4j.factory()
    }
}

module.exports = {
    Client: RestClient,
    getDefaults: getDefaults()
};
