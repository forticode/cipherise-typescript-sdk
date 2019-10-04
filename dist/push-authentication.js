"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const msgpack = require("msgpack5");
const authentication_1 = require("./authentication");
const logger_1 = require("./logger");
const version_1 = require("./version");
/**
 * A PushAuth is a Cipherise authentication that is sent to a particular user's device.
 * Upon receiving the authentication, the user must respond to it.
 *
 * It is useful for when the user and their device are already known, but are required to re-authenticate
 * (e.g. asserting their identity for a process of elevated permission).
 *
 * To start the process, use [[Service.PushAuth]].
 * To deserialize an authentication, use [[Service.deserializePushAuth]].
 *
 * @export
 * @class PushAuth
 */
class PushAuth extends authentication_1.Authentication {
    /**
     * @hidden
     * @internal
     *
     * Creates an instance of PushAuth. This should not be directly used;
     * please use [[Service.PushAuth]].
     * @param {Service} service The service this authentication session originated from.
     * @param {ILogger} baseLogger The base logger instance.
     * @param {string} logId The log identifier for this authentication.
     * @param {Buffer} authChallenge The challenge posed to the device to solve.
     * @param {number} authLevel The authentication level for this authentication.
     * @param {string} username The username of the authenticating user.
     * @param {Device} device The username of the device user.
     * @param {string} statusUrl The URL for the short-poll status of the authentication, so that a client can query it.
     * @param {string} assertionUrl The URL from which the authentication assertion can be retrieved.
     * @param {string} verifyAuthUrl The URL used to notify the app that an authentication has completed.
     * @memberof PushAuth
     */
    constructor(service, baseLogger, logId, authChallenge, authLevel, username, device, statusUrl, assertionUrl, verifyAuthUrl) {
        super(service, logId, authChallenge, authLevel, statusUrl, assertionUrl, verifyAuthUrl);
        this.baseLogger = baseLogger;
        this.username = username;
        this.device = device;
        this.logger = new logger_1.PrefixLogger(this.logId, baseLogger);
    }
    /**
     * Retrieve the current status of the authentication.
     *
     * @returns {Promise<AuthenticationStatus>}
     * @memberof PushAuth
     */
    getState() {
        const _super = Object.create(null, {
            getState: { get: () => super.getState }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const state = yield _super.getState.call(this);
            return state === authentication_1.AuthenticationState.PendingSPSolution
                ? authentication_1.AuthenticationState.Initialised
                : state;
        });
    }
    /**
     * Waits for the user to authenticate, and then returns
     * whether or not the authentication succeeded.
     * @param {PayloadRequest} payload Optional payload request. For more information, consult the documentation
     *                                 for `PayloadRequest`.
     * @returns {Promise<AuthenticationResult>}
     * @memberof PushAuth
     */
    authenticate(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.authenticateInternal(payload);
            return result;
        });
    }
    /**
     * Serializes this authentication session to a buffer.
     *
     * @returns {Buffer}
     * @memberof PushAuth
     */
    serialize() {
        const encoded = msgpack().encode([
            PushAuth.Header,
            version_1.SERIALIZED_VERSION,
            this.logId,
            this.authChallenge,
            this.authLevel,
            this.username,
            this.device.serialize(),
            this.statusUrl,
            this.assertionUrl,
            this.verifyAuthUrl === undefined ? null : this.verifyAuthUrl
        ]);
        return encoded.slice();
    }
    /**
     * Compares two authentications for equality.
     *
     * @param {PushAuth} b The authentication to compare against.
     * @returns {boolean}
     * @memberof PushAuth
     */
    equals(b) {
        return (this.service.equals(b.service) &&
            this.logId === b.logId &&
            this.authChallenge.equals(b.authChallenge) &&
            this.authLevel === b.authLevel &&
            this.username === b.username &&
            this.device.equals(b.device) &&
            this.statusUrl === b.statusUrl &&
            this.assertionUrl === b.assertionUrl &&
            this.verifyAuthUrl === b.verifyAuthUrl);
    }
    /**
     * @hidden
     * @internal
     * Retrieves the assertion from the server.
     *
     * @returns {Promise<any>}
     * @memberof PushAuth
     */
    retrieveAssertion() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.service.getUrl(this.assertionUrl);
        });
    }
}
exports.PushAuth = PushAuth;
/**
 * @hidden
 * @internal
 *
 * @static
 * @memberof PushAuth
 */
PushAuth.Header = "CiphUsrP";
//# sourceMappingURL=push-authentication.js.map