/**
 * Represents an operation timing out (i.e. authentication was not responded to in time.)
 */
export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TimeoutError";
  }
}

/**
 * Represents a Cipherise session expiring. Should not occur in external use.
 */
export class SessionExpiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SessionExpiredError";
  }
}

/**
 * Thrown when the length limit for payload has been exceeded. If encountering this,
 * consider splitting your payload into multiple requests.
 */
export class PayloadDataLengthExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PayloadDataLengthExceededError";
  }
}