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
export class PayloadRequest {
  /**
   * An array of identifiers for data to retrieve from the device.
   */
  public get: string[] = [];
  /**
   * A dictionary of (identifier, data) to store on the device.
   */
  public set: { [key: string]: string } = {};
}

/**
 * `PayloadRequestBuilder` is a helper class to ease construction of payload
 * requests.
 *
 * @export
 * @class PayloadRequestBuilder
 */
export class PayloadRequestBuilder {
  /**
   * Build a new `PayloadRequest`. Builder methods can be called
   * on the `PayloadRequestBuilder` instance passed to the block.
   *
   * @static
   * @param {(b: PayloadRequestBuilder) => void} f Builder callback.
   */
  public static build(f: (b: PayloadRequestBuilder) => void): PayloadRequest {
    const builder = new PayloadRequestBuilder();
    f(builder);
    return builder.pr;
  }

  private readonly pr = new PayloadRequest();

  /**
   * Assigns `get` to the `PayloadRequest`.
   *
   * @param {string[]} get An array of identifiers for data to retrieve from the device.
   */
  public withGet(get: string[]): PayloadRequestBuilder {
    this.pr.get = get;
    return this;
  }

  /**
   * Assigns `set` to the `PayloadRequest`.
   *
   * @param {{[key: string]: string}} set A dictionary of (identifier, data) to store on the device.
   */
  public withSet(set: { [key: string]: string }): PayloadRequestBuilder {
    this.pr.set = set;
    return this;
  }
}

/**
 * `PayloadResponse` is returned when a payload action, or a set thereof,
 * has concluded.
 */
export class PayloadResponse {
  /**
   * A dictionary of (identifier, data) retrieved from the device. Empty if no data was requested.
   */
  public get: { [key: string]: string } = {};

  /**
   * Whether or not the set action was successful. False if a set action was not requested.
   */
  public set: boolean = false;
}
