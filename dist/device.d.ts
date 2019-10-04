/// <reference types="node" />
import * as NodeRSA from "node-rsa";
/**
 * Device contains information about a particular device.
 *
 * @export
 * @class Device
 */
export declare class Device {
    readonly id: string;
    readonly name: string;
    readonly keys: Map<number, NodeRSA>;
    /**
     * Deserializes the given buffer to a Device.
     *
     * @static
     * @param {Buffer} data The buffer to deserialize.
     * @returns {Device}
     * @memberof Device
     */
    static deserialize(data: Buffer): Device;
    private static readonly Header;
    /**
     * Serializes this device to a buffer.
     *
     * @returns {Buffer}
     * @memberof Device
     */
    serialize(): Buffer;
    /**
     * Compares two devices for equality.
     *
     * @param {Device} b The device to compare against.
     * @returns {boolean}
     * @memberof Device
     */
    equals(b: Device): boolean;
}
