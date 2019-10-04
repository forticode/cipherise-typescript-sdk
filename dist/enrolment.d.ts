/// <reference types="node" />
import { PayloadRequest, PayloadResponse } from "./payload";
/**
 * The result of an `Enrolment`.
 */
export declare class EnrolmentResult {
    /**
     * Whether or not the enrolment succeeded.
     */
    success: boolean;
    /**
     * The result of payload actions. If no payload actions were specified,
     * this may not be present.
     */
    payload?: PayloadResponse;
}
/**
 * [[Enrolment]] tracks an on-going user enrolment.
 *
 * @export
 * @class Enrolment
 */
export declare class Enrolment {
    private readonly service;
    private readonly baseLogger;
    readonly logId: string;
    readonly WaveCodeUrl: string;
    readonly directEnrolUrl: string;
    readonly statusUrl: string;
    private readonly validateUrl;
    readonly username: string;
    private publicKeys;
    deviceId: string;
    private confirmationUrl;
    private readonly logger;
    /**
     * Retrieves the current state of the enrolment session.
     *
     * @returns {Promise<EnrolmentState>}
     * @memberof Enrolment
     */
    getState(): Promise<EnrolmentState>;
    /**
     * Waits for the user to scan the WaveCode, then returns an URL of an identicon to display.
     *
     * @returns {Promise<string>}
     * @memberof Enrolment
     */
    validate(): Promise<string>;
    /**
     * Completes the enrolment with user-supplied success/failure.
     *
     * @param {boolean} success Whether or not the user approved the enrolment
     *                          (i.e. whether or not the identicon displayed
     *                          was equivalent to the identicon on the phone).
     * @param {PayloadRequest} payload Optional payload request. For more information, consult the documentation
     *                                 for `PayloadRequest`.
     * @returns {Promise<EnrolmentResult>}
     * @memberof Enrolment
     */
    confirm(success: boolean, payload?: PayloadRequest): Promise<EnrolmentResult>;
    /**
     * Serializes this enrolment session to a buffer.
     *
     * @returns {Buffer}
     * @memberof Enrolment
     */
    serialize(): Buffer;
    /**
     * Compares two enrolments for equality.
     *
     * @param {Enrolment} b The enrolment to compare against.
     * @returns {boolean}
     * @memberof Enrolment
     */
    equals(b: Enrolment): boolean;
}
/**
 * [[EnrolmentState]] represents the status of an on-going user enrolment.
 *
 * @export
 * @enum {number}
 */
export declare enum EnrolmentState {
    /**
     * The enrolment has been started.
     */
    Initialised = 0,
    /**
     * The enrolment WaveCode has been scanned.
     */
    Scanned = 1,
    /**
     * The service provider has received information about the device.
     */
    Validated = 2,
    /**
     * The service provider has confirmed whether or not the enrolment has succeeded.
     */
    Confirmed = 3,
    /**
     * The enrolment has failed.
     */
    Failed = 4,
    /**
     * Unknown state. Should never occur.
     */
    Unknown = 5
}
