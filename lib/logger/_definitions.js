/**
 * @callback Writer
 *
 * @param {string} message Message to write
 */

/**
 * @interface IWritable
 */

/**
 * @function IWritable#write
 * @param {string} message Message to write
 */

/**
 * Logger of this kind simply substitute all replace markers in pattern with supplied positional arguments, e.g.:
 *
 * logger.error('{} has {}', 'admin', 'kicked me out of steam server') =>
 *   '[ERROR] admin has kicked me out of steam server'
 *
 * @interface IVarArgLogger
 */

/**
 * @function IVarArgLogger#log
 *
 * @param {Level} level Log level
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {...object} parameters List of pattern parameters
 */

/**
 * @function IVarArgLogger#trace
 *
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {...object} parameters List of pattern parameters
 */

/**
 * @function IVarArgLogger#debug
 *
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {...object} parameters List of pattern parameters
 */

/**
 * @function IVarArgLogger#notice
 *
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {...object} parameters List of pattern parameters
 */

/**
 * @function IVarArgLogger#info
 *
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {...object} parameters List of pattern parameters
 */

/**
 * @function IVarArgLogger#warn
 *
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {...object} parameters List of pattern parameters
 */

/**
 * @function IVarArgLogger#error
 *
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {...object} parameters List of pattern parameters
 */

/**
 * This kind of logger takes an object as an argument to message and substitutes replace tokens using parameter names
 * specified in those markers, e.g.:
 *
 * logger.error('{name} has {action}', {name: 'admin', action: 'kicked me out of steam server'}) =>
 *   '[ERROR] admin has kicked me out of steam server'
 *
 * @interface IParameterLogger
 * @deprecated Use ParameterLogger that will supersede this one next release
 */

/**
 * @function IParameterLogger#log
 *
 * @param {Level} level Log level
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {object} parameters Pattern parameters object
 */

/**
 * @function IParameterLogger#trace
 *
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {object} parameters Pattern parameters object
 */

/**
 * @function IParameterLogger#debug
 *
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {object} parameters Pattern parameters object
 */

/**
 * @function IParameterLogger#notice
 *
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {object} parameters Pattern parameters object
 */

/**
 * @function IParameterLogger#info
 *
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {object} parameters Pattern parameters object
 */

/**
 * @function IParameterLogger#warn
 *
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {object} parameters Pattern parameters object
 */

/**
 * @function IParameterLogger#error
 *
 * @param {string} pattern Logging pattern. It is recommended to use `{}` as a place for substitution
 * @param {object} parameters Pattern parameters object
 */

/**
 * @interface ILoggerContext
 * @template T
 */

/**
 * @function ILoggerContext#create
 *
 * @param {string} name Dot-delimited package name logger is created for
 * @param {Level} [level]
 * @param {IWritable} [writer]
 *
 * @return {T}
 */

/**
 * @function ILoggerContext#setLevel
 *
 * @param {string} name Dot-delimited package name logger is created for
 * @param {Level} level
 *
 * @return {this}
 */

/**
 * @function ILoggerContext#getLevel
 *
 * @param {string} name Dot-delimited package name logger is created for
 *
 * @return {Level}
 */

/**
 * @deprecated
 *
 * @function ILoggerContext#setThreshold
 *
 * @param {string} name Dot-delimited package name logger is created for
 * @param {Level} level
 *
 * @return {this}
 */

/**
 * @deprecated
 *
 * @function ILoggerContext#getThreshold
 *
 * @param {string} name Dot-delimited package name logger is created for
 *
 * @return {Level}
 */

/**
 * @function ILoggerContext#setWriter
 *
 * @param {string} name Logger name
 * @param {IWritable}
 *
 * @return {this}
 */

/**
 * @function ILoggerContext#getWriter
 *
 * @param {string} name Logger name
 *
 * @return {IWritable}
 */

/**
 * @typedef {Object} LoggerOptions
 *
 * @property {(IVarArgLogger|IParameterLogger|null)} instance
 * @property {(ILoggerContext|null)} context
 * @property {(String|null)} name
 * @property {(Level|null)} level
 * @property {(Object|null)} mdc
 */
