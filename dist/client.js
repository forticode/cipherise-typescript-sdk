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
const NodeRSA = require("node-rsa");
const logger_1 = require("./logger");
const server_information_1 = require("./server-information");
const service_1 = require("./service");
const version_1 = require("./version");
const web_client_1 = require("./web-client");
/**
 * [[Client]] connects to the Cipherise server to facilitate interaction with it.
 *
 * @export
 * @class Client
 */
class Client {
    /**
     * Creates a Client to connect to the given Cipherise server.
     * @param {string} url The URL of the Cipherise server to connect to.
     * @param {ILogger} logger The logger to output messages to.
     * @param {boolean} validateServerVersion Whether to validate the version of the server.
     * @memberof Client
     */
    constructor(url, logger, validateServerVersion = true) {
        this.validateServerVersion = validateServerVersion;
        this.payloadSize = undefined;
        if (!logger) {
            // tslint:disable:no-empty
            logger = {
                debug: (msg, ...meta) => { },
                error: (msg, ...meta) => { },
                info: (msg, ...meta) => { },
                verbose: (msg, ...meta) => { },
                warn: (msg, ...meta) => { },
            };
            // tslint:enable:no-empty
        }
        this.baseLogger = logger;
        // Ensure that the URL actually exists.
        url = url.trim();
        if (url.length === 0) {
            throw new Error("Expected non-empty URL!");
        }
        // Always add an end-slash.
        url += "/";
        // Remove all duplicate end-slashes until we have just one.
        let endIndex = url.length;
        while (url[endIndex - 1] === url[endIndex - 2]) {
            endIndex--;
        }
        url = url.substring(0, endIndex);
        this.logger = new logger_1.PrefixLogger("Client", this.baseLogger);
        this.webClient = new web_client_1.WebClient(url, new logger_1.PrefixLogger("CWC", this.baseLogger));
    }
    /**
     * Creates a new service provider. The new [[Service]] is used to enrol and authenticate users.
     *
     * @param {string} serviceName The display name for this service provider.
     * @returns {Promise<Service>}
     * @memberof Client
     */
    createService(serviceName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.validateServerVersion) {
                yield this.serverInformation();
            }
            this.logger.info(`Creating new service "${serviceName}"`);
            const key = new NodeRSA();
            key.generateKeyPair(1024);
            try {
                const response = yield this.webClient.postUri("sp/create-service", {
                    friendlyName: serviceName,
                    publicKey: key.exportKey("pkcs8-public-pem")
                }, undefined);
                this.logger.info(`Successfully created service (id: ${response.serviceId}, name: '${serviceName}')`);
                return new service_1.Service(response.serviceId, this, this.webClient, key, null, this.logger);
            }
            catch (err) {
                this.logger.error(`Failed to create new service "${serviceName}", error:`, err);
                throw err;
            }
        });
    }
    /**
     * @deprecated Please use [[Client.deserializeServiceAsync]].
     * Deserializes the buffer into a [[Service]].
     *
     * @param {Buffer} data The buffer to deserialize.
     * @returns {Service}
     * @memberof Client
     */
    deserializeService(data) {
        const arr = msgpack().decode(data);
        if (!Array.isArray(arr)) {
            throw new Error("Attempted to deserialize service, but buffer was invalid");
        }
        if (arr.length === 0) {
            throw new Error("Attempted to deserialize service, but no components");
        }
        if (arr[0] !== service_1.Service.Header) {
            throw new Error("Attempted to deserialize service, but header not found");
        }
        if (arr.length === 5) {
            const id = arr[1];
            const key = new NodeRSA();
            key.importKey(arr[2], "pkcs1-private-der");
            // arr[3] is the signature key, which is no longer used.
            const sessionId = arr[4];
            return new service_1.Service(id, this, this.webClient, key, sessionId, this.logger);
        }
        else if (arr.length === 6) {
            if (arr[1] !== version_1.SERIALIZED_VERSION) {
                throw new Error("Attempted to deserialize service, but header not found");
            }
            const id = arr[2];
            const key = new NodeRSA();
            key.importKey(arr[3], "pkcs1-private-der");
            // arr[3] is the signature key, which is no longer used.
            const sessionId = arr[5];
            return new service_1.Service(id, this, this.webClient, key, sessionId, this.logger);
        }
        else {
            throw new Error("Attempted to deserialize service, but incorrect number of components");
        }
    }
    /**
     * Deserializes the buffer into a [[Service]].
     *
     * @param {Buffer} data The buffer to deserialize.
     * @returns {Promise<Service>}
     * @memberof Client
     */
    deserializeServiceAsync(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.validateServerVersion) {
                yield this.serverInformation();
            }
            return this.deserializeService(data);
        });
    }
    /**
     * Retrieves information about the Cipherise server.
     * Note that the minimum Cipherise server version is 6.0.0.
     *
     * @returns {Promise<ServerInformation>}
     * @memberof Client
     */
    serverInformation() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.webClient.getUri("info", undefined);
            if (response.productType !== "CS") {
                throw new Error(`Expected Cipherise server, but product type is '${response.productType}'`);
            }
            if (parseInt(response.serverVersion.split(".")[0], 10) < 6) {
                throw new Error("This version of the SDK does not support Cipherise servers older than version 6.x.x. " +
                    "Please either upgrade your Cipherise server or downgrade your SDK, as appropriate.");
            }
            this.payloadSize = response.payloadSize || 4000;
            return new server_information_1.ServerInformation(response.serverVersion, response.buildVersion, response.appMinVersion, this.payloadSize);
        });
    }
    getPayloadSize() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.payloadSize === undefined) {
                yield this.serverInformation();
            }
            return this.payloadSize;
        });
    }
}
exports.Client = Client;
//# sourceMappingURL=client.js.map