var Mocha = require('mocha')
var glob = require('glob')
var FileSystem = require('fs-extra')
var Path = require('path')

var root = __dirname
var libraryDirectory = root + '/lib'
var artifactDirectory = root + '/tmp'
var minificationDirectory = artifactDirectory + '/minified'
var reportDirectory = artifactDirectory + '/report'
var allureReportDirectory = reportDirectory + '/allure'
var coverageReportDirectory = reportDirectory + '/coverage'
var metadataDirectory = artifactDirectory + '/metadata'
var allureMetadataDirectory = metadataDirectory + '/allure'
var coverageMetadataDirectory = metadataDirectory + '/coverage'

var suites = ['unit', 'integration']

var execute = function (command, options) {
  return new Promise(function (resolve, reject) {
    if (command.join) {
      command = command.join(' ')
    }
    jake.exec(command, options || {printStdout: true}, function (error, value) {
      error ? reject(error) : resolve(value);
    })
  })
}

var exec = function (command, options) {
  return execute(command, options).then(complete, fail)
}

var termination = function (error, value) {
  error ? fail(error) : complete(value)
}

var chain = function (tasks, callback, ignoreErrors) {
  callback = callback || termination
  tasks = tasks.map(function (task) {
    if (typeof task === 'string' || task instanceof String) {
      return jake.Task[task]
    }
    return task
  })
  var last = tasks.reduce(function (carrier, task) {
    if (carrier) {
      carrier.addListener('complete', function (value) {
        task.invoke(value)
      })
      carrier.addListener('fail', function (error) {
        ignoreErrors ? task.invoke(error) : callback(error)
      })
    }
    return task;
  }, null)
  last.addListener('complete', function (value) {
    callback(null, value)
  })
  last.addListener('fail', callback)
  tasks[0].invoke()
}

namespace('test', function () {
  namespace('report', function () {
    task('allure', {async: true}, function () {
      var command = [
        'allure generate --clean',
        '-o', allureReportDirectory,
        '--',
        allureMetadataDirectory + '/**'
      ]
      exec(command)
    })

    namespace('coverage', function () {
      task('html', {async: true}, function () {
        var command = [
          'node_modules/.bin/istanbul',
          'report',
          '--root', coverageMetadataDirectory,
          '--dir', coverageReportDirectory + '/html',
          'html'
        ]
        exec(command)
      })

      task('lcov', function () {
        var command = [
          'node_modules/.bin/istanbul',
          'report',
          '--root', coverageMetadataDirectory,
          '--dir', coverageReportDirectory + '/lcov',
          'lcovonly'
        ]
        exec(command)
      })

      task('publish', function () {
        var command = [
          'cat',
          coverageReportDirectory + '/lcov/lcov.info',
          '|',
          'node_modules/.bin/coveralls'
        ]
        exec(command)
      })
    })

    task('coverage', {async: true}, function () {
      chain(['test:report:coverage:lcov', 'test:report:coverage:html'])
    })

    task('publish', function () {
      chain(['test:report:coverage:publish'])
    })
  })

  task('clean', {async: true}, function () {
    FileSystem.emptyDir(metadataDirectory).then(complete, fail)
  })

  task('report', {async: true}, function () {
    chain(['test:report:allure', 'test:report:coverage'])
  })

  task('coverage', {async: true}, function () {
    var tasks = suites.map(function (suite) {
      return jake.Task['test:' + suite + ':coverage']
    })
    tasks.unshift(jake.Task['test:clean'])
    chain(tasks)
  })

  task('with-report', {async: true}, function () {
    chain(['test:coverage', 'test:report'], termination, true)
  })

  suites.forEach(function (suite) {
    task(suite, {async: true}, function (regexp) {
      var options = {
        reporter: 'mocha-multi-reporters',
        reporterOptions: {
          reporterEnabled: 'spec, xunit, mocha-junit-reporter, mocha-allure-reporter',
          mochaAllureReporterReporterOptions: {
            targetDir: allureMetadataDirectory + '/' + suite
          },
          xunitReporterOptions: {
            output: metadataDirectory + '/xunit/' + suite + '/xunit.xml'
          },
          mochaJunitReporterReporterOptions: {
            mochaFile: metadataDirectory + '/junit/' + suite + '/TEST-junit.xml'
          }
        }
      }
      if (regexp) {
        options['grep'] = new RegExp(regexp, 'i')
      }
      var pattern = root + '/test/suites/' + suite + '/**/*.spec.js'
      glob(pattern, function(err, files) {
        var mocha = new Mocha(options)
        mocha.addFile(root + '/test/support/setup.js')
        mocha.addFile(root + '/test/suites/' + suite + '/setup.js')
        for (var i = 0; i < files.length; i++) {
          mocha.addFile(files[i])
        }
        mocha.run(function (failures) {
          failures === 0 ? complete(0) : fail(failures)
        })
      })
    })

    namespace(suite, function () {
      task('coverage', {async: true}, function () {
        var target = 'node_modules/.bin/jake test:' + suite
        var command = [
          'node_modules/.bin/istanbul cover',
          '--dir', metadataDirectory + '/coverage/' + suite,
          // '--report', 'lcov.info',
          target
        ]
        exec(command)
      })

      task('with-report', {async: true}, function () {
        chain(['test:' + suite + ':coverage', 'test:report'], termination, true)
      })
    })
  })
})

task('test', {async: true}, function () {
  var tasks = suites.map(function (suite) {
    return jake.Task['test:' + suite]
  })
  tasks.unshift(jake.Task['test:clean'])
  chain(tasks)
})

task('lint', {async: true}, function () {
  exec('node_modules/.bin/standard')
})

task('minify', {async: true}, function () {
  glob(libraryDirectory + '/**/*.js', function (error, files) {
    if (error) {
      return fail(error);
    }
    Promise.all(files.map(function (file) {
      var relative = file.substr(libraryDirectory.length + 1)
      var target = minificationDirectory + '/' + relative
      var parentDirectory = Path.resolve(target, '..')
      return FileSystem
        .mkdirs(parentDirectory)
        .then(function () {
          var command = [
            root + '/node_modules/.bin/uglifyjs',
            file,
            '-m',
            '-c',
            '-o',
            target
          ]
          return execute(command)
        })
    }))
  })
})
