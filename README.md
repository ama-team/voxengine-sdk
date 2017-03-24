# (Unofficial) VoxEngine SDK

This repository contains simple SDK to ease development of VoxImplant 
scenarios.

Currently it consists of promise-based HTTP client (a little bit more 
advanced than raw `Net.httpRequestAsync`), REST client, which is a 
simple sugar wrapper for HTTP client, and SLF4J-alike logger.

It may be installed via classic npm call

```bash
npm i @ama-team/voxengine-sdk --save
```

And required as any other package:

```js
var sdk = require('@ama-team/voxengine-sdk');
```

## SLF4J-alike Logger

This library wraps standard `Logger` and adds support for logger names,
log levels (that shouldn't be very useful, but who knows) and log 
message parameters (substitutions):

```js
var logger = sdk.logger.slf4j.Slf4j.create('logger.name');

// ...

var user = 'Pavel',
    elapsed = 12.345,
    metadata = {roles: ['lead'], extras: []};
    
call.addEventListener(CallEvents.Connected, function () {
    logger.info('{} has responded in {} seconds (meta: {})', user, elapsed, metadata);
    // [INFO] logger.name: Pavel has responded in 12.345 seconds (meta: {"roles": ["lead"], "extras": []})
});
```

This logger provides `.trace()`, `.debug()`, `.notice()`, `.info()`, 
`.warn()`, `.error()` and `.log(logger.Level.*, pattern, substitutions...)` 
methods to print things. Also there are `.attach(key, value)`, 
`.detach(key)`, `.attachAll(object)` and `.detachAll()` methods for
functionality known as Mapped Diagnostic Context in Logback:

```js
var logger = sdk.logger.slf4j.Slf4j.create('logger.name')
logger.attach('id', '123')
logger.info('Sending custom event')
// [INFO] logger.name [id=123]: Sending custom event 
```

This may help you if you have similar logging output but need to 
distinguish components one from another.

Whenever you need to turn off particular logger or increase verbosity
in other, you may use `Slf4j` static methods to configure previously-created
loggers:

- `Slf4j.setThreshold([name], logger.Level)` - sets threshold for 
logger with name, if name is omitted, global default threshold is set.
- `Slf4j.setWriter([name], Logger || Writable)` - same thing for writer.

### Internals

Every logger is created in `Context` that defines which logger should
receive which threshold and writer. `Slf4j.create()` is basically a 
wrapper for `slf4j~DefaultContext.create()`, and that very context is
passed to the logger at creation, so on every call it queries context
for current configuration.

`Slf4j` class is fully compatible (has all the types / quacks like a)
with `slf4j.Context` instance, so if you need to substitute default 
context for any reason, you can do that with ease:

```js
function Component(loggerContext) {
  loggerContext = loggerContext || sdk.slf4j.Slf4j;
  var logger = loggerContext.create('my.super.component')
  this.shout = function() {
  logger.info('I may be using standalone context! Or not.')
  }
}

var localContext = new sdk.logger.slf4j.Context()
localContext.setWriter(new TestReportWriter())
var component = new Component(localContext)
component.shout()
```

## Basic HTTP Client

This client is a simple wrapper around `Net.httpRequestAsync` primitive

```js
var sdk = require('@ama-team/voxengine-sdk'),
    options = {
        url: 'http://my.backend.com',
        retries: 9,
        throwOnServerError: true
    },
    client = new sdk.http.basic.Client(options);

var call = client
    .get('/magic-phone-number.txt')
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
- `request(method, url, [query, payload, headers])`

with following rules:

- Query is an object where every key is associated with a
string value or array of string values.
- The same applies to headers object.
- Payload may be a string only.
- URL is built by simple concatenation of `options.url` and `url` 
method argument, so it would be 
`http://my.backend.com/magic-phone-number.txt` in the example. In case 
you need to use same client to talk to different hosts, just don't 
specify url in options - it would be set to empty string.
- Method is a string and can be set using `sdk.http.Method` enum.

Every method returns a promise that either resolves with response or
rejects with `sdk.http.NetworkException`, `sdk.http.HttpException`, one 
of their children or `sdk.http.InvalidConfigurationException`. 
In case of reject, received exception should have `.name`, `.message`, 
`.code`, `.request` and sometimes `.response` fields (except for 
`InvalidConfigurationException`). 

Whether an error will be thrown and how many retries will be made is 
defined in client settings passed as first constructor argument:

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
    // alternative logger factory to set another writer/debug level
    loggerFactory: new sdk.logger.slf4j.Factory(sdk.logger.Level.Error)
};
```

You can tune client as you want to throw exceptions or return responses
on certain outcomes. Network errors always result in exception, 
however, you may enforce several retries to be made.

## REST client

REST client is a wrapper around basic HTTP client that operates over
entities rather than HTTP requests/responses. It adds automatic 
serialization/deserialization support, provides `exists`, `get`, 
`create`, `set`, `modify` and `delete` methods and adds following rules:

- Any client error results in corresponding exception
- Any server error also results in exception, but retries for specified 
amount of times
- `.exists()` method is a wrapper around HEAD-request and returns boolean 
in promise, treating 404 as false and any 2xx as true
- `.get()` method is a wrapper around GET-request and returns null on 404
- Non-safe data-changing methods (all others) treat 404 as an error and 
trigger `http.NotFoundException`
- There are fallback methods `.request()` and `.execute()` in case you have 
some logic depending on response codes.
 
So you may talk to your backend like that:
 
```js
var rest = new sdk.http.rest.Client(),
    user = rest
        .get('/user', {phone: number, size: 1})
        .then(function (response) {
            return response ? response.content[0] : rest.create('/user', {phone: number});
        });
```

REST client is configured very similarly to HTTP client:

```js
var options = {
        // this will be prepended to all routes you pass into client
        url: 'http://backend/api/v1',
        // you will certainly need to set this if you're going to use anything but .get/.create
        methodOverrideHeader: 'X-HTTP-Method-Override',
        // that's pretty much the default
        retries: 4,
        // in case you want to override default logger
        loggerFactory: new sdk.logger.slf4j.Factory(sdk.logger.Level.Error),
        // this is set by default as well
        serializer: {
            serialize: JSON.stringify,
            deserialize: JSON.parse
        },
        // again, a set of headers that will always be present in 
        // requests (unless overriden in particular request)
        headers: {
            'Content-Type': 'application/json'
        }
    },
    client = new sdk.http.rest.Client(options);
```

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
