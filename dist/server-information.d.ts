import { Version } from "./version";
/**
 * [[ServerInformation]] encapsulates information returned by the Cipherise server. This should
 * only be created internally by the SDK on the call to [[Client.serverInformation]]
 */
export declare class ServerInformation {
    readonly maxPayloadSize: number;
    /**
     * The version of the Cipherise server.
     */
    readonly serverVersion: Version;
    /**
     * The build version of the Cipherise server.
     */
    readonly buildVersion: number;
    /**
     * The minimum supported Cipherise application version for this server.
     */
    readonly appMinVersion: Version;
    /**
     * Creates an instance of ServerInformation. This should only be called internally by the SDK.
     * @param {string} serverVersion The version of the Cipherise server.
     * @param {string} buildVersion The build version of the Cipherise server.
     * @param {string} appMinVersion The minimum supported Cipherise application version for this server.
     */
    constructor(serverVersion: string, buildVersion: string, appMinVersion: string, maxPayloadSize: number);
}
