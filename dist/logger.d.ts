export declare type LoggerCallback = (msg: string, ...meta: any[]) => void;
/**
 * [[ILogger]] is used by the SDK to log information that can be used for debugging.
 *
 * @export
 * @interface ILogger
 */
export interface ILogger {
    /**
     * ERROR:   Something is terribly wrong. Sound the alarms.
     *
     * @type {LoggerCallback}
     * @memberof Logger
     */
    error: LoggerCallback;
    /**
     * WARN:    Something unexpected has happened; inspect when possible.
     *
     * @type {LoggerCallback}
     * @memberof Logger
     */
    warn: LoggerCallback;
    /**
     * INFO:    Normal system events (connecting, etc).
     *
     * @type {LoggerCallback}
     * @memberof Logger
     */
    info: LoggerCallback;
    /**
     * DEBUG:   Individual operations within system events.
     *
     * @type {LoggerCallback}
     * @memberof Logger
     */
    debug: LoggerCallback;
    /**
     * VERBOSE: Details about individual operations.
     *
     * @type {LoggerCallback}
     * @memberof Logger
     */
    verbose: LoggerCallback;
}
export declare type Logger = ILogger;
/**
 * [[PrefixLogger]] is an implementation of [[ILogger]] that prefixes all of
 * its messages with the given tag. This is primarily used for logging from
 * an entity (i.e. logging from an enrolment session.)
 *
 * @export
 * @class PrefixLogger
 * @implements {ILogger}
 */
export declare class PrefixLogger implements ILogger {
    private prefix;
    private logger;
    /**
     * Creates an instance of PrefixLogger.
     * @param {string} prefix The prefix to use in messages.
     * @param {ILogger} logger The logger to use as a backend.
     * @memberof PrefixLogger
     */
    constructor(prefix: string, logger: ILogger);
    error(msg: string, ...meta: any[]): void;
    warn(msg: string, ...meta: any[]): void;
    info(msg: string, ...meta: any[]): void;
    debug(msg: string, ...meta: any[]): void;
    verbose(msg: string, ...meta: any[]): void;
}
