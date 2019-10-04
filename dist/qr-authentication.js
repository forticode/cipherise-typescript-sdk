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
const NodeRSA = require("node-rsa");
const msgpack = require("msgpack5");
const logger_1 = require("./logger");
/**
 * [[QRAuthentication]] tracks an on-going QR authentication.
 *
 * @export
 * @class QRAuthentication
 */
class QRAuthentication {
    /**
     * Creates an instance of [[QRAuthentication]].
     * @param {Service} service The service this enrolment session originated from.
     * @param {Logger} baseLogger The base logger instance.
     * @param {string} logId The log identifier for this enrolment.
     * @param {Buffer} authChallenge The challenge posed to the device to solve.
     * @param {number} authLevel The authentication level for this authentication.
     * @param {string} initiatorUrl The URL of the direct authentication initiator to be clicked on by the client.
     * @param {string} qrCodeUrl The URL of the QR code to display for this authentication.
     * @param {string} assertionUrl The URL from which the authentication assertion can be retrieved.
     * @param {string} statusUrl The URL for the short-poll status of the authentication, so that a client can query it.
     * @memberof QRAuthentication
     */
    constructor(service, baseLogger, logId, authChallenge, authLevel, initiatorUrl, qrCodeUrl, assertionUrl, statusUrl) {
        this.service = service;
        this.baseLogger = baseLogger;
        this.logId = logId;
        this.authChallenge = authChallenge;
        this.authLevel = authLevel;
        this.initiatorUrl = initiatorUrl;
        this.qrCodeUrl = qrCodeUrl;
        this.assertionUrl = assertionUrl;
        this.statusUrl = statusUrl;
        this.logger = new logger_1.PrefixLogger(this.logId, baseLogger);
    }
    /**
     * Retrieve the current status of the QR authentication session.
     *
     * @returns {Promise<QRAuthenticationStatus>}
     * @memberof QRAuthentication
     */
    getStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.service.getUrl(this.statusUrl);
            let status = QRAuthenticationStatus.NotFound;
            switch (data.QRAuthStatus) {
                case "scanned":
                    status = QRAuthenticationStatus.Scanned;
                    break;
                case "done":
                    status = QRAuthenticationStatus.Done;
                    break;
                case "initialised":
                    status = QRAuthenticationStatus.Initialised;
                    break;
            }
            return status;
        });
    }
    /**
     * Waits for the user to authenticate, and then returns the result of the authentication.
     *
     * @returns {Promise<QRAuthenticationResult>}
     * @memberof QRAuthentication
     */
    authenticate() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.service.getUrl(this.assertionUrl);
                if (data.authenticated != "true") {
                    this.logger.debug(`Authenticated for "${data.username}", result: ${data.authenticated}`);
                    return new QRAuthenticationResult(false, data.username);
                }
                const verify = crypto.createVerify('RSA-SHA256');
                verify.update(this.authChallenge);
                verify.end();
                const publicKey = new NodeRSA(data.publicKey);
                const remoteSignature = new Buffer(data.signature, 'hex');
                const validSignature = this.service.verifySignature(remoteSignature, data.username, data.deviceId, publicKey, data.publicKeyLevel);
                if (!validSignature) {
                    this.logger.error(`Failed to validate authentication signature for "${data.username}"`);
                    throw new Error("Mismatching key signature");
                }
                const authenticated = verify.verify(publicKey.exportKey('pkcs8-public-pem'), data.userAuthChallengeSolution, 'hex');
                this.logger.debug(`Authenticated for "${data.username}", result: ${authenticated}`);
                return new QRAuthenticationResult(authenticated, data.username);
            }
            catch (err) {
                this.logger.error(`Failed to retrieve authentication result, error:`, err);
                throw err;
            }
        });
    }
    /**
     * Serializes this authentication session to a buffer.
     *
     * @returns {Buffer}
     * @memberof QRAuthentication
     */
    serialize() {
        const encoded = msgpack().encode([
            QRAuthentication.Header,
            this.logId,
            this.authChallenge,
            this.authLevel,
            this.initiatorUrl,
            this.qrCodeUrl,
            this.assertionUrl,
            this.statusUrl,
        ]);
        return encoded.slice();
    }
}
QRAuthentication.Header = "CiphUsrQ";
exports.QRAuthentication = QRAuthentication;
/**
 * QRAuthenticationStatus represents the status of an on-going QR authentication.
 *
 * @export
 * @enum {number}
 */
var QRAuthenticationStatus;
(function (QRAuthenticationStatus) {
    /**
     * The QR authentication could not be found.
     */
    QRAuthenticationStatus[QRAuthenticationStatus["NotFound"] = 0] = "NotFound";
    /**
     * The QR authentication has been started.
     */
    QRAuthenticationStatus[QRAuthenticationStatus["Initialised"] = 1] = "Initialised";
    /**
     * The QR code has been scanned.
     */
    QRAuthenticationStatus[QRAuthenticationStatus["Scanned"] = 2] = "Scanned";
    /**
     * The QR authentication has been finished.
     */
    QRAuthenticationStatus[QRAuthenticationStatus["Done"] = 3] = "Done";
})(QRAuthenticationStatus = exports.QRAuthenticationStatus || (exports.QRAuthenticationStatus = {}));
// QRAuthenticationResult contains the result of the QR authentication (i.e. whether it succeeded and who authenticated)
class QRAuthenticationResult {
    constructor(
    // Returns whether or not the authentication succeeded.
    success, 
    // Returns the username of the authenticating user.
    username) {
        this.success = success;
        this.username = username;
    }
}
exports.QRAuthenticationResult = QRAuthenticationResult;
//# sourceMappingURL=qr-authentication.js.map