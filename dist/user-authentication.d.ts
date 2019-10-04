/// <reference types="node" />
import { Device } from './device';
import { Service } from './service';
import { Logger } from './logger';
/**
 * [[UserAuthentication]] tracks an ongoing user authentication.
 *
 * @export
 * @class UserAuthentication
 */
export declare class UserAuthentication {
    private readonly service;
    private readonly baseLogger;
    readonly logId: string;
    private readonly userAuthChallenge;
    private readonly username;
    private readonly device;
    private readonly assertionUri;
    static readonly Header = "CiphUsrA";
    private readonly logger;
    /**
     * Creates an instance of UserAuthentication. This should not be directly used;
     * please use [[Service.userAuthenticate]].
     * @param {Service} service The service this authentication session originated from.
     * @param {Logger} baseLogger The base logger instance.
     * @param {string} logId The log identifier for this authentication.
     * @param {Buffer} userAuthChallenge The challenge posed to the device to solve.
     * @param {string} username The username of the authenticating user.
     * @param {Device} device The username of the device user.
     * @param {string} assertionUri The URL from which the authentication assertion can be retrieved.
     * @memberof UserAuthentication
     */
    constructor(service: Service, baseLogger: Logger, logId: string, userAuthChallenge: Buffer, username: string, device: Device, assertionUri: string);
    /**
     * Waits for the user to authenticate, and then returns
     * whether or not the authentication succeeded.
     *
     * @returns {Promise<boolean>}
     * @memberof UserAuthentication
     */
    authenticate(): Promise<boolean>;
    /**
     * Serializes this authentication session to a buffer.
     *
     * @returns {Buffer}
     * @memberof UserAuthentication
     */
    serialize(): Buffer;
}
