import * as msgpack from "msgpack5";

import {
  Authentication,
  AuthenticationResult,
  AuthenticationState,
} from "./authentication";
import { Device } from "./device";
import { ILogger, PrefixLogger } from "./logger";
import { PayloadRequest } from "./payload";
import { Service } from "./service";
import { SERIALIZED_VERSION } from "./version";

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
export class PushAuth extends Authentication {
  /**
   * @hidden
   * @internal
   *
   * @static
   * @memberof PushAuth
   */
  public static readonly Header = "CiphUsrP";
  private readonly logger: ILogger;

  /**
   * @hidden
   * @internal
   *
   * Creates an instance of PushAuth. This should not be directly used;
   * please use [[Service.PushAuth]].
   * @param {Service} service The service this authentication session originated from.
   * @param {ILogger} baseLogger The base logger instance.
   * @param {string} logId The log identifier for this authentication.
   * @param {Buffer} authChallenge The challenge posed to the device to solve.
   * @param {number} authLevel The authentication level for this authentication.
   * @param {string} username The username of the authenticating user.
   * @param {Device} device The username of the device user.
   * @param {string} statusUrl The URL for the short-poll status of the authentication, so that a client can query it.
   * @param {string} assertionUrl The URL from which the authentication assertion can be retrieved.
   * @param {string} verifyAuthUrl The URL used to notify the app that an authentication has completed.
   * @memberof PushAuth
   */
  constructor(
    service: Service,
    private readonly baseLogger: ILogger,
    logId: string,
    authChallenge: Buffer,
    authLevel: number,
    private readonly username: string,
    private readonly device: Device,
    statusUrl: string,
    assertionUrl: string,
    verifyAuthUrl: string | undefined
  ) {
    super(
      service,
      logId,
      authChallenge,
      authLevel,
      statusUrl,
      assertionUrl,
      verifyAuthUrl
    );
    this.logger = new PrefixLogger(this.logId, baseLogger);
  }

  /**
   * Retrieve the current status of the authentication.
   *
   * @returns {Promise<AuthenticationStatus>}
   * @memberof PushAuth
   */
  public async getState(): Promise<AuthenticationState> {
    const state = await super.getState();
    return state === AuthenticationState.PendingSPSolution
      ? AuthenticationState.Initialised
      : state;
  }

  /**
   * Waits for the user to authenticate, and then returns
   * whether or not the authentication succeeded.
   * @param {PayloadRequest} payload Optional payload request. For more information, consult the documentation
   *                                 for `PayloadRequest`.   
   * @returns {Promise<AuthenticationResult>}
   * @memberof PushAuth
   */
  public async authenticate(
    payload?: PayloadRequest
  ): Promise<AuthenticationResult> {
    const result = await this.authenticateInternal(payload);
    return result;   
  }

  /**
   * Serializes this authentication session to a buffer.
   *
   * @returns {Buffer}
   * @memberof PushAuth
   */
  public serialize(): Buffer {
    const encoded = msgpack().encode([
      PushAuth.Header,
      SERIALIZED_VERSION,
      this.logId,
      this.authChallenge,
      this.authLevel,
      this.username,
      this.device.serialize(),
      this.statusUrl,
      this.assertionUrl,
      this.verifyAuthUrl === undefined ? null : this.verifyAuthUrl
    ]);
    return encoded.slice();
  }

  /**
   * Compares two authentications for equality.
   *
   * @param {PushAuth} b The authentication to compare against.
   * @returns {boolean}
   * @memberof PushAuth
   */
  public equals(b: PushAuth): boolean {
    return (
      this.service.equals(b.service) &&
      this.logId === b.logId &&
      this.authChallenge.equals(b.authChallenge) &&
      this.authLevel === b.authLevel &&
      this.username === b.username &&
      this.device.equals(b.device) &&
      this.statusUrl === b.statusUrl &&
      this.assertionUrl === b.assertionUrl &&
      this.verifyAuthUrl === b.verifyAuthUrl
    );
  }

  /**
   * @hidden
   * @internal
   * Retrieves the assertion from the server.
   *
   * @returns {Promise<any>}
   * @memberof PushAuth
   */
  protected async retrieveAssertion(): Promise<any> {
    return this.service.getUrl(this.assertionUrl);
  }
}
