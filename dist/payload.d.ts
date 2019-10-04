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
export declare class PayloadRequest {
    /**
     * An array of identifiers for data to retrieve from the device.
     */
    get: string[];
    /**
     * A dictionary of (identifier, data) to store on the device.
     */
    set: {
        [key: string]: string;
    };
}
/**
 * `PayloadRequestBuilder` is a helper class to ease construction of payload
 * requests.
 *
 * @export
 * @class PayloadRequestBuilder
 */
export declare class PayloadRequestBuilder {
    /**
     * Build a new `PayloadRequest`. Builder methods can be called
     * on the `PayloadRequestBuilder` instance passed to the block.
     *
     * @static
     * @param {(b: PayloadRequestBuilder) => void} f Builder callback.
     */
    static build(f: (b: PayloadRequestBuilder) => void): PayloadRequest;
    private readonly pr;
    /**
     * Assigns `get` to the `PayloadRequest`.
     *
     * @param {string[]} get An array of identifiers for data to retrieve from the device.
     */
    withGet(get: string[]): PayloadRequestBuilder;
    /**
     * Assigns `set` to the `PayloadRequest`.
     *
     * @param {{[key: string]: string}} set A dictionary of (identifier, data) to store on the device.
     */
    withSet(set: {
        [key: string]: string;
    }): PayloadRequestBuilder;
}
/**
 * `PayloadResponse` is returned when a payload action, or a set thereof,
 * has concluded.
 */
export declare class PayloadResponse {
    /**
     * A dictionary of (identifier, data) retrieved from the device. Empty if no data was requested.
     */
    get: {
        [key: string]: string;
    };
    /**
     * Whether or not the set action was successful. False if a set action was not requested.
     */
    set: boolean;
}
