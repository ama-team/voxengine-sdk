var _ = require('./_common'),
    exports = {};

// todo write jsdoc describing exports
Object.keys(_).forEach(function (k) {
    exports[k] = _[k];
});
exports.basic = require('./basic');
exports.rest = require('./rest');

module.exports = exports;
