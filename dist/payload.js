"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * During certain payload-enabled operations, the device can store or retrieve
 * data that has been provided by the Service Provider. This is the "payload"
 * functionality.
 *
 * The `PayloadRequest` class is used to request that the device conduct some
 * payload-relevant action. It is supplied as part of the aforementioned
 * payload-enabled operations.
 *
 * Not all actions are available during payload-enabled operations. As
 * an example, the `get` operation will not work during enrolment as there
 * is no data to retrieve.
 *
 * @class PayloadRequest
 */
class PayloadRequest {
    constructor() {
        /**
         * An array of identifiers for data to retrieve from the device.
         */
        this.get = [];
        /**
         * A dictionary of (identifier, data) to store on the device.
         */
        this.set = {};
    }
}
exports.PayloadRequest = PayloadRequest;
/**
 * `PayloadRequestBuilder` is a helper class to ease construction of payload
 * requests.
 *
 * @export
 * @class PayloadRequestBuilder
 */
class PayloadRequestBuilder {
    constructor() {
        this.pr = new PayloadRequest();
    }
    /**
     * Build a new `PayloadRequest`. Builder methods can be called
     * on the `PayloadRequestBuilder` instance passed to the block.
     *
     * @static
     * @param {(b: PayloadRequestBuilder) => void} f Builder callback.
     */
    static build(f) {
        const builder = new PayloadRequestBuilder();
        f(builder);
        return builder.pr;
    }
    /**
     * Assigns `get` to the `PayloadRequest`.
     *
     * @param {string[]} get An array of identifiers for data to retrieve from the device.
     */
    withGet(get) {
        this.pr.get = get;
        return this;
    }
    /**
     * Assigns `set` to the `PayloadRequest`.
     *
     * @param {{[key: string]: string}} set A dictionary of (identifier, data) to store on the device.
     */
    withSet(set) {
        this.pr.set = set;
        return this;
    }
}
exports.PayloadRequestBuilder = PayloadRequestBuilder;
/**
 * `PayloadResponse` is returned when a payload action, or a set thereof,
 * has concluded.
 */
class PayloadResponse {
    constructor() {
        /**
         * A dictionary of (identifier, data) retrieved from the device. Empty if no data was requested.
         */
        this.get = {};
        /**
         * Whether or not the set action was successful. False if a set action was not requested.
         */
        this.set = false;
    }
}
exports.PayloadResponse = PayloadResponse;
//# sourceMappingURL=payload.js.map