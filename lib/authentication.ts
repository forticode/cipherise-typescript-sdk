import { PayloadRequest, PayloadResponse } from "./payload";
import { Service } from "./service";

import * as NodeRSA from "node-rsa";

/**
 * The "level" of an authentication. The higher it is, the stronger the guarantee
 * of user identity; however, this will require a correspondingly higher level of
 * effort on the user's part.
 */
export enum AuthenticationLevel {
  /**
   * Cipherise challenge level 1 - The least intrusive authentication method. Only requires the 
   * Cipherise application to be open for authentication challenge to be solved.
   */
  Notification = 1,
  /**
   * Cipherise challenge level 2 - Interaction by user required in the Cipherise application to 
   * approve, cancel or report.
   */
  Approval = 2,
  /**
   * Cipherise challenge level 3 - Interaction by user required in the Cipherise application to 
   * apply a biometric input (finger print or face), or cancel or report. Note that if the device
   * the Cipherise application is running on does not have the necessary hardware or it is 
   * disabled, this will be elevated to a OneTiCK challenge.
   */
  Biometric = 3,
  /**
   * Cipherise challenge level 4 - Interaction by user required in the Cipherise application to 
   * solve the OneTiCK (One Time Cognitive Keyboard) challenge, or cancel or report.
   */
  OneTiCK = 4
}

/**
 * Represents the final authentication state upon conclusion of the authentication process.
 */
export enum Authenticated {
  /**
   * Indicates that the authentication was successful.
   */
  Success,
  /**
   * Indicates that the authentication failed. This could happen due to an error in solving the 
   * OneTiCK challenge, network issues or a mismatch in the validation of the users device.
   */
  Failure,
  /**
   * Indicates that the Cipherise application user has reported the authentication, cancelling the
   * authentication and informing the Cipherise Server that followup action should be taken.
   */
  Report,
  /**
   * Indicates that the authentication was cancelled by the Cipherise application user.
   */
  Cancel,
}

/**
 * The result of the authentication
 */
export class AuthenticationResult {

    constructor(
    /**
     * The outcome of the authentication.
     */
    public readonly authenticated: Authenticated,
    /**
     * The username of the authenticating user.
     */
    public readonly username: string,
    /**
     * The result of the payload actions required.
     */
    public readonly payload: PayloadResponse
  ) {    
  }
}

/**
 * Represents lifecycle state of an authentication. Retrieved by calling 
 * [[PushAuth.getState]] or [[WaveAuth.getState]]. The status can be checked to
 * determine whether it is safe to call [[PushAuth.authenticate]] or 
 * [[WaveAuth.authenticate]] depending on the type of authentication that was created, 
 * both of which will block if the authentication is not at the [[AuthenticationState.Done]] state.
 */
export enum AuthenticationState {
  /**
   * The authentication has been started, but no user action has occurred. The authentication 
   * result request will block if called.
   */
  Initialised,

  /**
   * The WaveCode has been scanned. Only valid with WaveAuth. The authentication
   * result request will block if called.
   */
  Scanned,

  /**
   * @hidden
   * @internal
   * The SP needs to solve the challenge presented by the app.
   */
  PendingSPSolution,

  /**
   * The user still needs to solve the challenge issued by the Service Provider in the Cipherise
   * application. The authentication result request will block if called.
   */
  PendingAppSolution,

  /**
   * The authentication has been completed and the result is available. The authentication result
   * should now be requested.
   */
  Done,

  /**
   * The Cipherise Server does not know about this authentication. This typically occurs because 
   * the authentication has already been completed or the authentication has expired. There is no
   * need to follow this up with the call to the authentication result.
   */
  NotFound
}

/**
 * Common base-class for authentications.
 */
export abstract class Authentication {
  /**
   * @hidden
   * @internal
   * Creates an instance of [[Authentication]].
   * @param {Service} service The service this enrolment session originated from.
   * @param {string} logId The log identifier for this enrolment.
   * @param {Buffer} authChallenge The challenge posed to the device to solve.
   * @param {number} authLevel The authentication level for this authentication.
   * @param {string} statusUrl The URL for the short-poll status of the authentication, so that a client can query it.
   * @param {string} assertionUrl The URL from which the authentication assertion can be retrieved.
   * @param {string} verifyAuthUrl The URL used to notify the app that an authentication has completed.
   * @memberof WaveAuth
   */
  constructor(
    protected readonly service: Service,
    public readonly logId: string,
    protected readonly authChallenge: Buffer,
    protected readonly authLevel: number,
    public readonly statusUrl: string,
    protected readonly assertionUrl: string,
    protected verifyAuthUrl: string | undefined
  ) {}

  /**
   * Should not be directly called. Overridden by [[PushAuth.getState]] and 
   * [[WaveAuth.getState]].
   *
   * @returns {Promise<AuthenticationState>}
   * @memberof Authentication
   */
  public async getState(): Promise<AuthenticationState> {
    const data = await this.service.getUrl(this.statusUrl);

    switch (data.statusText as string) {
      case "initialised":
        return AuthenticationState.Initialised;
      case "scanned":
        return AuthenticationState.Scanned;
      case "pending sp solution":
        return AuthenticationState.PendingSPSolution;
      case "pending app solution":
        return AuthenticationState.PendingAppSolution;
      case "done":
        return AuthenticationState.Done;
      case "not found":
        return AuthenticationState.NotFound;
      default:
        throw new Error(
          `Unexpected status ${data.statusText} for authentication (${
            this.logId
          })`
        );
    }
  }

  /**
   * @deprecated Please use [[getState]] instead.
   * Retrieve the current status of the authentication.
   *
   * @returns {Promise<AuthenticationState>}
   * @memberof Authentication
   */
  public async getStatus(): Promise<AuthenticationState> {
    return this.getState();
  }

  /**
   * @hidden
   * @internal
   * Used to retrieve the assertion. Implemented differently for each kind of authentication.
   *
   * @returns {Promise<any>}
   * @memberof Authentication
   */
  protected abstract async retrieveAssertion(): Promise<any>;

  /**
   * @hidden
   * @internal
   * Returns the result of the authentication. Blocking; if non-blocking behaviour is desired, short-poll [[Authentication.getState]]
   * and call this method once the status is [[AuthenticationState.Done]].
   *   
   * @param {PayloadRequest} payload Optional payload request. For more information, consult the documentation
   *                                 for `PayloadRequest`.
   * @returns {Promise<AuthenticationResult>}
   * @memberof Authentication
   */
  protected async authenticateInternal(    
    payload?: PayloadRequest
  ): Promise<AuthenticationResult> {
    const data = await this.retrieveAssertion();
    this.verifyAuthUrl = data["verifyAuthenticationURL"];

    const username = data["username"];
    let authenticated = false;

    const payloadResponse = new PayloadResponse();
    if (data["authenticated"] === "cancelled") {
      await this.accept(authenticated, data["authenticated"]);
      return new AuthenticationResult(
        Authenticated.Cancel,
        username,
        payloadResponse
      );
    }

    if (data["authenticated"] === "reported") {    
      await this.accept(authenticated, data["authenticated"]);
      return new AuthenticationResult(
        Authenticated.Report,
        username,
        payloadResponse
      );
    }

    if (data["authenticated"] !== "true") {
      await this.accept(authenticated);      
      return new AuthenticationResult(
        Authenticated.Failure,
        username,
        payloadResponse
      );
    }

    const publicKey = new NodeRSA(data["publicKey"]);
    const validSignature = this.service.verifySignature(
      Buffer.from(data["keySignature"], "hex"),
      data["username"] as string,
      data["deviceId"] as string,
      publicKey,
      data["publicKeyLevel"] as number
    );
    publicKey.setOptions({
      encryptionScheme: "pkcs1"
    });

    if (!validSignature) {
      await this.accept(false, `Mismatching key signatures for \`${username}\`; re-authentication may be necessary`);
      throw new Error(
        `Mismatching key signatures for \`${username}\`; re-authentication may be necessary`
      );
    }

    authenticated = publicKey.verify(
      this.authChallenge,
      Buffer.from(data["authenticationSolution"], "hex")
    );

    let payloadValid = true;
    if (payload !== undefined) {
      const payloadRequest = {
        payload: await this.service.encryptPayloadData(publicKey, {
          get: payload.get,
          set: payload.set
        })
      };
      const payloadResponseEncrypted = await this.service.postUrl(
        data["payloadURL"],
        payloadRequest
      );
      const payloadResponseJson = this.service.decryptPayloadJson(
        publicKey,
        payloadResponseEncrypted["payload"]
      );

      const payloadSetEmpty = Object.keys(payload.set).length === 0;
      if (!payloadSetEmpty) {
        payloadResponse.set = payloadResponseJson["setResponse"];
      }
      payloadResponse.get = {
        ...payloadResponse.get,
        ...payloadResponseJson["getResponse"]
      };

      payloadValid = payloadSetEmpty || payloadResponse.set;
    }

    await this.accept(authenticated && payloadValid);    

    const result = authenticated
      ? Authenticated.Success
      : Authenticated.Failure;
    return new AuthenticationResult(result, username, payloadResponse);
  }

  /**
   * @hidden
   * @internal
   * Notifies the app as to whether an authentication succeeded or failed.   
   *
   * Can be used to inform the app that the authentication has failed for other reasons (e.g.
   * failed authorization).
   *
   * @param {boolean} accepted Whether or not the authentication has been accepted.
   * @param {string} failReason The reason that the authentication failed.
   * @memberof Authentication
   */
  private async accept(accepted: boolean, failReason?: string) {
    if (this.verifyAuthUrl === undefined) {
      throw new Error(
        "Expected authentication verification URL. Has `authenticate` been called?"
      );
    }

    return this.service.postUrl(this.verifyAuthUrl, {
      failReason,
      verified: accepted,
    });
  }
}
