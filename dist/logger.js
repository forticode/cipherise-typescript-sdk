"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * [[PrefixLogger]] is an implementation of [[ILogger]] that prefixes all of
 * its messages with the given tag. This is primarily used for logging from
 * an entity (i.e. logging from an enrolment session.)
 *
 * @export
 * @class PrefixLogger
 * @implements {ILogger}
 */
class PrefixLogger {
    /**
     * Creates an instance of PrefixLogger.
     * @param {string} prefix The prefix to use in messages.
     * @param {ILogger} logger The logger to use as a backend.
     * @memberof PrefixLogger
     */
    constructor(prefix, logger) {
        this.prefix = prefix;
        this.logger = logger;
    }
    error(msg, ...meta) {
        this.logger.error(this.prefix + ": " + msg, meta);
    }
    warn(msg, ...meta) {
        this.logger.warn(this.prefix + ": " + msg, meta);
    }
    info(msg, ...meta) {
        this.logger.info(this.prefix + ": " + msg, meta);
    }
    debug(msg, ...meta) {
        this.logger.debug(this.prefix + ": " + msg, meta);
    }
    verbose(msg, ...meta) {
        this.logger.verbose(this.prefix + ": " + msg, meta);
    }
}
exports.PrefixLogger = PrefixLogger;
//# sourceMappingURL=logger.js.map