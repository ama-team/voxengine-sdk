class Slf4jAlikeLogger {

    constructor (writer) {
        this.writer = writer;
    }

    /**
     * @param {string} pattern
     * @param {Array<string>} substitutions
     */
    substitute(pattern, substitutions) {
        let result = pattern;
        substitutions.forEach(substitution => {
            if (typeof(substitution) == 'object') {
                substitution = JSON.stringify(substitution);
            }
            result = result.replace('{}', substitution);
        });
        return result;
    }

    /**
     * Writes log entry, substituting `{}` tokens with provided arguments.
     *
     * @param {string} pattern Log pattern with `{}` as placeholder for replacements
     * @param {Array<string>} substitutions Replacements source.
     */
    log = (pattern, ...substitutions) => writer.write(substitute(pattern, substitutions));
}

export default Slf4jAlikeLogger;