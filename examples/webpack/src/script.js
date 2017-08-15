var SDK = require('@ama-team/voxengine-sdk')
var Slf4j = SDK.Logger.Slf4j
var LogLevel = SDK.Logger.Level

// mute rest client, but increase basic client verbosity
Slf4j.setLevel('ama-team.voxengine-sdk.http.basic', LogLevel.Debug)
Slf4j.setLevel('ama-team.voxengine-sdk.http.rest', LogLevel.Off)
// Let's receive every message about task queues
Slf4j.setLevel('ama-team.voxengine-sdk.concurrent.task-queue', LogLevel.All)

var logger = Slf4j.create('ama-team.voxengine-sdk.example', LogLevel.Info)
var http = new SDK.Http.Basic('https://ya.ru')
var rest = new SDK.Http.Rest('https://api.github.com/repos/ama-team/voxengine-sdk')
var queue = SDK.Concurrent.TaskQueue.started({name: 'webpack-example'})

VoxEngine.addEventListener(AppEvents.Started, function (event) {
  logger.info('Ok, let\'s get started')
  logger.info('Incoming event was: {}', event)
  logger.error('Printing fake error:', new Error())
  logger.debug('Debug level has been hidden - minimum required level is INFO')

  // what's on ya.ru today? i guess the same thing as every day
  var simpleRequest = queue.push(function () { return http.get('/') })
  // this code will execute only after queue task will be processed
  simpleRequest.then(function (response) {
    // as you may see here, output will get truncated since standard
    // VoxImplant logger with it's restrictions is used
    logger.info('ya.ru response: {}', response)
  })

  // let's get list of tags
  // execution of this code will be delayed until first queue task will be finished
  var tags = queue.push(
    function () { return rest.get('/tags') },
    {name: 'Retrieving list of ama-team/voxengine-sdk tags'}
  )
  tags.then(function (tags) {
    tags = tags.map(function (entry) { return entry.name })
    logger.info('Found tags: {}', tags)
  }, function (error) {
    logger.error('GitHub didn\'t want me to query api: ', error)
  })

  // let's enforce impossible timeout
  var failure = queue.push(function () {
    return rest.get('/contributors', {}, {}, 0)
  })
  failure.then(function () {
    logger.error('Impossibru!')
  }, function (error) {
    logger.warn('Caught expected error: {}', error.name)
  })

  // let's just wait for all tasks in queue and then terminate the engine
  queue
    .close()
    .then(function () {
      logger.notice('Everything has finished')
    })
    .then(VoxEngine.terminate.bind(VoxEngine))
})
