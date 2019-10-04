"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request");
const errors_1 = require("./errors");
// tslint:disable:no-console
/**
 * @hidden
 */
class WebClient {
    /**
     * Creates an instance of WebClient.
     * @param {string} url The URL of the Cipherise server.
     * @param {ILogger} logger The logger to log debug information to.
     * @memberof WebClient
     */
    constructor(url, logger) {
        this.url = url;
        this.logger = logger;
        // Add a slash to the end of the URL if not already available.
        if (!this.url.endsWith("/")) {
            this.url += "/";
        }
        this.logHttp = process.env["CIPHERISE_SDK_LOG_HTTP"] !== undefined;
    }
    /**
     * Sends a POST request to the URL with the given form and session identifier.
     *
     * @param {string} url The URL to request.
     * @param {*} form The data to send.
     * @param {(string|undefined)} sessionId The Cipherise session to use.
     * @returns {Promise<any>}
     * @memberof WebClient
     */
    postUrl(url, form, sessionId) {
        this.logger.verbose(`postUrl("${url}", \`${JSON.stringify(form)}\`, ${sessionId})`);
        if (this.logHttp) {
            console.log(`\n${new Date().toISOString()} | Request: POST ${url} with ${JSON.stringify(form)}`);
        }
        let promise = new Promise((resolve, reject) => {
            request.post(url, { headers: { SessionId: sessionId }, json: form }, (error, response, body) => {
                if (error) {
                    return reject(error);
                }
                const timeoutError = this.checkForTimeout(error, response, body);
                if (timeoutError !== null) {
                    return reject(timeoutError);
                }
                const sessionExpiryError = this.checkForSessionExpiry(response, body);
                if (sessionExpiryError !== null) {
                    return reject(sessionExpiryError);
                }
                if (body.error_message) {
                    return reject(new Error(body.error_message));
                }
                else {
                    return resolve(body);
                }
            });
        });
        if (this.logHttp) {
            promise = promise.then(value => {
                console.log(`    ${new Date().toISOString()} | Response: ${JSON.stringify(value)}`);
                return value;
            }, err => {
                console.log(`    ${new Date().toISOString()} | Response (failed): ${err}`);
                return Promise.reject(err);
            });
        }
        return promise;
    }
    /**
     * Sends a POST request to the URI with the given form and session identifier.
     *
     * @param {string} uri The URI to request.
     * @param {*} form The data to send.
     * @param {(string|undefined)} sessionId The Cipherise session to use.
     * @returns {Promise<any>}
     * @memberof WebClient
     */
    postUri(uri, form, sessionId) {
        return this.postUrl(this.url + uri, form, sessionId);
    }
    /**
     * Sends a GET request to the URL with the given session identifier.
     *
     * @param {string} url The URL to request.
     * @param {(string|undefined)} sessionId The Cipherise session to use.
     * @returns {Promise<any>}
     * @memberof WebClient
     */
    getUrl(url, sessionId) {
        this.logger.verbose(`getUrl("${url}", ${sessionId})`);
        if (this.logHttp) {
            console.log(`\n${new Date().toISOString()} | Request: GET ${url}`);
        }
        let promise = new Promise((resolve, reject) => {
            request.get(url, { headers: { SessionId: sessionId } }, (error, response, body) => {
                if (error) {
                    return reject(error);
                }
                const timeoutError = this.checkForTimeout(error, response, body);
                if (timeoutError !== null) {
                    return reject(timeoutError);
                }
                const sessionExpiryError = this.checkForSessionExpiry(response, body);
                if (sessionExpiryError !== null) {
                    return reject(sessionExpiryError);
                }
                try {
                    const bodyJson = JSON.parse(body);
                    if (bodyJson.error_message) {
                        return reject(new Error(bodyJson.error_message));
                    }
                    else {
                        return resolve(bodyJson);
                    }
                }
                catch (e) {
                    return reject(new Error("Invalid response: `" + body + "`"));
                }
            });
        });
        if (this.logHttp) {
            promise = promise.then(value => {
                console.log(`    ${new Date().toISOString()} | Response: ${JSON.stringify(value)}`);
                return value;
            }, err => {
                console.log(`    ${new Date().toISOString()} | Response (failed): ${err}`);
                return Promise.reject(err);
            });
        }
        return promise;
    }
    /**
     * Sends a GET request to the URI with the given session identifier.
     *
     * @param {string} uri The URI to request.
     * @param {(string|undefined)} sessionId The Cipherise session to use.
     * @returns {Promise<any>}
     * @memberof WebClient
     */
    getUri(uri, sessionId) {
        return this.getUrl(this.url + uri, sessionId);
    }
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
    checkForTimeout(error, response, body) {
        const timeoutError = new errors_1.TimeoutError("Operation timed out");
        // If there's no response, immediately exit. We can't decide anything intelligently from this,
        // except that there might be some error.
        if (response === undefined) {
            return null;
        }
        // We check for proxy error as a reverse proxy may end up terminating the response
        // before the server itself can respond, returning 502 instead of the more correct 504.
        const status = response.statusCode;
        if (status === 408 || status === 502 || status === 504) {
            return timeoutError;
        }
        // If the status is not 204 No Content and we have no content, assume it's a timeout error
        if (status !== 204 && !body) {
            return timeoutError;
        }
        // Check if the body mentions a timeout
        if (typeof body === "string") {
            body = JSON.parse(body);
        }
        if (body &&
            body.error_message &&
            body.error_message === "Request timeout") {
            return timeoutError;
        }
        return null;
    }
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
    checkForSessionExpiry(response, body) {
        // Return a session expiry error if the Cipherise session has expired.
        if (!body) {
            return null;
        }
        if (typeof body === "string") {
            body = JSON.parse(body);
        }
        if (!body.error_message) {
            return null;
        }
        const error = body.error_message.toLowerCase();
        if (error.indexOf("invalid session") !== -1 ||
            error.indexOf("expired session") !== -1) {
            return new errors_1.SessionExpiredError("Cipherise session expired");
        }
        return null;
    }
}
exports.WebClient = WebClient;
//# sourceMappingURL=web-client.js.map