/* global VoxEngine, AppEvents */

var SDK = require('@ama-team/voxengine-sdk')
var Slf4j = SDK.Logger.Slf4j
var LogLevel = SDK.Logger.Level

// mute rest client, but increase basic client verbosity
Slf4j.setLevel('ama-team.voxengine-sdk.http.basic', LogLevel.Debug)
Slf4j.setLevel('ama-team.voxengine-sdk.http.rest', LogLevel.Off)
// Let's receive every message about task queues
Slf4j.setLevel('ama-team.voxengine-sdk.concurrent.task-queue', LogLevel.All)

var logger = Slf4j.create('ama-team.voxengine-sdk.example', LogLevel.Info)
var http = new SDK.Http.Basic({
  url: 'https://ya.ru',
  retryOnClientError: true,
  throwOnClientError: true
})
var rest = new SDK.Http.Rest({
  // json serializer is bundled in by default
  url: 'https://api.github.com/repos/ama-team/voxengine-sdk'
})
var queue = SDK.Concurrent.TaskQueue.started({name: 'webpack-example'})

VoxEngine.addEventListener(AppEvents.Started, function (event) {
  logger.info('Ok, let\'s get started')
  logger.info('Incoming event was: {}', event)
  logger.error('Printing fake error:', new Error())
  logger.debug('Debug level has been hidden - minimum required level is INFO')

  logger.info('The first thing to do is to check https://ya.ru content')
  logger.info('I bet it hasn\'t changed yet')
  var simpleRequest = queue.push(function () { return http.get('/') })
  simpleRequest.then(function (response) {
    logger.info('ya.ru response: {}', response)
    logger.info(
      'Chances are, above output has been truncated - ' +
      'that\'s because VoxEngine\'s logger is still used under hood'
    )
  })

  logger.info('Next, let\'s check which tags are present for current repo')
  logger.info(
    'Most probably GitHub will return error 403, so HTTP client will spin' +
    'until it will spend all retries it has been configured with'
  )
  logger.info(
    'Please note that task will be registered but not executed until ' +
    'first request has finished'
  )
  var tags = queue.push(
    function () { return rest.get('/tags') },
    {name: 'Retrieving list of ama-team/voxengine-sdk tags'}
  )
  tags.then(function (tags) {
    tags = tags.map(function (entry) { return entry.name })
    logger.info('Found tags for current repo: {}', tags)
  }, function (error) {
    logger.error('GitHub didn\'t let me to query his API: ', error)
  })

  logger.info(
    'Finally, let\'s register task that will instantly time out ' +
    'and produce TimeoutException'
  )
  var failure = queue.push(function () {
    return rest.get('/contributors', {}, {}, 0)
  })
  failure
    .then(function () {
      logger.error(
        'Wow! The request has finished in less than one nodejs tick, guys, ' +
        'have you been mocking globals?'
      )
    }, function (error) {
      logger.warn('Impossible request expectedly ended with error {}',
        error.name)
    })
    .then(function () {
      logger.info(
        'Please note again that this task has started only after ' +
        'previous one has finished'
      )
    })

  logger.info(
    'All tasks have been registered at this moment. Let\'s close task queue, ' +
    'and, when last task is done, shut down VoxEngine'
  )
  queue
    .close()
    .then(function () {
      logger.notice('All tasks have finished, shutting down the engine')
    })
    .then(VoxEngine.terminate.bind(VoxEngine))
})
