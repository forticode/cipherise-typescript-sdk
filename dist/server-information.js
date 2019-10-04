"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const version_1 = require("./version");
/**
 * [[ServerInformation]] encapsulates information returned by the Cipherise server. This should
 * only be created internally by the SDK on the call to [[Client.serverInformation]]
 */
class ServerInformation {
    /**
     * Creates an instance of ServerInformation. This should only be called internally by the SDK.
     * @param {string} serverVersion The version of the Cipherise server.
     * @param {string} buildVersion The build version of the Cipherise server.
     * @param {string} appMinVersion The minimum supported Cipherise application version for this server.
     */
    constructor(serverVersion, buildVersion, appMinVersion, maxPayloadSize) {
        this.maxPayloadSize = maxPayloadSize;
        this.serverVersion = version_1.Version.fromString(serverVersion);
        this.buildVersion = parseInt(buildVersion, 10);
        this.appMinVersion = version_1.Version.fromString(appMinVersion);
    }
}
exports.ServerInformation = ServerInformation;
//# sourceMappingURL=server-information.js.map