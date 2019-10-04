/// <reference types="node" />
import { Service } from './service';
import { Logger } from './logger';
/**
 * [[QRAuthentication]] tracks an on-going QR authentication.
 *
 * @export
 * @class QRAuthentication
 */
export declare class QRAuthentication {
    private readonly service;
    private readonly baseLogger;
    readonly logId: string;
    private readonly authChallenge;
    private readonly authLevel;
    readonly initiatorUrl: string;
    readonly qrCodeUrl: string;
    private readonly assertionUrl;
    readonly statusUrl: string;
    static readonly Header = "CiphUsrQ";
    private readonly logger;
    /**
     * Creates an instance of [[QRAuthentication]].
     * @param {Service} service The service this enrolment session originated from.
     * @param {Logger} baseLogger The base logger instance.
     * @param {string} logId The log identifier for this enrolment.
     * @param {Buffer} authChallenge The challenge posed to the device to solve.
     * @param {number} authLevel The authentication level for this authentication.
     * @param {string} initiatorUrl The URL of the direct authentication initiator to be clicked on by the client.
     * @param {string} qrCodeUrl The URL of the QR code to display for this authentication.
     * @param {string} assertionUrl The URL from which the authentication assertion can be retrieved.
     * @param {string} statusUrl The URL for the short-poll status of the authentication, so that a client can query it.
     * @memberof QRAuthentication
     */
    constructor(service: Service, baseLogger: Logger, logId: string, authChallenge: Buffer, authLevel: number, initiatorUrl: string, qrCodeUrl: string, assertionUrl: string, statusUrl: string);
    /**
     * Retrieve the current status of the QR authentication session.
     *
     * @returns {Promise<QRAuthenticationStatus>}
     * @memberof QRAuthentication
     */
    getStatus(): Promise<QRAuthenticationStatus>;
    /**
     * Waits for the user to authenticate, and then returns the result of the authentication.
     *
     * @returns {Promise<QRAuthenticationResult>}
     * @memberof QRAuthentication
     */
    authenticate(): Promise<QRAuthenticationResult>;
    /**
     * Serializes this authentication session to a buffer.
     *
     * @returns {Buffer}
     * @memberof QRAuthentication
     */
    serialize(): Buffer;
}
/**
 * QRAuthenticationStatus represents the status of an on-going QR authentication.
 *
 * @export
 * @enum {number}
 */
export declare enum QRAuthenticationStatus {
    /**
     * The QR authentication could not be found.
     */
    NotFound = 0,
    /**
     * The QR authentication has been started.
     */
    Initialised = 1,
    /**
     * The QR code has been scanned.
     */
    Scanned = 2,
    /**
     * The QR authentication has been finished.
     */
    Done = 3
}
export declare class QRAuthenticationResult {
    readonly success: boolean;
    readonly username: string;
    constructor(success: boolean, username: string);
}
