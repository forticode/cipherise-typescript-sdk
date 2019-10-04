import * as msgpack from "msgpack5";
import * as NodeRSA from "node-rsa";

import { ILogger, PrefixLogger } from "./logger";
import { ServerInformation } from "./server-information";
import { Service } from "./service";
import { SERIALIZED_VERSION } from "./version";
import { WebClient } from "./web-client";

/**
 * [[Client]] connects to the Cipherise server to facilitate interaction with it.
 *
 * @export
 * @class Client
 */
export class Client {
  private baseLogger: ILogger;
  private logger: PrefixLogger;
  private webClient: WebClient;
  private payloadSize: number|undefined = undefined;

  /**
   * Creates a Client to connect to the given Cipherise server.
   * @param {string} url The URL of the Cipherise server to connect to.
   * @param {ILogger} logger The logger to output messages to.
   * @param {boolean} validateServerVersion Whether to validate the version of the server.
   * @memberof Client
   */
  constructor(
    url: string,
    logger?: ILogger,
    private validateServerVersion = true
  ) {
    if (!logger) {
      // tslint:disable:no-empty
      logger = {
        debug: (msg: string, ...meta: any[]) => {},
        error: (msg: string, ...meta: any[]) => {},
        info: (msg: string, ...meta: any[]) => {},
        verbose: (msg: string, ...meta: any[]) => {},
        warn: (msg: string, ...meta: any[]) => {},
      };
      // tslint:enable:no-empty
    }
    this.baseLogger = logger;

    // Ensure that the URL actually exists.
    url = url.trim();
    if (url.length === 0) {
      throw new Error("Expected non-empty URL!");
    }

    // Always add an end-slash.
    url += "/";

    // Remove all duplicate end-slashes until we have just one.
    let endIndex = url.length;
    while (url[endIndex - 1] === url[endIndex - 2]) {
      endIndex--;
    }
    url = url.substring(0, endIndex);

    this.logger = new PrefixLogger("Client", this.baseLogger);
    this.webClient = new WebClient(
      url,
      new PrefixLogger("CWC", this.baseLogger)
    );
  }

  /**
   * Creates a new service provider. The new [[Service]] is used to enrol and authenticate users.
   *
   * @param {string} serviceName The display name for this service provider.
   * @returns {Promise<Service>}
   * @memberof Client
   */
  public async createService(serviceName: string): Promise<Service> {
    if (this.validateServerVersion) {
      await this.serverInformation();
    }

    this.logger.info(`Creating new service "${serviceName}"`);
    const key = new NodeRSA();
    key.generateKeyPair(1024);

    try {
      const response = await this.webClient.postUri(
        "sp/create-service",
        {
          friendlyName: serviceName,
          publicKey: key.exportKey("pkcs8-public-pem")
        },
        undefined
      );

      this.logger.info(
        `Successfully created service (id: ${
          response.serviceId
        }, name: '${serviceName}')`
      );

      return new Service(
        response.serviceId as string,
        this,
        this.webClient,
        key,
        null,
        this.logger
      );
    } catch (err) {
      this.logger.error(
        `Failed to create new service "${serviceName}", error:`,
        err
      );
      throw err;
    }
  }

  /**
   * @deprecated Please use [[Client.deserializeServiceAsync]].
   * Deserializes the buffer into a [[Service]].
   *
   * @param {Buffer} data The buffer to deserialize.
   * @returns {Service}
   * @memberof Client
   */
  public deserializeService(data: Buffer): Service {
    const arr = msgpack().decode(data);
    if (!Array.isArray(arr)) {
      throw new Error(
        "Attempted to deserialize service, but buffer was invalid"
      );
    }

    if (arr.length === 0) {
      throw new Error("Attempted to deserialize service, but no components");
    }

    if (arr[0] !== Service.Header) {
      throw new Error("Attempted to deserialize service, but header not found");
    }

    if (arr.length === 5) {
      const id = arr[1] as string;
      const key = new NodeRSA();
      key.importKey(arr[2], "pkcs1-private-der");
      // arr[3] is the signature key, which is no longer used.
      const sessionId = arr[4] as string | null;

      return new Service(id, this, this.webClient, key, sessionId, this.logger);
    } else if (arr.length === 6) {
      if (arr[1] !== SERIALIZED_VERSION) {
        throw new Error(
          "Attempted to deserialize service, but header not found"
        );
      }

      const id = arr[2] as string;
      const key = new NodeRSA();
      key.importKey(arr[3], "pkcs1-private-der");
      // arr[3] is the signature key, which is no longer used.
      const sessionId = arr[5] as string | null;

      return new Service(id, this, this.webClient, key, sessionId, this.logger);
    } else {
      throw new Error(
        "Attempted to deserialize service, but incorrect number of components"
      );
    }
  }

  /**
   * Deserializes the buffer into a [[Service]].
   *
   * @param {Buffer} data The buffer to deserialize.
   * @returns {Promise<Service>}
   * @memberof Client
   */
  public async deserializeServiceAsync(data: Buffer): Promise<Service> {
    if (this.validateServerVersion) {
      await this.serverInformation();
    }

    return this.deserializeService(data);
  }

  /**
   * Retrieves information about the Cipherise server. 
   * Note that the minimum Cipherise server version is 6.0.0.
   *
   * @returns {Promise<ServerInformation>}
   * @memberof Client
   */
  public async serverInformation(): Promise<ServerInformation> {
    const response = await this.webClient.getUri("info", undefined);
    if ((response.productType as string) !== "CS") {
      throw new Error(
        `Expected Cipherise server, but product type is '${
          response.productType
        }'`
      );
    }

    if (parseInt((response.serverVersion as string).split(".")[0], 10) < 6) {
      throw new Error(
        "This version of the SDK does not support Cipherise servers older than version 6.x.x. " +
          "Please either upgrade your Cipherise server or downgrade your SDK, as appropriate."
      );
    }

    this.payloadSize = response.payloadSize as number || 4000;

    return new ServerInformation(
      response.serverVersion as string,
      response.buildVersion as string,
      response.appMinVersion as string,
      this.payloadSize
    );
  }

  public async getPayloadSize(): Promise<number> {
    if (this.payloadSize === undefined) {
      await this.serverInformation();
    }

    return this.payloadSize!;
  }
}
