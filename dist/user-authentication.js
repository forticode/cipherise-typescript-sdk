"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require("crypto");
const msgpack = require("msgpack5");
const logger_1 = require("./logger");
/**
 * [[UserAuthentication]] tracks an ongoing user authentication.
 *
 * @export
 * @class UserAuthentication
 */
class UserAuthentication {
    /**
     * Creates an instance of UserAuthentication. This should not be directly used;
     * please use [[Service.userAuthenticate]].
     * @param {Service} service The service this authentication session originated from.
     * @param {Logger} baseLogger The base logger instance.
     * @param {string} logId The log identifier for this authentication.
     * @param {Buffer} userAuthChallenge The challenge posed to the device to solve.
     * @param {string} username The username of the authenticating user.
     * @param {Device} device The username of the device user.
     * @param {string} assertionUri The URL from which the authentication assertion can be retrieved.
     * @memberof UserAuthentication
     */
    constructor(service, baseLogger, logId, userAuthChallenge, username, device, assertionUri) {
        this.service = service;
        this.baseLogger = baseLogger;
        this.logId = logId;
        this.userAuthChallenge = userAuthChallenge;
        this.username = username;
        this.device = device;
        this.assertionUri = assertionUri;
        this.logger = new logger_1.PrefixLogger(this.logId, baseLogger);
    }
    // Status: Currently unimplemented as CS doesn't have support for user authentication short-polling. (CSGO-72)
    // // Returns the URL for the short-poll status of the authentication, so that a client can query it.
    // readonly statusUrl: string;
    // // Retrieve the current status of the user authentication session.
    // getStatus(): Promise<UserAuthenticationStatus>;
    /**
     * Waits for the user to authenticate, and then returns
     * whether or not the authentication succeeded.
     *
     * @returns {Promise<boolean>}
     * @memberof UserAuthentication
     */
    authenticate() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.service.getUri(this.assertionUri);
                const verify = crypto.createVerify('RSA-SHA256');
                verify.update(this.userAuthChallenge);
                verify.end();
                const authLevel = data.publicKeyLevel;
                const publicKeyRSA = this.device.keys.get(authLevel);
                if (!publicKeyRSA) {
                    const errorMessage = `Failed to retrieve device public key for `
                        + `"${this.username}" on device `
                        + `"${this.device.name}" (id: ${this.device.id})`
                        + ` at level ${authLevel}`;
                    this.logger.error(errorMessage);
                    throw new Error(errorMessage);
                }
                const publicKey = publicKeyRSA.exportKey('pkcs8-public-pem');
                const authenticated = data.authenticated == "true" &&
                    verify.verify(publicKey, data.userAuthChallengeSolution, 'hex');
                this.logger.debug(`Authenticated for "${this.username}" on device "${this.device.name}" (id: ${this.device.id}), result: ${authenticated}`, data);
                return authenticated;
            }
            catch (err) {
                this.logger.error(`Failed to retrieve authentication result for "${this.username}" on device "${this.device.name}" (id: ${this.device.id}), error:`, err);
                throw err;
            }
        });
    }
    /**
     * Serializes this authentication session to a buffer.
     *
     * @returns {Buffer}
     * @memberof UserAuthentication
     */
    serialize() {
        const encoded = msgpack().encode([
            UserAuthentication.Header,
            this.logId,
            this.userAuthChallenge,
            this.username,
            this.device.serialize(),
            this.assertionUri,
        ]);
        return encoded.slice();
    }
}
UserAuthentication.Header = "CiphUsrA";
exports.UserAuthentication = UserAuthentication;
//# sourceMappingURL=user-authentication.js.map