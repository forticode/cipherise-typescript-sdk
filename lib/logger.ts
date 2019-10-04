export type LoggerCallback = (msg: string, ...meta: any[]) => void;

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
export type Logger = ILogger;

/**
 * [[PrefixLogger]] is an implementation of [[ILogger]] that prefixes all of
 * its messages with the given tag. This is primarily used for logging from
 * an entity (i.e. logging from an enrolment session.)
 *
 * @export
 * @class PrefixLogger
 * @implements {ILogger}
 */
export class PrefixLogger implements ILogger {
  /**
   * Creates an instance of PrefixLogger.
   * @param {string} prefix The prefix to use in messages.
   * @param {ILogger} logger The logger to use as a backend.
   * @memberof PrefixLogger
   */
  constructor(private prefix: string, private logger: ILogger) {}

  public error(msg: string, ...meta: any[]) {
    this.logger.error(this.prefix + ": " + msg, meta);
  }

  public warn(msg: string, ...meta: any[]) {
    this.logger.warn(this.prefix + ": " + msg, meta);
  }

  public info(msg: string, ...meta: any[]) {
    this.logger.info(this.prefix + ": " + msg, meta);
  }

  public debug(msg: string, ...meta: any[]) {
    this.logger.debug(this.prefix + ": " + msg, meta);
  }

  public verbose(msg: string, ...meta: any[]) {
    this.logger.verbose(this.prefix + ": " + msg, meta);
  }
}
