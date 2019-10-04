/// <reference types="node" />
import { Authentication, AuthenticationResult, AuthenticationState } from "./authentication";
import { PayloadRequest } from "./payload";
/**
 * A PushAuth is a Cipherise authentication that is sent to a particular user's device.
 * Upon receiving the authentication, the user must respond to it.
 *
 * It is useful for when the user and their device are already known, but are required to re-authenticate
 * (e.g. asserting their identity for a process of elevated permission).
 *
 * To start the process, use [[Service.PushAuth]].
 * To deserialize an authentication, use [[Service.deserializePushAuth]].
 *
 * @export
 * @class PushAuth
 */
export declare class PushAuth extends Authentication {
    private readonly baseLogger;
    private readonly username;
    private readonly device;
    private readonly logger;
    /**
     * Retrieve the current status of the authentication.
     *
     * @returns {Promise<AuthenticationStatus>}
     * @memberof PushAuth
     */
    getState(): Promise<AuthenticationState>;
    /**
     * Waits for the user to authenticate, and then returns
     * whether or not the authentication succeeded.
     * @param {PayloadRequest} payload Optional payload request. For more information, consult the documentation
     *                                 for `PayloadRequest`.
     * @returns {Promise<AuthenticationResult>}
     * @memberof PushAuth
     */
    authenticate(payload?: PayloadRequest): Promise<AuthenticationResult>;
    /**
     * Serializes this authentication session to a buffer.
     *
     * @returns {Buffer}
     * @memberof PushAuth
     */
    serialize(): Buffer;
    /**
     * Compares two authentications for equality.
     *
     * @param {PushAuth} b The authentication to compare against.
     * @returns {boolean}
     * @memberof PushAuth
     */
    equals(b: PushAuth): boolean;
}
