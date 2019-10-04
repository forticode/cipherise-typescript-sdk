import { ILogger } from "./logger";
/**
 * @hidden
 */
export declare class WebClient {
    url: string;
    private logger;
    private readonly logHttp;
    /**
     * Creates an instance of WebClient.
     * @param {string} url The URL of the Cipherise server.
     * @param {ILogger} logger The logger to log debug information to.
     * @memberof WebClient
     */
    constructor(url: string, logger: ILogger);
    /**
     * Sends a POST request to the URL with the given form and session identifier.
     *
     * @param {string} url The URL to request.
     * @param {*} form The data to send.
     * @param {(string|undefined)} sessionId The Cipherise session to use.
     * @returns {Promise<any>}
     * @memberof WebClient
     */
    postUrl(url: string, form: any, sessionId: string | undefined): Promise<any>;
    /**
     * Sends a POST request to the URI with the given form and session identifier.
     *
     * @param {string} uri The URI to request.
     * @param {*} form The data to send.
     * @param {(string|undefined)} sessionId The Cipherise session to use.
     * @returns {Promise<any>}
     * @memberof WebClient
     */
    postUri(uri: string, form: any, sessionId: string | undefined): Promise<any>;
    /**
     * Sends a GET request to the URL with the given session identifier.
     *
     * @param {string} url The URL to request.
     * @param {(string|undefined)} sessionId The Cipherise session to use.
     * @returns {Promise<any>}
     * @memberof WebClient
     */
    getUrl(url: string, sessionId: string | undefined): Promise<any>;
    /**
     * Sends a GET request to the URI with the given session identifier.
     *
     * @param {string} uri The URI to request.
     * @param {(string|undefined)} sessionId The Cipherise session to use.
     * @returns {Promise<any>}
     * @memberof WebClient
     */
    getUri(uri: string, sessionId: string | undefined): Promise<any>;
    /**
     * Returns a timeout exception if the response has timed out, is a proxy error,
     * is a proxy timeout, mentions a timeout in the error message, or features an empty body.
     *
     * @private
     * @param {*} error Response error
     * @param {request.RequestResponse} response Response
     * @param {*} body Response body
     * @returns {(TimeoutError|null)}
     * @memberof WebClient
     */
    private checkForTimeout;
    /**
     * Returns a session expired error if the Cipherise session has expired.
     *
     * @private
     * @param {*} error Response error
     * @param {request.RequestResponse} response Response
     * @param {*} body Response body
     * @param {*} body
     * @returns {(SessionExpiredError|null)}
     * @memberof WebClient
     */
    private checkForSessionExpiry;
}
