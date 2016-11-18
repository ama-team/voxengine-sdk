# (Unofficial) VoxEngine SDK

This repository contains simple SDK to ease development of VoxImplant 
scenarios.

Currently it consists of an advanced promise-based HTTP client (relatively to 
raw `Net` namespace) and slf4j-alike logger.

It may be installed via classic npm call

```bash
npm i @ama-team/voxengine-sdk --save
```

## Logger

This library wraps standard `Logger` and adds support for log levels 
(that shouldn't be very useful, but who knows) and log message 
parameters (substitutions):

```js
var logger = new require('@ama-team/voxengine-sdk').loggers.slf4j();

// ...

call.addEventListener(CallEvents.Connected, function(event) {
    logger.info('{} has responded in {} seconds (event: {})', user, timer.elapsed(), event);
});
```

This logger provides `.trace()`, `.debug()`, `.notice()`, `.info()`, 
`.warn()`, `.error()` and `.log(loggers.LogLevel.*, pattern, substitutions...)` 
methods.

## REST client

Provided client exploits `Net` inhabitant capabilities to provide more 
fresh interface:

```js
var options = {
        baseUrl: 'http://backend/api/v1',
        attempts: 5,
        methodOverrideHeader: 'X-HTTP-Method-Override',
        logger: logger,
        serializer: {
            serialize: function (object) {
                return '';
            },
            deserialize: function (string) {
                return {};               
            }
        },
        fixedHeaders: {
            'Content-Type': 'application/json'
        }
    },
    client = new require('@ama-team/voxengine-sdk').http.rest(Net.asyncHttpRequest, options);

client.put('/conversation/12345/finished', {timestamp: new Date().getTime()}, {'X-Entity-Version': '12'})
    .then(function (response) {
        logger.info('Received response: {}', response);
    }, function (error) {
        logger.error('Failed to perform request: {}', error);
        VoxEngine.terminate();
    });
```

REST client exposes main `.request(http.HttpMethod.*, route, payload, [query], [headers])` 
method, as well as shortcuts `.get(route, [query], [headers])`,
`.create(route, [payload], [headers])`, 
`.set(route, [payload], [headers])`, and 
`.delete(route, [payload], [headers])`.

## How do i use the library?

If you don't already know, VoxImplant scripts are basically just a 
single file which is executed on external trigger. This limits your 
ability to `require` anything, including this particular library, but 
you can always bundle things down with a build tool of your choice.
I personally use Webpack, but was recommended of Browserify as well,
and, of course good old Grunt and Gulp should work too.

Don't forget that VoxImplant has scenario size limit of 128 kb, so 
don't require anything at sight, and don't forget to minify things
you require.

## ES5

This repository is developed as ES5 module because it is implied that 
built code would be injected directly in VoxImplant scenarios, which, in 
turn, do not support ES6 yet, and transpiling would dramatically harden
bug hunt.

## Anything else?

We have [@ama-team/voxengine-definitions](./voxengine-definitions)
package that helps with autocompletion. Also, 
[scenario framework](./voxengine-scenario-framework) and 
[script publishing tool](./voximplant-publisher) were being developed 
at the moment these lines were written, so there is probability that 
there is another useful tool for you.

There is no particular roadmap for this project, so you may use github 
issues to propose any ideas you got. However, there is not much time
that could be devoted to this project.