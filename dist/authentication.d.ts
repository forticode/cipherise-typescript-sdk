/// <reference types="node" />
import { PayloadResponse } from "./payload";
import { Service } from "./service";
/**
 * The "level" of an authentication. The higher it is, the stronger the guarantee
 * of user identity; however, this will require a correspondingly higher level of
 * effort on the user's part.
 */
export declare enum AuthenticationLevel {
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
     * disabled, this will be elevated to�a OneTiCK challenge.
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
export declare enum Authenticated {
    /**
     * Indicates that the authentication was successful.
     */
    Success = 0,
    /**
     * Indicates that the authentication failed. This could happen due to an error in solving the
     * OneTiCK challenge, network issues or a mismatch in the validation of the users device.
     */
    Failure = 1,
    /**
     * Indicates that the Cipherise application user has reported the authentication, cancelling the
     * authentication and informing the Cipherise Server that followup action should be taken.
     */
    Report = 2,
    /**
     * Indicates that the authentication was cancelled by the Cipherise application user.
     */
    Cancel = 3
}
/**
 * The result of the authentication
 */
export declare class AuthenticationResult {
    /**
     * The outcome of the authentication.
     */
    readonly authenticated: Authenticated;
    /**
     * The username of the authenticating user.
     */
    readonly username: string;
    /**
     * The result of the payload actions required.
     */
    readonly payload: PayloadResponse;
    constructor(
    /**
     * The outcome of the authentication.
     */
    authenticated: Authenticated, 
    /**
     * The username of the authenticating user.
     */
    username: string, 
    /**
     * The result of the payload actions required.
     */
    payload: PayloadResponse);
}
/**
 * Represents lifecycle state of an authentication. Retrieved by calling
 * [[PushAuth.getState]] or [[WaveAuth.getState]]. The status can be checked to
 * determine whether it is safe to call [[PushAuth.authenticate]] or
 * [[WaveAuth.authenticate]] depending on the type of authentication that was created,
 * both of which will block if the authentication is not at the [[AuthenticationState.Done]] state.
 */
export declare enum AuthenticationState {
    /**
     * The authentication has been started, but no user action has occurred. The authentication
     * result request will block if called.
     */
    Initialised = 0,
    /**
     * The WaveCode has been scanned. Only valid with WaveAuth. The authentication
     * result request will block if called.
     */
    Scanned = 1,
    /**
     * The user still needs to solve the challenge issued by the Service Provider in the Cipherise
     * application. The authentication result request will block if called.
     */
    PendingAppSolution = 3,
    /**
     * The authentication has been completed and the result is available. The authentication result
     * should now be requested.
     */
    Done = 4,
    /**
     * The Cipherise Server does not know about this authentication. This typically occurs because
     * the authentication has already been completed or the authentication has expired. There is no
     * need to follow this up with the call to the authentication result.
     */
    NotFound = 5
}
/**
 * Common base-class for authentications.
 */
export declare abstract class Authentication {
    protected readonly service: Service;
    readonly logId: string;
    protected readonly authChallenge: Buffer;
    protected readonly authLevel: number;
    readonly statusUrl: string;
    protected readonly assertionUrl: string;
    protected verifyAuthUrl: string | undefined;
    /**
     * Should not be directly called. Overridden by [[PushAuth.getState]] and
     * [[WaveAuth.getState]].
     *
     * @returns {Promise<AuthenticationState>}
     * @memberof Authentication
     */
    getState(): Promise<AuthenticationState>;
    /**
     * @deprecated Please use [[getState]] instead.
     * Retrieve the current status of the authentication.
     *
     * @returns {Promise<AuthenticationState>}
     * @memberof Authentication
     */
    getStatus(): Promise<AuthenticationState>;
}
