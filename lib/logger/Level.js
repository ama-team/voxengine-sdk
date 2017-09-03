/**
 * @typedef {object} Level~Element
 * @property {string} id
 * @property {int} weight
 * @property {boolean} implicit
 */

/**
 * @enum
 *
 * @property {Level~Element} All
 * @property {Level~Element} Trace
 * @property {Level~Element} Debug
 * @property {Level~Element} Info
 * @property {Level~Element} Notice
 * @property {Level~Element} Warn
 * @property {Level~Element} Error
 * @property {Level~Element} Off
 */
var Level = {}

Level.keys = ['All', 'Trace', 'Debug', 'Info', 'Notice', 'Warn', 'Error']
Level.values = []
Level.explicit = []
Level.implicit = []
var implicit = ['All', 'Off']
Level.keys.forEach(function (id) {
  var level = {
    id: id,
    weight: Level.keys.indexOf(id) + 1,
    implicit: implicit.indexOf(id) > -1
  }
  Level[id] = level
  Level.values.push(level)
  var target = level.implicit ? Level.implicit : Level.explicit
  target.push(level)
})

Level.find = function (input) {
  input = input && input.toLowerCase ? input.toLowerCase() : input
  return Level.keys.reduce(function (carrier, id) {
    return input === id.toLowerCase() || input === Level[id] ? Level[id] : carrier
  }, null)
}

module.exports = {
  Level: Level
}
