# (Unofficial) VoxEngine SDK

[![npm version](https://img.shields.io/npm/v/@ama-team/voxengine-sdk.svg?style=flat-square)](https://www.npmjs.com/package/@ama-team/voxengine-sdk) 
[![CircleCI](https://img.shields.io/circleci/project/github/ama-team/voxengine-sdk/master.svg?style=flat-square)](https://circleci.com/gh/ama-team/voxengine-sdk)
[![Coveralls](https://img.shields.io/coveralls/ama-team/voxengine-sdk/master.svg?style=flat-square)](https://coveralls.io/github/ama-team/voxengine-sdk?branch=master)
[![Code Climate](https://img.shields.io/codeclimate/github/ama-team/voxengine-sdk.svg?style=flat-square)](https://codeclimate.com/github/ama-team/voxengine-sdk)
[![Scrutinizer](https://img.shields.io/scrutinizer/g/ama-team/voxengine-sdk/master.svg?style=flat-square)](scrutinizer-ci.com/g/ama-team/voxengine-sdk/issues/master)

This repository contains simple SDK to ease development of VoxImplant 
scenarios. It has:

- Promise-based HTTP client
- Promise-based REST client
- [SLF4J][]-alike logger
- Some concurrent primitives that may be required during development
(timeout, delay, task queue, completable promise)

It may be installed via classic npm call

```bash
npm i @ama-team/voxengine-sdk --save
```

And required as any other package:

```js
var SDK = require('@ama-team/voxengine-sdk')
```

## SLF4J-alike Logger

This library wraps standard `Logger` and adds support for logger names,
log levels and log message parameters (substitutions):

```js
var Slf4j = SDK.Logger.Slf4j
var logger = Slf4j.create('logger.name')

// ...

var user = 'Pavel'
var elapsed = 12.345
var metadata = {roles: ['lead'], extras: []}
    
call.addEventListener(CallEvents.Connected, function () {
  logger.info('{} has responded in {} seconds (meta: {})', user, elapsed, metadata)
  // [INFO] logger.name: Pavel has responded in 12.345 seconds (meta: {"roles": ["lead"], "extras": []})
});
```

This logger provides `.trace()`, `.debug()`, `.info()`, `.notice()`, 
`.warn()`, `.error()` and `.log(Logger.Level.*, pattern, substitutions...)` 
methods to print things. Also there are `.attach(key, value)`, 
`.detach(key)`, `.attachAll(object)` and `.detachAll()` methods for
functionality known as Mapped Diagnostic Context in Logback:

```js
logger.attach('id', '123')
logger.info('Sending custom event')
// [INFO] logger.name [id=123]: Sending custom event 
```

This may help you if you have similar logging output but need to 
distinguish components one from another.

Every logger may be created with particular level and writer, as
well as swap them in runtime:

```js
// please note that Logger symbol (last parameter) comes from VoxEngine, not from SDK
var logger = Slf4j.create('logger.name', SDK.Logger.Level.Info, Logger)
logger.setLevel(SDK.Logger.Level.Info)
logger.setLevel('warn')
logger.setWriter(Logger)
```

This functionality is also exported via `Slf4j` static methods:

```js
Slf4j.setLevel('logger.name', 'info')
Slf4j.setWriter('logger.name', Logger)
```

so you can control loggers buried deep in other components.

Logger level and writer are looked up hierarchically: if no 
level / writer is found for current name, search continues for parent 
one. Names are separated using dots, so `logger.name` will use 
`logger.name`, `logger`, `(root)` lookup chain.

## Basic HTTP Client

This client is a simple wrapper around `Net.httpRequestAsync` primitive

```js
var SDK = require('@ama-team/voxengine-sdk')
var options = {
  url: 'http://my.backend.com',
  retries: 9,
  throwOnServerError: true
}
var client = new SDK.Http.Basic(options);

var call = client
  .get('/magic-phone-number.txt')
  .then(function(response) {
    return VoxEngine.callPSTN(response.payload);
  });
```

Basic client provides you with following methods:

- `get(url, [query, headers, timeout])`
- `head(url, [query, headers, timeout])`
- `post(url, [payload, headers, timeout])`
- `put(url, [payload, headers, timeout])`
- `patch(url, [payload, headers, timeout])`
- `delete(url, [payload, headers, timeout])`
- `request(method, url, [query, payload, headers, timeout])`

with following rules:

- Query is an object where every key is associated with a
string value or array of string values:
`{page: '1', filters: ['active', 'fresh']}`.
- The same applies to headers object.
- Payload may be either a string or falsey value.
- URL is built by simple concatenation of `options.url` and `url` 
method argument, so it would be 
`http://my.backend.com/magic-phone-number.txt` in the example. In case 
you need to use same client to talk to different hosts, just don't 
specify url in options - it would be set to empty string.
- Method is a string and can be set using `SDK.Http.Method` enum.

Every method returns a promise that either resolves with response or
rejects with `SDK.Http.NetworkException`, `SDK.Http.HttpException`, one 
of their children or `SDK.Http.InvalidConfigurationException`. 
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
    // default timeout in milliseconds
    timeout: 1000,
    // alternative logger options
    logger: {
      level: SDK.Logger.Level.Info,
      name: 'custom-name',
      instance: new MyCustomLogger()
    }
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

The signatures are:

- `get(resource, [query, headers, timeout])`
- `exists(resource, [query, headers, timeout])`
- `create(resource, [payload, headers, query, timeout])`
- `set(resource, [payload, headers, query, timeout]) : PUT`
- `modify(resource, [payload, headers, query, timeout]) : PATCH`
- `delete(resource, [payload, headers, query, timeout])`
 
So you may talk to your backend like that:
 
```js
var rest = new SDK.Http.Rest()
var user = rest
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
  // this is set by default as well
  serializer: {
    serialize: JSON.stringify,
    deserialize: JSON.parse
  },
  // again, a set of headers that will always be present in 
  // requests (unless overriden in particular request)
  headers: {
    'Content-Type': 'application/json'
  },
  // default timeout
  timeout: 1000,
  // same logger options
  logger: {}
}
var client = new SDK.Http.Rest(options);
```

## Future

This SDK also provides an externally-completable promise called Future
for brevity. It has the same interface as standard promise, but also
exposes `#resolve()` and `#reject()` instance methods:

```js
var Future = SDK.Concurrent.Future

var race = Future.race([new Future(), new Future()])
race.resolve('hijack')
race.reject('will be ignored')
```

## timeout

`timeout` function allows you to wrap promise with another one which 
will auto-reject after specified time. Most of the time you won't need 
this, because VoxEngine automatically times out long dials and 
requests, but sometimes you will need more strict time bounds or set
a timeout on non-standard resource:

```js
var perfectMatch = api.getPerfectMatch(call)
SDK.Concurrent.timeout(perfectMatch, 10000)
  .then(null, function (error) {
    logger.info('It looks like api can\'t find match quickly: ', error)
    logger.info('Falling back to standard match')
    return api.getStandardMatch(call)
  })
```

The `TimeoutException` used to reject such promise can be located as
`SDK.Concurrent.TimeoutException`. Resulting promise also has 
`#cancel(silent)` method that allows to clear internal timeout id.
Silent parameter defines whether it it will be cancelled silently 
(pretending that there never was a timeout) or with 
CancellationException.

## delay

`delay` function will wrap your callback and invoke it in future, or
just create a timer promise if callback is omitted:

```js
SDK.Concurrent.delay(10000, function () {
  call.say('Your answering time has expired')
})
```

```js
SDK.Concurrent.delay(10000).then(function () {
  call.say('Your answering time has expired')
})
```

You can use it with `Promise.race()` to create some basic time-bounded
scenarios without explicit rejection:

```js
var toneDetection = new Promise(function (resolve) {
  call.addEventListener(CallEvents.ToneDetected, resolve)
})
var timeBound = SDK.Concurrent.delay(10000)
Promise.race(toneDetection, timeBound).then(function() {
  call.say('I\'m sorry, Dave. I\'m afraid i can\'t do that.')
})
```

Delay function result has `#cancel(silent)` method as well that will
either instantly resolve delay or reject promise with 
CancellationException depending on `silent` parameter.

## throttle

The last helper function prevents promise from resolving too fast. It
wraps promise as well and ensures that it will resolve not earlier than
specified timeout allows:

```js
logger.info('Emulating hard work so our clients would think we\'re smart')
var balance = rest.get('/users/' + id + '/balance')
var throttled = SDK.Concurrent.throttle(balance, 10000)
```

Throttle function result provides similar `#cancel(silent)` method.

## TaskQueue

When you're using tons of async code, quite often you need to enforce
some ordering on processing. TaskQueue is created to run tasks 
sequentially - for example, it is often necessary for HTTP requests
to come in order:

```js
var queue = SDK.Concurrent.TaskQueue.started({name: 'Call ' + id + ' event stream'})
queue.push(function () {
  return rest.create('/calls/' + id, {number: number})
})
queue.push(function() {
  return rest.modify('/users/' + userId + '/balance', {amount: -33.3})
}, {name: 'User balance withdrawal', timeout: 1000})
queue
  .close()
  .then(function() {
    logger.info('Everything has been finished!')
  })
```

Queue exposes `#start()` and `#pause()` methods to start and pause
processing, `#push()` for adding new tasks, `#close()` and
`#terminate()` for normal (wait for all tasks) and emergency (discard
waiting tasks) queue finalization. `#push` will return a promise that
will be resolved once task has been run, while closing methods will 
return promise which will resolve once queue will become empty.

## How do i require this stuff in VoxEngine?

If you don't already know, VoxImplant scripts are basically just a 
single file which is executed on external trigger. This limits your 
ability to `require` anything, including this particular library, but 
you can always bundle things down with a build tool of your choice.
I personally use Webpack, but was recommended of Browserify as well,
and, of course good old Grunt and Gulp should work too.

Don't forget that VoxImplant has scenario size limit of 
[256 kb][voxengine-ref], so don't require anything at sight, don't 
forget to minify things you require and don't forget to strip 
comments off.

## ES5 & standards

This repository is developed as ES5 module because it is implied that 
built code would be injected directly in VoxImplant scenarios, which, in 
turn, do not support ES6 yet, and transpiling would dramatically harden
bug hunt.

This repository is developed using [standardjs][], sorry if you have
feelings for semicolons.

## Testing

This package is using Mocha with Chai for test running, Istanbul for 
recording coverage metrics and Allure framework for reporting. To run
tests, simply invoke jake:

```bash
npx jake test
```
If you  want full-blown feedback, use `npx jake test:with-report` to 
generate Allure report (don't forget to install 
[allure-commandline][allure-commandline] before) and coverage report,
which will be placed in `tmp/report` directory.

## Anything else?

We have [@ama-team/voxengine-definitions][@definitions] package that 
helps with autocompletion and [scenario framework][@scenario-framework]
which aims at more sophisticated approach for VoxImplant scenario
development. Also there is a chance that 
[script publishing tool][@publisher] will be finally developed at the 
moment you're reading this, so it worth to check it.

There is no particular roadmap for this project, so you may use GitHub 
issues to propose any ideas you got. However, there is not much time
that could be devoted to this project.

### Dev branch state / incubating

[![CircleCI](https://img.shields.io/circleci/project/github/ama-team/voxengine-sdk/dev.svg?style=flat-square)](https://circleci.com/gh/ama-team/voxengine-sdk)
[![Coveralls](https://img.shields.io/coveralls/ama-team/voxengine-sdk/dev.svg?style=flat-square)](https://coveralls.io/github/ama-team/voxengine-sdk?branch=dev)
[![Scrutinizer](https://img.shields.io/scrutinizer/g/ama-team/voxengine-sdk/dev.svg?style=flat-square)](scrutinizer-ci.com/g/ama-team/voxengine-sdk/issues/dev)

  [allure-commandline]: https://github.com/allure-framework/allure2
  [@definitions]: https://github.com/ama-team/voxengine-definitions
  [@scenario-framework]: https://github.com/ama-team/voxengine-scenario-framework
  [@publisher]: https://github.com/ama-team/voximplant-publisher
  [slf4j]: https://www.slf4j.org/
  [standardjs]: https://standardjs.com
  [voxengine-ref]: https://voximplant.com/docs/references/appengine/
