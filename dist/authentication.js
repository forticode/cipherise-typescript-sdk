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
const payload_1 = require("./payload");
const NodeRSA = require("node-rsa");
/**
 * The "level" of an authentication. The higher it is, the stronger the guarantee
 * of user identity; however, this will require a correspondingly higher level of
 * effort on the user's part.
 */
var AuthenticationLevel;
(function (AuthenticationLevel) {
    /**
     * Cipherise challenge level 1 - The least intrusive authentication method. Only requires the
     * Cipherise application to be open for authentication challenge to be solved.
     */
    AuthenticationLevel[AuthenticationLevel["Notification"] = 1] = "Notification";
    /**
     * Cipherise challenge level 2 - Interaction by user required in the Cipherise application to
     * approve, cancel or report.
     */
    AuthenticationLevel[AuthenticationLevel["Approval"] = 2] = "Approval";
    /**
     * Cipherise challenge level 3 - Interaction by user required in the Cipherise application to
     * apply a biometric input (finger print or face), or cancel or report. Note that if the device
     * the Cipherise application is running on does not have the necessary hardware or it is
     * disabled, this will be elevated to�a OneTiCK challenge.
     */
    AuthenticationLevel[AuthenticationLevel["Biometric"] = 3] = "Biometric";
    /**
     * Cipherise challenge level 4 - Interaction by user required in the Cipherise application to
     * solve the OneTiCK (One Time Cognitive Keyboard) challenge, or cancel or report.
     */
    AuthenticationLevel[AuthenticationLevel["OneTiCK"] = 4] = "OneTiCK";
})(AuthenticationLevel = exports.AuthenticationLevel || (exports.AuthenticationLevel = {}));
/**
 * Represents the final authentication state upon conclusion of the authentication process.
 */
var Authenticated;
(function (Authenticated) {
    /**
     * Indicates that the authentication was successful.
     */
    Authenticated[Authenticated["Success"] = 0] = "Success";
    /**
     * Indicates that the authentication failed. This could happen due to an error in solving the
     * OneTiCK challenge, network issues or a mismatch in the validation of the users device.
     */
    Authenticated[Authenticated["Failure"] = 1] = "Failure";
    /**
     * Indicates that the Cipherise application user has reported the authentication, cancelling the
     * authentication and informing the Cipherise Server that followup action should be taken.
     */
    Authenticated[Authenticated["Report"] = 2] = "Report";
    /**
     * Indicates that the authentication was cancelled by the Cipherise application user.
     */
    Authenticated[Authenticated["Cancel"] = 3] = "Cancel";
})(Authenticated = exports.Authenticated || (exports.Authenticated = {}));
/**
 * The result of the authentication
 */
class AuthenticationResult {
    constructor(
    /**
     * The outcome of the authentication.
     */
    authenticated, 
    /**
     * The username of the authenticating user.
     */
    username, 
    /**
     * The result of the payload actions required.
     */
    payload) {
        this.authenticated = authenticated;
        this.username = username;
        this.payload = payload;
    }
}
exports.AuthenticationResult = AuthenticationResult;
/**
 * Represents lifecycle state of an authentication. Retrieved by calling
 * [[PushAuth.getState]] or [[WaveAuth.getState]]. The status can be checked to
 * determine whether it is safe to call [[PushAuth.authenticate]] or
 * [[WaveAuth.authenticate]] depending on the type of authentication that was created,
 * both of which will block if the authentication is not at the [[AuthenticationState.Done]] state.
 */
var AuthenticationState;
(function (AuthenticationState) {
    /**
     * The authentication has been started, but no user action has occurred. The authentication
     * result request will block if called.
     */
    AuthenticationState[AuthenticationState["Initialised"] = 0] = "Initialised";
    /**
     * The WaveCode has been scanned. Only valid with WaveAuth. The authentication
     * result request will block if called.
     */
    AuthenticationState[AuthenticationState["Scanned"] = 1] = "Scanned";
    /**
     * @hidden
     * @internal
     * The SP needs to solve the challenge presented by the app.
     */
    AuthenticationState[AuthenticationState["PendingSPSolution"] = 2] = "PendingSPSolution";
    /**
     * The user still needs to solve the challenge issued by the Service Provider in the Cipherise
     * application. The authentication result request will block if called.
     */
    AuthenticationState[AuthenticationState["PendingAppSolution"] = 3] = "PendingAppSolution";
    /**
     * The authentication has been completed and the result is available. The authentication result
     * should now be requested.
     */
    AuthenticationState[AuthenticationState["Done"] = 4] = "Done";
    /**
     * The Cipherise Server does not know about this authentication. This typically occurs because
     * the authentication has already been completed or the authentication has expired. There is no
     * need to follow this up with the call to the authentication result.
     */
    AuthenticationState[AuthenticationState["NotFound"] = 5] = "NotFound";
})(AuthenticationState = exports.AuthenticationState || (exports.AuthenticationState = {}));
/**
 * Common base-class for authentications.
 */
class Authentication {
    /**
     * @hidden
     * @internal
     * Creates an instance of [[Authentication]].
     * @param {Service} service The service this enrolment session originated from.
     * @param {string} logId The log identifier for this enrolment.
     * @param {Buffer} authChallenge The challenge posed to the device to solve.
     * @param {number} authLevel The authentication level for this authentication.
     * @param {string} statusUrl The URL for the short-poll status of the authentication, so that a client can query it.
     * @param {string} assertionUrl The URL from which the authentication assertion can be retrieved.
     * @param {string} verifyAuthUrl The URL used to notify the app that an authentication has completed.
     * @memberof WaveAuth
     */
    constructor(service, logId, authChallenge, authLevel, statusUrl, assertionUrl, verifyAuthUrl) {
        this.service = service;
        this.logId = logId;
        this.authChallenge = authChallenge;
        this.authLevel = authLevel;
        this.statusUrl = statusUrl;
        this.assertionUrl = assertionUrl;
        this.verifyAuthUrl = verifyAuthUrl;
    }
    /**
     * Should not be directly called. Overridden by [[PushAuth.getState]] and
     * [[WaveAuth.getState]].
     *
     * @returns {Promise<AuthenticationState>}
     * @memberof Authentication
     */
    getState() {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.service.getUrl(this.statusUrl);
            switch (data.statusText) {
                case "initialised":
                    return AuthenticationState.Initialised;
                case "scanned":
                    return AuthenticationState.Scanned;
                case "pending sp solution":
                    return AuthenticationState.PendingSPSolution;
                case "pending app solution":
                    return AuthenticationState.PendingAppSolution;
                case "done":
                    return AuthenticationState.Done;
                case "not found":
                    return AuthenticationState.NotFound;
                default:
                    throw new Error(`Unexpected status ${data.statusText} for authentication (${this.logId})`);
            }
        });
    }
    /**
     * @deprecated Please use [[getState]] instead.
     * Retrieve the current status of the authentication.
     *
     * @returns {Promise<AuthenticationState>}
     * @memberof Authentication
     */
    getStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getState();
        });
    }
    /**
     * @hidden
     * @internal
     * Returns the result of the authentication. Blocking; if non-blocking behaviour is desired, short-poll [[Authentication.getState]]
     * and call this method once the status is [[AuthenticationState.Done]].
     *
     * @param {PayloadRequest} payload Optional payload request. For more information, consult the documentation
     *                                 for `PayloadRequest`.
     * @returns {Promise<AuthenticationResult>}
     * @memberof Authentication
     */
    authenticateInternal(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.retrieveAssertion();
            this.verifyAuthUrl = data["verifyAuthenticationURL"];
            const username = data["username"];
            let authenticated = false;
            const payloadResponse = new payload_1.PayloadResponse();
            if (data["authenticated"] === "cancelled") {
                yield this.accept(authenticated, data["authenticated"]);
                return new AuthenticationResult(Authenticated.Cancel, username, payloadResponse);
            }
            if (data["authenticated"] === "reported") {
                yield this.accept(authenticated, data["authenticated"]);
                return new AuthenticationResult(Authenticated.Report, username, payloadResponse);
            }
            if (data["authenticated"] !== "true") {
                yield this.accept(authenticated);
                return new AuthenticationResult(Authenticated.Failure, username, payloadResponse);
            }
            const publicKey = new NodeRSA(data["publicKey"]);
            const validSignature = this.service.verifySignature(Buffer.from(data["keySignature"], "hex"), data["username"], data["deviceId"], publicKey, data["publicKeyLevel"]);
            publicKey.setOptions({
                encryptionScheme: "pkcs1"
            });
            if (!validSignature) {
                yield this.accept(false, `Mismatching key signatures for \`${username}\`; re-authentication may be necessary`);
                throw new Error(`Mismatching key signatures for \`${username}\`; re-authentication may be necessary`);
            }
            authenticated = publicKey.verify(this.authChallenge, Buffer.from(data["authenticationSolution"], "hex"));
            let payloadValid = true;
            if (payload !== undefined) {
                const payloadRequest = {
                    payload: yield this.service.encryptPayloadData(publicKey, {
                        get: payload.get,
                        set: payload.set
                    })
                };
                const payloadResponseEncrypted = yield this.service.postUrl(data["payloadURL"], payloadRequest);
                const payloadResponseJson = this.service.decryptPayloadJson(publicKey, payloadResponseEncrypted["payload"]);
                const payloadSetEmpty = Object.keys(payload.set).length === 0;
                if (!payloadSetEmpty) {
                    payloadResponse.set = payloadResponseJson["setResponse"];
                }
                payloadResponse.get = Object.assign(Object.assign({}, payloadResponse.get), payloadResponseJson["getResponse"]);
                payloadValid = payloadSetEmpty || payloadResponse.set;
            }
            yield this.accept(authenticated && payloadValid);
            const result = authenticated
                ? Authenticated.Success
                : Authenticated.Failure;
            return new AuthenticationResult(result, username, payloadResponse);
        });
    }
    /**
     * @hidden
     * @internal
     * Notifies the app as to whether an authentication succeeded or failed.
     *
     * Can be used to inform the app that the authentication has failed for other reasons (e.g.
     * failed authorization).
     *
     * @param {boolean} accepted Whether or not the authentication has been accepted.
     * @param {string} failReason The reason that the authentication failed.
     * @memberof Authentication
     */
    accept(accepted, failReason) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.verifyAuthUrl === undefined) {
                throw new Error("Expected authentication verification URL. Has `authenticate` been called?");
            }
            return this.service.postUrl(this.verifyAuthUrl, {
                failReason,
                verified: accepted,
            });
        });
    }
}
exports.Authentication = Authentication;
//# sourceMappingURL=authentication.js.map