"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const msgpack = require("msgpack5");
const util = require("./util");
/**
 * Device contains information about a particular device.
 *
 * @export
 * @class Device
 */
class Device {
    /**
     * @hidden
     * @internal
     * Creates an instance of Device.
     * @param {string} id The device's identifier.
     * @param {string} name The device's friendly name.
     * @param {Map<number, NodeRSA>} keys The device's keys.
     * @memberof Device
     */
    constructor(id, name, keys) {
        this.id = id;
        this.name = name;
        this.keys = keys;
    }
    /**
     * Deserializes the given buffer to a Device.
     *
     * @static
     * @param {Buffer} data The buffer to deserialize.
     * @returns {Device}
     * @memberof Device
     */
    static deserialize(data) {
        const arr = msgpack().decode(data);
        if (!Array.isArray(arr)) {
            throw new Error("Attempted to deserialize device, but buffer was invalid");
        }
        if (arr.length !== 4) {
            throw new Error("Attempted to deserialize device, but incorrect number of components");
        }
        if (arr[0] !== Device.Header) {
            throw new Error("Attempted to deserialize device, but header not found");
        }
        const id = arr[1];
        const name = arr[2];
        const keys = util.objectToPublicKeyMap(arr[3]);
        return new Device(id, name, keys);
    }
    /**
     * Serializes this device to a buffer.
     *
     * @returns {Buffer}
     * @memberof Device
     */
    serialize() {
        const encoded = msgpack().encode([
            Device.Header,
            this.id,
            this.name,
            util.publicKeyMapToObject(this.keys)
        ]);
        return encoded.slice();
    }
    /**
     * Compares two devices for equality.
     *
     * @param {Device} b The device to compare against.
     * @returns {boolean}
     * @memberof Device
     */
    equals(b) {
        const pkA = JSON.stringify(util.publicKeyMapToObject(this.keys));
        const pkB = JSON.stringify(util.publicKeyMapToObject(b.keys));
        return this.id === b.id && this.name === b.name && pkA === pkB;
    }
}
exports.Device = Device;
Device.Header = "CiphDvce";
//# sourceMappingURL=device.js.map