var Path = require('path')

var configuration = {
  entry: Path.resolve(__dirname, 'src/script.js'),
  output: {
    path: Path.resolve(__dirname, 'dist'),
    filename: 'script.js'
  }
}

if (process.env.NODE_ENV === 'production') {
  configuration.module = {
    rules: [
      {
        test: {not: [/script\.js$/]},
        use: [
          { loader: 'uglify-loader-2' }
        ]
      }
    ]
  }
}

module.exports = configuration
