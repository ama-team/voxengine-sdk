var Mocha = require('mocha')
var glob = require('glob')

var root = __dirname
var artifactDirectory = __dirname + '/tmp'
var reportDirectory = artifactDirectory + '/report'
var allureReportDirectory = reportDirectory + '/allure'
var coverageReportDirectory = reportDirectory + '/coverage'
var metadataDirectory = artifactDirectory + '/metadata'
var allureMetadataDirectory = metadataDirectory + '/allure'
var coverageMetadataDirectory = metadataDirectory + '/coverage'
var suites = ['unit']

var exec = function (command, options) {
  if (command.join) {
    command = command.join(' ')
  }
  var callback = function (error, value) {
    error ? fail(error) : complete(value)
  }
  return jake.exec(command, options || {printStdout: true}, callback)
}

var chain = function (tasks, ignoreErrors) {
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
        ignoreErrors ? task.invoke(error) : fail(error)
      })
    }
    return task;
  }, null)
  last.addListener('complete', complete)
  last.addListener('fail', fail)
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

  task('report', {async: true}, function () {
    chain(['test:report:allure', 'test:report:coverage'])
  })

  task('coverage', {async: true}, function () {
    chain(suites.map(function (suite) {
      return jake.Task['test:' + suite + ':coverage']
    }))
  })

  task('with-report', {async: true}, function () {
    chain(['test:coverage', 'test:report'], true)
  })

  suites.forEach(function (suite) {
    task(suite, function (regexp) {
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
          process.on('exit', function () {
            process.exit(failures > 0 ? 1 : 0)
          })
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
        chain(['test:' + suite + ':coverage', 'test:report'], true)
      })
    })
  })
})

task('test', {async: true}, function () {
  chain(suites.map(function (suite) {
    return jake.Task['test:' + suite]
  }))
})

task('lint', {async: true}, function () {
  exec('node_modules/.bin/standard')
})
