# (Unofficial) VoxEngine SDK

This repository contains simple SDK to ease development of VoxImplant 
scenarios.

Currently it consists of an advanced promise-based HTTP client (relatively to 
raw `Net` namespace) and SLF4J-alike logger.

It may be installed via classic npm call

```bash
npm i @ama-team/voxengine-sdk --save
```

And required as any other package:

```js
var sdk = require('@ama-team/voxengine-sdk');
```

## SLF4J-alike Logger

This library wraps standard `Logger` and adds support for log levels 
(that shouldn't be very useful, but who knows) and log message 
parameters (substitutions):

```js
var logger = new sdk.logger.slf4j.Slf4j('logger-name');

// ...

var user = 'Pavel',
    elapsed = 12.345,
    event = {name: 'CallEvents.Connected'};
    
call.addEventListener(CallEvents.Connected, function (event) {
    logger.info('{} has responded in {} seconds (event: {})', user, elapsed, event);
    // [INFO] logger-name: Pavel has responded in 12.345 seconds (event: {"name": "CallEvents.Connected"})
});
```

This logger provides `.trace()`, `.debug()`, `.notice()`, `.info()`, 
`.warn()`, `.error()` and `.log(logger.Level.*, pattern, substitutions...)` 
methods to print things, and `.setThreshold` method to configure output
filtering.

Full logger constructor signature looks like this:

```js
new Slf4j(name, level, writer);
```

where name will be printed before real content (to distinguish 
different loggers), level is `sdk.logger.Level` enum instance, and 
writer is anything that has `.write` method accepting string.

There is also factory to simplify new logger creation:

```js
var factory = new sdk.logger.slf4j.Factory(sdk.logger.Level.Info, Logger),
    httpLogger = factory.create('scenario.http'),
    logicLogger = factory.create('scenario.logic')
```

This will probably be useful for other VoxImplant-related packages 
rather than scenarios, though.

## Basic HTTP Client

This client is a simple wrapper around `Net.httpRequestAsync` primitive

```js
var sdk = require('@ama-team/voxengine-sdk'),
    client = new sdk.http.basic.Client(Net.httpRequestAsync, {retries: 9, throwOnServerError: true});

var call = client
    .get('http://my.backend.com/magic-phone-number.txt')
    .then(function(response) {
        return VoxEngine.callPSTN(response.payload);
    });
```

Basic client provides you with following methods:

- `get(url, [query, headers])`
- `head(url, [query, headers])`
- `post(url, [payload, headers])`
- `put(url, [payload, headers])`
- `patch(url, [payload, headers])`
- `delete(url, [payload, headers])`
- `request(method, url, query, payload, headers)`

with following rules:

- Query is an object where every key is associated with a
string value or array of string values
- The same applies to headers object
- Payload may be a string only
- There are no smart actions applied on url, so it will be passed 
through as-is (don't forget to specify host)
- Method is a string (surprise!) and can be set using `sdk.http.Method` 
enum

Every method returns a promise that either resolves with response or
rejects with `sdk.http.NetworkException`, `sdk.http.HttpException`, one 
of their children or `sdk.http.InvalidConfigurationException`. Whether 
an error will be thrown and how many retries will be made is defined in 
client settings passed as the second constructor argument:

```js
var settings = {
    retryOnNetworkError: true,
    throwOnServerError: false,
    retryOnServerError: true,
    throwOnClientError: false,
    retryOnClientError: false,
    // NotFound is a special case for 404 response code
    throwOnNotFound: false,
    retryOnNotFound: false,
    // VoxImplant is capable only of emitting GET and POST requests,
    // but this may be overcome by providing real method in
    // additional header
    methodOverrideHeader: 'X-HTTP-Method-Override',
    // those will be used on every request unless headers 
    // specified with request override these 
    headers: {},
    // maximum amount of request retries
    retries: 4,
    // alternative logger
    logger: new sdk.logger.slf4j.Slf4j('scenario.http.client-a')
};
```

Tou can tune client as you want to throw exceptions or return responses
on certain outcomes. Network errors always result in exception, 
however, you may enforce several retries to be made.

## REST client

Provided client exploits `Net` inhabitant capabilities to provide more 
fresh interface:

```js
var options = {
        baseUrl: 'http://backend/api/v1',
        // following stuff is purely optional
        attempts: 5,
        methodOverrideHeader: 'X-HTTP-Method-Override',
        logger: logger,
        serializer: {
            serialize: function (object) {
                return JSON.stringify(object);
            },
            deserialize: function (string) {
                return JSON.parse(string);               
            }
        },
        fixedHeaders: {
            'Content-Type': 'application/json'
        }
    },
    client = new sdk.http.rest.RestClient(Net.asyncHttpRequest, options);

client.put('/conversation/12345/finished', {timestamp: new Date().getTime()}, {'X-Entity-Version': '12'})
    .then(function (response) {
        logger.info('Received response: {}', response);
    }, function (error) {
        logger.error('Failed to perform request: {}', error);
        VoxEngine.terminate();
    });
```

REST client exposes main `.request(http.Method.*, route, payload, [query], [headers])` 
method, as well as shortcuts `.get(route, [query], [headers])`,
`.create(route, [payload], [headers])`, 
`.set(route, [payload], [headers])`, and 
`.delete(route, [payload], [headers])`. `http.Method.*` is a single 
string map, so you can use any HTTP method you may invent via 
`.request()` method.

## How do i require this stuff in VoxEngine?

If you don't already know, VoxImplant scripts are basically just a 
single file which is executed on external trigger. This limits your 
ability to `require` anything, including this particular library, but 
you can always bundle things down with a build tool of your choice.
I personally use Webpack, but was recommended of Browserify as well,
and, of course good old Grunt and Gulp should work too.

Don't forget that VoxImplant has scenario size limit of 128 kb, so 
don't require anything at sight, don't forget to minify things
you require and don't forget to strip comments off.

## ES5

This repository is developed as ES5 module because it is implied that 
built code would be injected directly in VoxImplant scenarios, which, in 
turn, do not support ES6 yet, and transpiling would dramatically harden
bug hunt.

## Testing

This package is using Mocha with Chai for test running, Istanbul for 
recording coverage metrics and Allure framework for reporting. If you 
want full-blown feedback, use `npm run test:report` to generate Allure 
report (don't forget to install 
[allure-commandline][allure-commandline] before), it will be placed in 
`build/report/allure` directory.

## Anything else?

We have [@ama-team/voxengine-definitions][@definitions] package that 
helps with autocompletion. Also, 
[scenario framework][@scenario-framework] and 
[script publishing tool][@publisher] were being developed at the moment
these lines were written, so there is probability that there is another 
useful tool for you.

There is no particular roadmap for this project, so you may use GitHub 
issues to propose any ideas you got. However, there is not much time
that could be devoted to this project.

## Self-esteem badge fund

[![npm version](https://img.shields.io/npm/v/@ama-team/voxengine-sdk.svg?style=flat-square)](https://www.npmjs.com/package/@ama-team/voxengine-sdk)

### Master branch / stable
 
[![CircleCI](https://img.shields.io/circleci/project/github/ama-team/voxengine-sdk/master.svg?style=flat-square)](https://circleci.com/gh/ama-team/voxengine-sdk)
[![Coveralls](https://img.shields.io/coveralls/ama-team/voxengine-sdk/master.svg?style=flat-square)](https://coveralls.io/github/ama-team/voxengine-sdk?branch=master)
[![Code Climate](https://img.shields.io/codeclimate/github/ama-team/voxengine-sdk.svg?style=flat-square)](https://codeclimate.com/github/ama-team/voxengine-sdk)

### Dev branch / incubating

[![CircleCI](https://img.shields.io/circleci/project/github/ama-team/voxengine-sdk/dev.svg?style=flat-square)](https://circleci.com/gh/ama-team/voxengine-sdk)
[![Coveralls](https://img.shields.io/coveralls/ama-team/voxengine-sdk/dev.svg?style=flat-square)](https://coveralls.io/github/ama-team/voxengine-sdk?branch=dev)

  [allure-commandline]: http://wiki.qatools.ru/display/AL/Allure+Commandline
  [@definitions]: https://github.com/ama-team/voxengine-definitions
  [@scenario-framework]: https://github.com/ama-team/voxengine-scenario-framework
  [@publisher]: https://github.com/ama-team/voximplant-publisher
