/**
 * Represents an operation timing out (i.e. authentication was not responded to in time.)
 */
export declare class TimeoutError extends Error {
    constructor(message: string);
}
/**
 * Represents a Cipherise session expiring. Should not occur in external use.
 */
export declare class SessionExpiredError extends Error {
    constructor(message: string);
}
/**
 * Thrown when the length limit for payload has been exceeded. If encountering this,
 * consider splitting your payload into multiple requests.
 */
export declare class PayloadDataLengthExceededError extends Error {
    constructor(message: string);
}
