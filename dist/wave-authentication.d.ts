/// <reference types="node" />
import { Authentication, AuthenticationResult, AuthenticationState } from "./authentication";
import { PayloadRequest } from "./payload";
/**
 * A WaveAuth presents a WaveCode to a user; the user can then scan the WaveCode with their device
 * to authenticate. The user is unknown until the authentication is complete.
 *
 * It is useful for logging in, as it provides a frictionless experience where the user can initiate and complete
 * the authentication entirely on their device.
 *
 * To start the process, use [[Service.WaveAuth]].
 * To deserialize an authentication, use [[Service.deserializeWaveAuth]].
 *
 * @export
 * @class WaveAuth
 */
export declare class WaveAuth extends Authentication {
    private readonly baseLogger;
    readonly initiatorUrl: string;
    readonly WaveCodeUrl: string;
    private readonly appChallengeUrl;
    private readonly logger;
    /**
     * Retrieves the current status of the authentication. Facilitates a non-blocking alternative
     * workflow for [[Service.WaveAuth]]. Prior to calling [[WaveAuth.authenticate]] which blocks
     * awaiting the user, this can be called to immediately return the current state of the
     * authentication.
     *
     * @returns {Promise<AuthenticationState>}
     * @memberof WaveAuth
     */
    getState(): Promise<AuthenticationState>;
    /**
     * Returns the result of the authentication. This is a blocking method. If non-blocking behaviour
     * is desired, short-poll [[WaveAuth.getState]] and call this method once the status is
     * [[AuthenticationState.Done]].
     *
     * @param {PayloadRequest} payload Optional payload request. For more information, consult the documentation
     *                                 for `PayloadRequest`.
     * @returns {Promise<AuthenticationResult>}
     * @memberof Authentication
     */
    authenticate(autoAccept?: boolean, payload?: PayloadRequest): Promise<AuthenticationResult>;
    /**
     * Serializes this authentication session to a buffer.
     *
     * @returns {Buffer}
     * @memberof WaveAuth
     */
    serialize(): Buffer;
    /**
     * Compares two authentications for equality.
     *
     * @param {WaveAuthentication} b The authentication to compare against.
     * @returns {boolean}
     * @memberof WaveAuth
     */
    equals(b: WaveAuth): boolean;
}
