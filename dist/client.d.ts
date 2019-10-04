/// <reference types="node" />
import { ILogger } from "./logger";
import { ServerInformation } from "./server-information";
import { Service } from "./service";
/**
 * [[Client]] connects to the Cipherise server to facilitate interaction with it.
 *
 * @export
 * @class Client
 */
export declare class Client {
    private validateServerVersion;
    private baseLogger;
    private logger;
    private webClient;
    private payloadSize;
    /**
     * Creates a Client to connect to the given Cipherise server.
     * @param {string} url The URL of the Cipherise server to connect to.
     * @param {ILogger} logger The logger to output messages to.
     * @param {boolean} validateServerVersion Whether to validate the version of the server.
     * @memberof Client
     */
    constructor(url: string, logger?: ILogger, validateServerVersion?: boolean);
    /**
     * Creates a new service provider. The new [[Service]] is used to enrol and authenticate users.
     *
     * @param {string} serviceName The display name for this service provider.
     * @returns {Promise<Service>}
     * @memberof Client
     */
    createService(serviceName: string): Promise<Service>;
    /**
     * @deprecated Please use [[Client.deserializeServiceAsync]].
     * Deserializes the buffer into a [[Service]].
     *
     * @param {Buffer} data The buffer to deserialize.
     * @returns {Service}
     * @memberof Client
     */
    deserializeService(data: Buffer): Service;
    /**
     * Deserializes the buffer into a [[Service]].
     *
     * @param {Buffer} data The buffer to deserialize.
     * @returns {Promise<Service>}
     * @memberof Client
     */
    deserializeServiceAsync(data: Buffer): Promise<Service>;
    /**
     * Retrieves information about the Cipherise server.
     * Note that the minimum Cipherise server version is 6.0.0.
     *
     * @returns {Promise<ServerInformation>}
     * @memberof Client
     */
    serverInformation(): Promise<ServerInformation>;
    getPayloadSize(): Promise<number>;
}
