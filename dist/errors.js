"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Represents an operation timing out (i.e. authentication was not responded to in time.)
 */
class TimeoutError extends Error {
    constructor(message) {
        super(message);
        this.name = "TimeoutError";
    }
}
exports.TimeoutError = TimeoutError;
/**
 * Represents a Cipherise session expiring. Should not occur in external use.
 */
class SessionExpiredError extends Error {
    constructor(message) {
        super(message);
        this.name = "SessionExpiredError";
    }
}
exports.SessionExpiredError = SessionExpiredError;
/**
 * Thrown when the length limit for payload has been exceeded. If encountering this,
 * consider splitting your payload into multiple requests.
 */
class PayloadDataLengthExceededError extends Error {
    constructor(message) {
        super(message);
        this.name = "PayloadDataLengthExceededError";
    }
}
exports.PayloadDataLengthExceededError = PayloadDataLengthExceededError;
//# sourceMappingURL=errors.js.map