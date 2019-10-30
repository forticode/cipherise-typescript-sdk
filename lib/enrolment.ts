import * as msgpack from "msgpack5";
import * as NodeRSA from "node-rsa";

import { ILogger, PrefixLogger } from "./logger";
import { PayloadRequest, PayloadResponse } from "./payload";
import * as util from "./util";
import { SERIALIZED_VERSION } from "./version";

import { Service } from "./service";

/**
 * The result of an `Enrolment`.
 */
export class EnrolmentResult {
  /**
   * Whether or not the enrolment succeeded.
   */
  public success: boolean = true;

  /**
   * The result of payload actions. If no payload actions were specified,
   * this may not be present.
   */
  public payload?: PayloadResponse;
}

/**
 * [[Enrolment]] tracks an on-going user enrolment.
 *
 * @export
 * @class Enrolment
 */
export class Enrolment {
  /**
   * @hidden
   * @internal
   *
   * @static
   * @memberof Enrolment
   */
  public static readonly Header = "CiphEnrl";

  private readonly logger: ILogger;

  /**
   * @hidden
   * @internal
   *
   * Creates an instance of Enrolment. This should not be directly used;
   * please use [[Service.enrolUser]].
   * @param {Service} service The service this enrolment session originated from.
   * @param {ILogger} baseLogger The base logger instance.
   * @param {string} logId The log identifier for this enrolment.
   * @param {string} WaveCodeUrl The URL of the WaveCode to display for this enrolment.
   * @param {string} directEnrolURL Direct Enrolment is used in the sceneratio where the user is 
   * trying to enrol themselves, on the same device where the Cipherise App is installed.  In this
   * scenario the user can't scan the Wave image. To overcome this a button (either as a HTML 
   * button or native OS) should be displayed to the user, that when clicked, browses to the URL, 
   * allowing switching to and from the Cipherise App. 
   * 
   * NOTE! To switch to the Cipherise App the URL must be prepended with 
   * `cipherise://?directEnrolURL=`
   * @param {string} statusUrl The URL for the short-poll status of the enrolment, so that a client can query it.
   * @param {string} validateUrl The URL for blocking validation of the response.
   * @param {string} username The username of the enrolling user.
   * @param {Map<number, NodeRSA>} publicKeys The public keys of the device, if available.
   * @param {string} deviceId The device identifier, if available.
   * @param {string} confirmationUrl The confirmation URL, if available.
   * @memberof Enrolment
   */
  constructor(
    private readonly service: Service,
    private readonly baseLogger: ILogger,
    public readonly logId: string,
    public readonly WaveCodeUrl: string,
    public readonly directEnrolUrl: string,
    public readonly statusUrl: string,
    private readonly validateUrl: string,
    public readonly username: string,
    private publicKeys: Map<number, NodeRSA> = new Map(),
    public deviceId: string = "",
    private confirmationUrl: string = ""
  ) {
    this.logger = new PrefixLogger(this.logId, baseLogger);
  }

  /**
   * Retrieves the current state of the enrolment session.
   *
   * @returns {Promise<EnrolmentState>}
   * @memberof Enrolment
   */
  public async getState(): Promise<EnrolmentState> {
    const data = await this.service.getUrl(this.statusUrl);
    switch (data.QREnrolStatus as string) {
      case "initialised":
        return EnrolmentState.Initialised;
      case "scanned":
        return EnrolmentState.Scanned;
      case "validated":
        return EnrolmentState.Validated;
      case "confirm":
        return EnrolmentState.Confirmed;
      case "failed":
        return EnrolmentState.Failed;
      default:
        return EnrolmentState.Unknown;
    }
  }

  /**
   * Waits for the user to scan the WaveCode, then returns an URL of an identicon to display.
   *
   * @returns {Promise<string>}
   * @memberof Enrolment
   */
  public async validate(): Promise<string> {
    this.logger.debug(`Waiting for validation response`);
    try {
      const data = await this.service.getUrl(this.validateUrl);
      if (data.failReason) {
        throw new Error(data.failReason as string);
      }

      this.logger.verbose(
        `Retrieved identicon URL: ${data.identiconURL}`,
        data
      );
      this.publicKeys = util.objectToPublicKeyMap(data.publicKeys);

      const deviceDetails: any = {
        id: data.deviceId,
        keys: data.publicKeys
      };

      this.logger.verbose(
        `Retrieved device details: ${JSON.stringify(deviceDetails)}`,
        data
      );

      this.deviceId = data.deviceId;
      this.confirmationUrl = data.confirmationURL;

      return data.identiconURL;
    } catch (err) {
      this.logger.error(`Failed to retrieve validation response, error:`, err);
      throw err;
    }
  }

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
  public async confirm(
    success: boolean,
    payload?: PayloadRequest
  ): Promise<EnrolmentResult> {
    if (!this.confirmationUrl) {
      this.logger.warn(`Finish was called without a valid confirmation URL`);
      throw new Error("Expected confirmation URL. Has `validate` been called?");
    }

    const signatures: any = {};
    for (const [level, publicKey] of this.publicKeys.entries()) {
      signatures[level.toString()] = this.service
        .calculateSignature(this.username, this.deviceId, publicKey, level)
        .toString("hex");
    }

    const request = {
      confirm: success ? "confirm" : "reject",
      payload: undefined as any,
      signatures,
    };

    // If a payload has been supplied, include it as part of the request.
    if (
      success &&
      payload !== undefined &&
      Object.keys(payload.set).length > 0
    ) {
      const payloadRequest = { set: payload.set };
      request.payload = await this.service.encryptPayloadData(
        this.publicKeys.get(1)!,
        payloadRequest
      );
    }

    // Send our request.
    this.logger.debug(`Enrolling with request: \`${JSON.stringify(request)}\``);
    const response = await this.service.postUrl(this.confirmationUrl, request);
    this.logger.verbose(
      `Finished enrolment, response: ${JSON.stringify(response)}`
    );

    // If a payload has been supplied, verify that it was successfully saved
    // on the app's side.
    let payloadResponse: PayloadResponse | undefined;
    if (payload !== undefined && Object.keys(payload.set).length > 0) {
      const payloadResponseJson = this.service.decryptPayloadJson(
        this.publicKeys.get(1)!,
        response.payload
      );
      success = success && payloadResponseJson.setResponse;

      const payloadVerifyUrl = response["payloadVerifyURL"];
      if (payloadVerifyUrl) {
        await this.service.postUrl(payloadVerifyUrl, { verified: success });
      }

      payloadResponse = new PayloadResponse();
      payloadResponse.set = payloadResponseJson.setResponse;
    }

    const result = new EnrolmentResult();
    result.success = success;
    result.payload = payloadResponse;
    return result;
  }

  /**
   * Serializes this enrolment session to a buffer.
   *
   * @returns {Buffer}
   * @memberof Enrolment
   */
  public serialize(): Buffer {
    const encoded = msgpack().encode([
      Enrolment.Header,
      SERIALIZED_VERSION,
      this.logId,
      this.WaveCodeUrl,
      this.directEnrolUrl,
      this.statusUrl,
      this.validateUrl,
      this.username,
      this.confirmationUrl,
      this.deviceId,
      util.publicKeyMapToObject(this.publicKeys)
    ]);
    return encoded.slice();
  }

  /**
   * Compares two enrolments for equality.
   *
   * @param {Enrolment} b The enrolment to compare against.
   * @returns {boolean}
   * @memberof Enrolment
   */
  public equals(b: Enrolment): boolean {
    const pkA = JSON.stringify(util.publicKeyMapToObject(this.publicKeys));
    const pkB = JSON.stringify(util.publicKeyMapToObject(b.publicKeys));

    return (
      this.service.equals(b.service) &&
      this.logId === b.logId &&
      this.WaveCodeUrl === b.WaveCodeUrl &&
      this.directEnrolUrl === b.directEnrolUrl &&
      this.statusUrl === b.statusUrl &&
      this.validateUrl === b.validateUrl &&
      this.username === b.username &&
      pkA === pkB &&
      this.deviceId === b.deviceId &&
      this.confirmationUrl === b.confirmationUrl
    );
  }
}

/**
 * [[EnrolmentState]] represents the status of an on-going user enrolment.
 *
 * @export
 * @enum {number}
 */
export enum EnrolmentState {
  /**
   * The enrolment has been started.
   */
  Initialised,
  /**
   * The enrolment WaveCode has been scanned.
   */
  Scanned,
  /**
   * The service provider has received information about the device.
   */
  Validated,
  /**
   * The service provider has confirmed whether or not the enrolment has succeeded.
   */
  Confirmed,
  /**
   * The enrolment has failed.
   */
  Failed,
  /**
   * Unknown state. Should never occur.
   */
  Unknown
}
