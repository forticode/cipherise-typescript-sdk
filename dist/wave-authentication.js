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
 * A WaveAuth presents a WaveCode to a user; the user can then scan the WaveCode with their device
 * to authenticate. The user is unknown until the authentication is complete.
 *
 * It is useful for logging in, as it provides a frictionless experience where the user can initiate and complete
 * the authentication entirely on their device.
 *
 * To start the process, use [[Service.WaveAuth]].
 * To deserialize an authentication, use [[Service.deserializeWaveAuth]].
 *
 * @export
 * @class WaveAuth
 */
class WaveAuth extends authentication_1.Authentication {
    /**
     * @hidden
     * @internal
     *
     * Creates an instance of [[WaveAuth]].
     * @param {Service} service The service this enrolment session originated from.
     * @param {ILogger} baseLogger The base logger instance.
     * @param {string} logId The log identifier for this enrolment.
     * @param {Buffer} authChallenge The challenge posed to the device to solve.
     * @param {number} authLevel The authentication level for this authentication.
     * @param {string} initiatorUrl The URL of the direct authentication initiator to be clicked on by the client.
     * @param {string} WaveCodeUrl The URL of the WaveCode to display for this authentication.
     * @param {string} statusUrl The URL for the short-poll status of the authentication, so that a client can query it.
     * @param {string} assertionUrl The URL from which the authentication assertion can be retrieved.
     * @param {string} appChallengeUrl The URL used to retrieve the app challenge. Undefined if non-bidirectional.
     * @param {string} verifyAuthUrl The URL used to notify the app that an authentication has completed.
     * @memberof WaveAuth
     */
    constructor(service, baseLogger, logId, authChallenge, authLevel, initiatorUrl, WaveCodeUrl, statusUrl, assertionUrl, appChallengeUrl, verifyAuthUrl) {
        super(service, logId, authChallenge, authLevel, statusUrl, assertionUrl, verifyAuthUrl);
        this.baseLogger = baseLogger;
        this.initiatorUrl = initiatorUrl;
        this.WaveCodeUrl = WaveCodeUrl;
        this.appChallengeUrl = appChallengeUrl;
        this.logger = new logger_1.PrefixLogger(this.logId, baseLogger);
    }
    /**
     * Retrieves the current status of the authentication. Facilitates a non-blocking alternative
     * workflow for [[Service.WaveAuth]]. Prior to calling [[WaveAuth.authenticate]] which blocks
     * awaiting the user, this can be called to immediately return the current state of the
     * authentication.
     *
     * @returns {Promise<AuthenticationState>}
     * @memberof WaveAuth
     */
    getState() {
        const _super = Object.create(null, {
            getState: { get: () => super.getState }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const state = yield _super.getState.call(this);
            return state === authentication_1.AuthenticationState.PendingSPSolution
                ? authentication_1.AuthenticationState.Scanned
                : state;
        });
    }
    /**
     * @hidden
     * @internal
     * Retrieves the assertion from the server.
     *
     * @returns {Promise<any>}
     * @memberof WaveAuth
     */
    retrieveAssertion() {
        return __awaiter(this, void 0, void 0, function* () {
            // If bidirectional, retrieve the challenge from the app and solve it.
            const request = {};
            if (this.appChallengeUrl != null) {
                const challengeData = yield this.service.getUrl(this.appChallengeUrl);
                const appChallenge = Buffer.from(challengeData["appChallenge"], "hex");
                const appChallengeSolution = this.service.sign(appChallenge);
                request["appChallengeSolution"] = appChallengeSolution.toString("hex");
            }
            request["authenticationLevel"] = this.authLevel;
            request["authenticationChallenge"] = this.authChallenge.toString("hex");
            request["waitForAppSolution"] = true;
            return this.service.postUrl(this.assertionUrl, request);
        });
    }
    /**
     * Returns the result of the authentication. This is a blocking method. If non-blocking behaviour
     * is desired, short-poll [[WaveAuth.getState]] and call this method once the status is
     * [[AuthenticationState.Done]].
     *
     * @param {PayloadRequest} payload Optional payload request. For more information, consult the documentation
     *                                 for `PayloadRequest`.
     * @returns {Promise<AuthenticationResult>}
     * @memberof Authentication
     */
    authenticate(autoAccept = true, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.authenticateInternal(payload);
        });
    }
    /**
     * Serializes this authentication session to a buffer.
     *
     * @returns {Buffer}
     * @memberof WaveAuth
     */
    serialize() {
        const encoded = msgpack().encode([
            WaveAuth.Header,
            version_1.SERIALIZED_VERSION,
            this.logId,
            this.authChallenge,
            this.authLevel,
            this.initiatorUrl,
            this.WaveCodeUrl,
            this.statusUrl,
            this.assertionUrl,
            this.appChallengeUrl === undefined ? null : this.appChallengeUrl,
            this.verifyAuthUrl === undefined ? null : this.verifyAuthUrl
        ]);
        return encoded.slice();
    }
    /**
     * Compares two authentications for equality.
     *
     * @param {WaveAuthentication} b The authentication to compare against.
     * @returns {boolean}
     * @memberof WaveAuth
     */
    equals(b) {
        return (this.service.equals(b.service) &&
            this.logId === b.logId &&
            this.authChallenge.equals(b.authChallenge) &&
            this.authLevel === b.authLevel &&
            this.initiatorUrl === b.initiatorUrl &&
            this.WaveCodeUrl === b.WaveCodeUrl &&
            this.statusUrl === b.statusUrl &&
            this.assertionUrl === b.assertionUrl &&
            this.appChallengeUrl === b.appChallengeUrl &&
            this.verifyAuthUrl === b.verifyAuthUrl);
    }
}
exports.WaveAuth = WaveAuth;
/**
 * @hidden
 * @internal
 *
 * @static
 * @memberof WaveAuth
 */
WaveAuth.Header = "CiphUsrW";
//# sourceMappingURL=wave-authentication.js.map