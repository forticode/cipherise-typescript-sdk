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
const crypto = require("crypto");
const msgpack = require("msgpack5");
const errors_1 = require("./errors");
const logger_1 = require("./logger");
const util = require("./util");
const version_1 = require("./version");
const device_1 = require("./device");
const enrolment_1 = require("./enrolment");
const push_authentication_1 = require("./push-authentication");
const wave_authentication_1 = require("./wave-authentication");
/**
 * [[Service]] represents a service provider on the Cipherise server.
 *
 * @export
 * @class Service
 */
class Service {
    /**
     * @hidden
     * @internal
     * Creates an instance of Service. This method should not be used directly;
     * please use [[Client.createService]].
     *
     * If you would like to load an existing service, serialize the existing
     * service with [[serialize]] and then use [[Client.deserializeService]].
     * This allows you to use a storage mechanism that is appropriate for your
     * environment.
     */
    constructor(id, client, webClient, key, sessionId, baseLogger) {
        this.id = id;
        this.client = client;
        this.webClient = webClient;
        this.key = key;
        this.sessionId = sessionId;
        this.baseLogger = baseLogger;
        this.logger = new logger_1.PrefixLogger(`Service(id: ${id})`, this.baseLogger);
        this.key.setOptions({
            encryptionScheme: "pkcs1"
        });
    }
    // ------------------
    // Service operations
    // ------------------
    /**
     * Revokes this service, so that it cannot be used for any further operations.
     * To reactivate this service, re-enrol it.
     *
     * @returns {Promise<boolean>}
     * @memberof Service
     */
    revoke() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info(`Revoking service`);
            try {
                const data = yield this.postUri("sp/revoke-service", {});
                return data.ok;
            }
            catch (err) {
                this.logger.error(`Failed to revoke service`, err);
                throw err;
            }
        });
    }
    // ---------------
    // User operations
    // ---------------
    /**
     * Returns a list of devices associated with the given user.
     * Will return an empty list if the user has not enrolled.
     *
     * @param {string} username The username to find devices for.
     * @returns {Promise<Device[]>}
     * @memberof Service
     */
    getUserDevices(username) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info(`Retrieving devices for "${username}"`);
            try {
                const data = yield this.getUri(`sp/user-devices/${username}`);
                const devices = [];
                const devicesJson = data.devices;
                // Assume invalid unless there are no devices
                let foundValidDevice = devicesJson.length === 0;
                devicesJson.forEach(deviceJson => {
                    this.logger.verbose(`"${username}" device: ${JSON.stringify(deviceJson)}`, data);
                    const publicKeys = util.objectToPublicKeyMap(deviceJson.publicKeys);
                    for (const level in deviceJson.signatures) {
                        if (!deviceJson.signatures.hasOwnProperty(level)) {
                            continue;
                        }
                        const levelNumber = Number(level);
                        const theirSignature = Buffer.from(deviceJson.signatures[level], "hex");
                        const validSignature = this.verifySignature(theirSignature, username, deviceJson.deviceId, publicKeys.get(levelNumber), levelNumber);
                        this.logger.verbose(`"${username}" remote signature: ${theirSignature.toString("hex")}`, data);
                        if (validSignature) {
                            foundValidDevice = true;
                        }
                        else {
                            return;
                        }
                    }
                    devices.push(new device_1.Device(deviceJson.deviceId, deviceJson.friendlyName, publicKeys));
                });
                this.logger.verbose(`"${username}": List of verified devices: `, devices);
                if (!foundValidDevice) {
                    this.logger.warn(`"${username}": No verified devices found; user may need to re-enrol`);
                    throw new Error("Mismatching key signatures");
                }
                return devices;
            }
            catch (err) {
                this.logger.error(`Failed to retrieve devices for "${username}"`, err);
                throw err;
            }
        });
    }
    /**
     * Returns whether or not the given user has enrolled to this service.
     *
     * @param {string} username The username to check enrolment for.
     * @returns {Promise<boolean>}
     * @memberof Service
     */
    userEnrolled(username) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.getUserDevices(username)).length > 0;
        });
    }
    /**
     * Revokes a user from the service.
     *
     * @param {string} username The username to revoke.
     * @param {Device[]} devices The devices to revoke. Optional.
     * @returns {Promise<void>}
     * @memberof Service
     */
    revokeUser(username, devices) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info(`Revoking user "${username}"`);
            const request = { username };
            if (devices) {
                request.deviceIds = devices.map(a => a.id);
            }
            try {
                yield this.postUri("sp/revoke-user/", request);
                this.logger.verbose(`Successfully revoked user "${username}"`);
            }
            catch (err) {
                this.logger.error(`Failed to revoke user "${username}", error:`, err);
                throw err;
            }
        });
    }
    // --------------
    // User enrolment
    // --------------
    /**
     * Starts a Cipherise enrolment for the given user.
     *
     * @param {string} username The username to enrol.
     * @returns {Promise<Enrolment>}
     * @memberof Service
     */
    enrolUser(username) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info(`Enrolling ${username}`);
            try {
                const data = yield this.postUri(`sp/enrol-user/`, { username });
                this.logger.debug(`Enrolment initiated (WaveCodeUrl: ${data.WaveCodeURL}, validateUrl: ${data.validateURL})`);
                return new enrolment_1.Enrolment(this, this.baseLogger, data.logId, data.qrCodeURL, data.directEnrolURL, data.statusURL, data.validateURL, username);
            }
            catch (err) {
                this.logger.error(`Failed to enrol "${username}", error:`, err);
                throw err;
            }
        });
    }
    // -------------------
    // Authentication
    // -------------------
    /**
     * Starts a PushAuth for the given user.
     *
     * @param {string} username The username to authenticate.
     * @param {Device} device The device to authenticate against.
     *                        A list of devices can be retrieved from [[getUserDevices]].
     * @param {string} authenticationMessage The message to display at the top of the authentication screen.
     * @param {string} brandingMessage The message to display at the bottom of the authentication screen.
     * @param {string} notificationMessage The message to display in the push notification to the device.
     * @param {AuthenticationLevel} authLevel The authentication level to use.
     * @returns {Promise<PushAuth>}
     * @memberof Service
     */
    PushAuth(username, device, authenticationMessage, brandingMessage, notificationMessage, authLevel) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info(`Authenticating "${username}" on device "${device.name}" (id: ${device.id})`);
            this.logger.debug(`Parameters: authenticationMessage "${authenticationMessage}", notificationMessage: "${notificationMessage}", brandingMessage: "${brandingMessage}", authLevel: ${authLevel}`);
            const authChallenge = crypto.randomBytes(8);
            const request = {
                authenticationChallenge: authChallenge.toString("hex"),
                authenticationLevel: authLevel,
                authenticationMessage,
                brandingMessage,
                deviceId: device.id,
                interaction: "Push",
                notificationMessage,
                payloadRequired: false,
                type: "Authentication",
                username,
            };
            try {
                const data = yield this.postUri("sp/authentication", request);
                const assertionUrl = data["challengeExchangeURL"];
                const challengeData = yield this.getUrl(data["appAuthenticationURL"]);
                const appChallenge = Buffer.from(challengeData["appChallenge"], "hex");
                const appChallengeSolution = this.sign(appChallenge);
                yield this.postUrl(assertionUrl, {
                    appChallengeSolution: appChallengeSolution.toString("hex"),
                    authenticationChallenge: authChallenge.toString("hex"),
                    authenticationLevel: authLevel,
                    waitForAppSolution: false
                });
                return new push_authentication_1.PushAuth(this, this.baseLogger, data.logId, authChallenge, authLevel, username, device, data.statusURL, assertionUrl, undefined);
            }
            catch (err) {
                this.logger.error(`Failed to initiate authentication for "${username}" on device "${device.name}" (id: ${device.id}), error:`, err);
                throw err;
            }
        });
    }
    /**
     * Starts a WaveAuth.
     *
     * @param {string} authenticationMessage The message to display at the top of the authentication screen.
     * @param {string} brandingMessage The message to display at the bottom of the authentication screen.
     * @param {AuthenticationLevel} authLevel The authentication level to use.
     * @returns {Promise<WaveAuth>}
     * @memberof Service
     */
    WaveAuth(authenticationMessage, brandingMessage, authLevel) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info(`Wave authenticating with authMessage "${authenticationMessage}", brandMessage: "${brandingMessage}", authLevel: ${authLevel}`);
            const authChallenge = crypto.randomBytes(8);
            const request = {
                authenticationChallenge: authChallenge.toString("hex"),
                authenticationLevel: authLevel,
                authenticationMessage,
                brandingMessage,
                interaction: "Wave",
                payloadRequired: false,
                type: "Authentication",
            };
            try {
                const data = yield this.postUri("sp/authentication", request);
                this.logger.verbose(`Retrieved wave authentication data: \`${JSON.stringify(data)}\``);
                return new wave_authentication_1.WaveAuth(this, this.baseLogger, data.logId, authChallenge, authLevel, data.directURL, data.qrURL, data.statusURL, data.challengeExchangeURL, data.appAuthenticationURL, undefined);
            }
            catch (err) {
                this.logger.error(`Failed to initiate wave authentication, error:`, err);
                throw err;
            }
        });
    }
    // -------------------
    // De/serialization
    // -------------------
    /**
     * Serializes this service to a buffer.
     *
     * @returns {Buffer}
     * @memberof Service
     */
    serialize() {
        const encoded = msgpack().encode([
            Service.Header,
            version_1.SERIALIZED_VERSION,
            this.id,
            this.key.exportKey("pkcs1-private-der"),
            null,
            this.sessionId
        ]);
        return encoded.slice();
    }
    /**
     * Deserializes the buffer into an enrolment session.
     *
     * @param {Buffer} data The buffer to deserialize.
     * @returns {Enrolment}
     * @memberof Service
     */
    deserializeEnrolment(data) {
        const arr = msgpack().decode(data);
        if (!Array.isArray(arr)) {
            throw new Error("Attempted to deserialize enrolment, but buffer was invalid");
        }
        if (arr.length !== 11) {
            throw new Error("Attempted to deserialize enrolment, but incorrect number of components");
        }
        if (arr[0] !== enrolment_1.Enrolment.Header) {
            throw new Error("Attempted to deserialize enrolment, but header not found");
        }
        if (arr[1] !== version_1.SERIALIZED_VERSION) {
            throw new Error("Attempted to deserialize PushAuth, but wrong version");
        }
        const logId = arr[2];
        const WaveCodeUrl = arr[3];
        const directEnrolUrl = arr[4];
        const statusUrl = arr[5];
        const validateUrl = arr[6];
        const username = arr[7];
        const confirmationUrl = arr[8];
        const deviceId = arr[9];
        const publicKeys = util.objectToPublicKeyMap(arr[10]);
        return new enrolment_1.Enrolment(this, this.baseLogger, logId, WaveCodeUrl, directEnrolUrl, statusUrl, validateUrl, username, publicKeys, deviceId, confirmationUrl);
    }
    /**
     * Deserializes the buffer into a PushAuth session.
     *
     * @param {Buffer} data The buffer to deserialize.
     * @returns {PushAuth}
     * @memberof Service
     */
    deserializePushAuth(data) {
        const arr = msgpack().decode(data);
        if (!Array.isArray(arr)) {
            throw new Error("Attempted to deserialize PushAuth, but buffer was invalid");
        }
        if (arr.length !== 10) {
            throw new Error("Attempted to deserialize PushAuth, but incorrect number of components");
        }
        if (arr[0] !== push_authentication_1.PushAuth.Header) {
            throw new Error("Attempted to deserialize PushAuth, but header not found");
        }
        if (arr[1] !== version_1.SERIALIZED_VERSION) {
            throw new Error("Attempted to deserialize PushAuth, but wrong version");
        }
        const logId = arr[2];
        const authChallenge = arr[3];
        const level = arr[4];
        const username = arr[5];
        const device = device_1.Device.deserialize(arr[6]);
        const statusUrl = arr[7];
        const assertionUrl = arr[8];
        const verifyAuthUrl = arr[9];
        return new push_authentication_1.PushAuth(this, this.baseLogger, logId, authChallenge, level, username, device, statusUrl, assertionUrl, verifyAuthUrl === null ? undefined : verifyAuthUrl);
    }
    /**
     * Deserializes the buffer into a WaveAuth session.
     *
     * @param {Buffer} data The buffer to deserialize.
     * @returns {WaveAuth}
     * @memberof Service
     */
    deserializeWaveAuth(data) {
        const arr = msgpack().decode(data);
        if (!Array.isArray(arr)) {
            throw new Error("Attempted to deserialize WaveAuth, but buffer was invalid");
        }
        if (arr.length !== 11) {
            throw new Error("Attempted to deserialize WaveAuth, but incorrect number of components");
        }
        if (arr[0] !== wave_authentication_1.WaveAuth.Header) {
            throw new Error("Attempted to deserialize WaveAuth, but header not found");
        }
        if (arr[1] !== version_1.SERIALIZED_VERSION) {
            throw new Error("Attempted to deserialize WaveAuth, but wrong version");
        }
        const logId = arr[2];
        const authChallenge = arr[3];
        const authLevel = arr[4];
        const initiatorUrl = arr[5];
        const WaveCodeUrl = arr[6];
        const statusUrl = arr[7];
        const assertionUrl = arr[8];
        const appChallengeUrl = arr[9];
        const verifyAuthUrl = arr[10];
        return new wave_authentication_1.WaveAuth(this, this.baseLogger, logId, authChallenge, authLevel, initiatorUrl, WaveCodeUrl, statusUrl, assertionUrl, appChallengeUrl === null ? undefined : appChallengeUrl, verifyAuthUrl === null ? undefined : verifyAuthUrl);
    }
    // -------------------
    // Access helpers
    // -------------------
    // These helpers pass along the session id. Additionally, they attempt to
    // send the request twice; if it fails the first time with a session error,
    // it will refresh and try again.
    // Otherwise, if they succeed, another attempt will not be made. If they
    // fail with a non-session error, the error will be propagated upwards.
    /**
     * @hidden
     * @internal
     * Sends an authenticated POST request to the URL with the given form.
     *
     * @param {string} url The URL to request.
     * @param {*} form The data to send.
     * @returns {Promise<any>}
     * @memberof WebClient
     */
    postUrl(url, form) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let i = 0; i < 2; i++) {
                try {
                    return yield this.webClient.postUrl(url, form, this.sessionId ? this.sessionId : undefined);
                }
                catch (err) {
                    if (err instanceof errors_1.SessionExpiredError) {
                        yield this.refreshSession();
                    }
                    else {
                        throw err;
                    }
                }
            }
        });
    }
    /**
     * @hidden
     * @internal
     * Sends an authenticated POST request to the URI with the given form.
     *
     * @param {string} uri The URI to request.
     * @param {*} form The data to send.
     * @returns {Promise<any>}
     * @memberof WebClient
     */
    postUri(uri, form) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let i = 0; i < 2; i++) {
                try {
                    return yield this.webClient.postUri(uri, form, this.sessionId ? this.sessionId : undefined);
                }
                catch (err) {
                    if (err instanceof errors_1.SessionExpiredError) {
                        yield this.refreshSession();
                    }
                    else {
                        throw err;
                    }
                }
            }
        });
    }
    /**
     * @hidden
     * @internal
     * Sends an authenticated GET request to the URL.
     *
     * @param {string} url The URL to request.
     * @returns {Promise<any>}
     * @memberof WebClient
     */
    getUrl(url) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let i = 0; i < 2; i++) {
                try {
                    return yield this.webClient.getUrl(url, this.sessionId ? this.sessionId : undefined);
                }
                catch (err) {
                    if (err instanceof errors_1.SessionExpiredError) {
                        yield this.refreshSession();
                    }
                    else {
                        throw err;
                    }
                }
            }
        });
    }
    /**
     * @hidden
     * @internal
     * Sends an authenticated GET request to the URI.
     *
     * @param {string} uri The URI to request.
     * @returns {Promise<any>}
     * @memberof WebClient
     */
    getUri(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let i = 0; i < 2; i++) {
                try {
                    return yield this.webClient.getUri(uri, this.sessionId ? this.sessionId : undefined);
                }
                catch (err) {
                    if (err instanceof errors_1.SessionExpiredError) {
                        yield this.refreshSession();
                    }
                    else {
                        throw err;
                    }
                }
            }
        });
    }
    // -------------------
    // Helper methods
    // -------------------
    /**
     * @hidden
     * @internal
     * Signs an arbitrary buffer with the service's private key.
     *
     * @param {Buffer} data Data to sign.
     * @returns {Buffer}
     * @memberof Service
     */
    sign(data) {
        return this.key.sign(data);
    }
    /**
     * @hidden
     * @internal
     * Calculates the data to sign for a signature that can be used to determine whether user data has been tampered with.
     *
     * @param {string} username The username belonging to the enrolled user.
     * @param {string} deviceId The identifier of the device being used.
     * @param {NodeRSA} publicKey The public key of the device.
     * @param {number} publicKeyLevel The authentication level for the particular public key in use.
     * @returns {Buffer}
     * @memberof Service
     */
    calculateSignatureData(username, deviceId, publicKey, publicKeyLevel) {
        const hash = crypto.createHash("sha256");
        for (const val of [
            this.webClient.url.toLowerCase(),
            this.id,
            username.toLowerCase(),
            deviceId,
            publicKey.exportKey("pkcs8-public-pem") + "\n",
            publicKeyLevel.toString()
        ]) {
            hash.update(val, "utf8");
        }
        return hash.digest();
    }
    /**
     * @hidden
     * @internal
     * Calculates a signature that can be used to determine whether user data has been tampered with.
     *
     * @param {string} username The username belonging to the enrolled user.
     * @param {string} deviceId The identifier of the device being used.
     * @param {NodeRSA} publicKey The public key of the device.
     * @param {number} publicKeyLevel The authentication level for the particular public key in use.
     * @returns {Buffer}
     * @memberof Service
     */
    calculateSignature(username, deviceId, publicKey, publicKeyLevel) {
        const signatureData = this.calculateSignatureData(username, deviceId, publicKey, publicKeyLevel);
        const signature = this.sign(signatureData);
        const values = {
            authLevel: String(publicKeyLevel),
            deviceId,
            publicKey: publicKey.exportKey("pkcs8-public-pem"),
            serviceId: this.id,
            username,
        };
        this.logger.verbose(`Calculated signature with values ${JSON.stringify(values)}, result == ${signature.toString("hex")}`);
        return signature;
    }
    /**
     * @hidden
     * @internal
     * Verifies a signature that was calculated with [[Service.calculateSignature]].
     *
     * @param {string} username The username belonging to the enrolled user.
     * @param {string} deviceId The identifier of the device being used.
     * @param {NodeRSA} publicKey The public key of the device.
     * @param {number} publicKeyLevel The authentication level for the particular public key in use.
     * @returns {boolean}
     * @memberof Service
     */
    verifySignature(signature, username, deviceId, publicKey, publicKeyLevel) {
        const signatureData = this.calculateSignatureData(username, deviceId, publicKey, publicKeyLevel);
        return this.key.verify(signatureData, signature);
    }
    /**
     * Compares two services for equality.
     *
     * @param {Service} b The service to compare against.
     * @returns {boolean}
     * @memberof Service
     */
    equals(b) {
        return (this.id === b.id &&
            this.webClient.url === b.webClient.url &&
            this.key
                .exportKey("pkcs1-private-der")
                .equals(b.key.exportKey("pkcs1-private-der")));
    }
    /**
     * @hidden
     * @internal
     * Decodes a payload structure and decrypts the JSON within.
     * That is, { data: string, key: string, signature: string } -> decrypted data.
     */
    decryptPayloadJson(initiatorPublicKey, json) {
        const encryptedDataWithIV = Buffer.from(json.data, "hex");
        const encryptedKey = Buffer.from(json.key, "hex");
        const signature = Buffer.from(json.signature, "hex");
        if (!initiatorPublicKey.verify(encryptedKey, signature)) {
            throw new Error("Failed payload signature verification");
        }
        const key = this.key.decrypt(encryptedKey);
        const ivBound = encryptedDataWithIV.length - 16;
        if (ivBound <= 0) {
            throw new Error("Data field insufficiently long for both data and IV");
        }
        const encryptedData = encryptedDataWithIV.slice(0, ivBound);
        const iv = encryptedDataWithIV.slice(ivBound, encryptedDataWithIV.length);
        const decipher = crypto.createDecipheriv("aes-256-cfb", key, iv);
        const data = Buffer.concat([
            decipher.update(encryptedData),
            decipher.final()
        ]);
        return JSON.parse(data.toString("utf8"));
    }
    /**
     * @hidden
     * @internal
     * Encrypts JSON and encodes it in a payload structure.
     * That is, decrypted data -> { data: string, key: string, signature: string }.
     */
    encryptPayloadData(recipientPublicKey, json) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = JSON.stringify(json);
            const key = crypto.randomBytes(256 / 8);
            const iv = crypto.randomBytes(128 / 8);
            const cipher = crypto.createCipheriv("aes-256-cfb", key, iv);
            const encryptedData = Buffer.concat([
                cipher.update(Buffer.from(data, "utf8")),
                cipher.final()
            ]);
            const encryptedDataWithIV = Buffer.concat([encryptedData, iv]);
            const encryptedKey = recipientPublicKey.encrypt(key);
            const signature = this.key.sign(encryptedKey);
            const payloadSize = yield this.client.getPayloadSize();
            if (encryptedDataWithIV.length * 2 >= payloadSize) {
                throw new errors_1.PayloadDataLengthExceededError(`Payload data length limit exceeded: length ${encryptedDataWithIV.length}, but max ${payloadSize}`);
            }
            return {
                data: encryptedDataWithIV.toString("hex"),
                key: encryptedKey.toString("hex"),
                signature: signature.toString("hex")
            };
        });
    }
    // -------------------
    // Internal methods
    // -------------------
    /**
     * Refreshes the session associated with this service provider.
     *
     * @private
     * @memberof Service
     */
    refreshSession() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info(`Authenticating`);
            try {
                const challengeData = yield this.getUri(`sp/authenticate-service/${this.id}`);
                const spAuthChallengeSolution = this.key.sign(challengeData.spAuthChallenge, "hex", "hex");
                const responseData = yield this.postUri(`sp/authenticate-service/`, {
                    authToken: challengeData.authToken,
                    spAuthChallengeSolution
                });
                this.sessionId = responseData.sessionId;
                this.logger.info(`Successfully authenticated, session id: ${this.sessionId}`);
            }
            catch (err) {
                this.logger.error(`Failed to authenticate service, error:`, err);
                throw err;
            }
        });
    }
}
exports.Service = Service;
/**
 * @hidden
 * @internal
 *
 * @static
 * @memberof Service
 */
Service.Header = "CiphSrvc";
//# sourceMappingURL=service.js.map