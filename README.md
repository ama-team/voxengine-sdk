# (Unofficial) VoxEngine SDK

This repository contains simple SDK to ease development of VoxImplant 
scenarios.

Currently it consists of an advanced promise-based HTTP client (relatively to 
raw `Net` namespace) and slf4j-alike logger.

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
var logger = new sdk.logger.Slf4j('logger-name');

// ...

call.addEventListener(CallEvents.Connected, function(event) {
    logger.info('{} has responded in {} seconds (event: {})', user, timer.elapsed(), event);
});
```

This logger provides `.trace()`, `.debug()`, `.notice()`, `.info()`, 
`.warn()`, `.error()` and `.log(logger.Level.*, pattern, substitutions...)` 
methods.

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
you require adn don't forget to strip comments off.

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
`report/allure` directory.

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

[![npm (scoped)](https://img.shields.io/npm/v/@ama-team/voxengine-sdk.svg)](https://www.npmjs.com/package/@ama-team/voxengine-sdk)

### Master branch / stable
 
[![Build Status](https://travis-ci.org/ama-team/voxengine-sdk.svg?branch=master)](https://travis-ci.org/ama-team/voxengine-sdk)
[![Coverage Status](https://coveralls.io/repos/github/ama-team/voxengine-sdk/badge.svg?branch=master)](https://coveralls.io/github/ama-team/voxengine-sdk?branch=master)
[![Code Climate](https://codeclimate.com/github/ama-team/voxengine-sdk/badges/gpa.svg)](https://codeclimate.com/github/ama-team/voxengine-sdk)

### Dev branch / incubating

[![Build Status](https://travis-ci.org/ama-team/voxengine-sdk.svg?branch=dev)](https://travis-ci.org/ama-team/voxengine-sdk)
[![Coverage Status](https://coveralls.io/repos/github/ama-team/voxengine-sdk/badge.svg?branch=dev)](https://coveralls.io/github/ama-team/voxengine-sdk?branch=dev)

  [allure-commandline]: http://wiki.qatools.ru/display/AL/Allure+Commandline
  [@definitions]: https://github.com/ama-team/voxengine-definitions
  [@scenario-framework]: https://github.com/ama-team/voxengine-scenario-framework
  [@publisher]: https://github.com/ama-team/voximplant-publisher
