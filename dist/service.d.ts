/// <reference types="node" />
import { AuthenticationLevel } from "./authentication";
import { Device } from "./device";
import { Enrolment } from "./enrolment";
import { PushAuth } from "./push-authentication";
import { WaveAuth } from "./wave-authentication";
/**
 * [[Service]] represents a service provider on the Cipherise server.
 *
 * @export
 * @class Service
 */
export declare class Service {
    readonly id: string;
    private readonly client;
    private readonly webClient;
    private readonly key;
    private sessionId;
    private readonly baseLogger;
    private readonly logger;
    /**
     * Revokes this service, so that it cannot be used for any further operations.
     * To reactivate this service, re-enrol it.
     *
     * @returns {Promise<boolean>}
     * @memberof Service
     */
    revoke(): Promise<boolean>;
    /**
     * Returns a list of devices associated with the given user.
     * Will return an empty list if the user has not enrolled.
     *
     * @param {string} username The username to find devices for.
     * @returns {Promise<Device[]>}
     * @memberof Service
     */
    getUserDevices(username: string): Promise<Device[]>;
    /**
     * Returns whether or not the given user has enrolled to this service.
     *
     * @param {string} username The username to check enrolment for.
     * @returns {Promise<boolean>}
     * @memberof Service
     */
    userEnrolled(username: string): Promise<boolean>;
    /**
     * Revokes a user from the service.
     *
     * @param {string} username The username to revoke.
     * @param {Device[]} devices The devices to revoke. Optional.
     * @returns {Promise<void>}
     * @memberof Service
     */
    revokeUser(username: string, devices?: Device[]): Promise<void>;
    /**
     * Starts a Cipherise enrolment for the given user.
     *
     * @param {string} username The username to enrol.
     * @returns {Promise<Enrolment>}
     * @memberof Service
     */
    enrolUser(username: string): Promise<Enrolment>;
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
    PushAuth(username: string, device: Device, authenticationMessage: string, brandingMessage: string, notificationMessage: string, authLevel: AuthenticationLevel): Promise<PushAuth>;
    /**
     * Starts a WaveAuth.
     *
     * @param {string} authenticationMessage The message to display at the top of the authentication screen.
     * @param {string} brandingMessage The message to display at the bottom of the authentication screen.
     * @param {AuthenticationLevel} authLevel The authentication level to use.
     * @returns {Promise<WaveAuth>}
     * @memberof Service
     */
    WaveAuth(authenticationMessage: string, brandingMessage: string, authLevel: AuthenticationLevel): Promise<WaveAuth>;
    /**
     * Serializes this service to a buffer.
     *
     * @returns {Buffer}
     * @memberof Service
     */
    serialize(): Buffer;
    /**
     * Deserializes the buffer into an enrolment session.
     *
     * @param {Buffer} data The buffer to deserialize.
     * @returns {Enrolment}
     * @memberof Service
     */
    deserializeEnrolment(data: Buffer): Enrolment;
    /**
     * Deserializes the buffer into a PushAuth session.
     *
     * @param {Buffer} data The buffer to deserialize.
     * @returns {PushAuth}
     * @memberof Service
     */
    deserializePushAuth(data: Buffer): PushAuth;
    /**
     * Deserializes the buffer into a WaveAuth session.
     *
     * @param {Buffer} data The buffer to deserialize.
     * @returns {WaveAuth}
     * @memberof Service
     */
    deserializeWaveAuth(data: Buffer): WaveAuth;
    /**
     * Compares two services for equality.
     *
     * @param {Service} b The service to compare against.
     * @returns {boolean}
     * @memberof Service
     */
    equals(b: Service): boolean;
    /**
     * Refreshes the session associated with this service provider.
     *
     * @private
     * @memberof Service
     */
    private refreshSession;
}
