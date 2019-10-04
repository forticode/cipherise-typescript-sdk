import * as NodeRSA from "node-rsa";

/**
 * @hidden
 * @internal
 * Converts a ES6 map of (level, NodeRSA) to a serializable JS object.
 * Used for serialization and sending across the network.
 *
 * @export
 * @param {Map<number, NodeRSA>} publicKeys
 * @returns {*}
 */
export function publicKeyMapToObject(publicKeys: Map<number, NodeRSA>): any {
  const keys: any = {};

  for (const [level, key] of publicKeys) {
    keys[level] = key.exportKey("pkcs8-public-pem").toString();
  }

  return keys;
}
/**
 * @hidden
 * @internal
 * Converts a serializable JS object to a ES6 map of (level, NodeRSA).
 * Used for deserialization and receiving from the network.
 *
 * @export
 * @param {*} publicKeys
 * @returns {Map<number, NodeRSA>}
 */
export function objectToPublicKeyMap(publicKeys: any): Map<number, NodeRSA> {
  const keys = new Map<number, NodeRSA>();

  for (const level in publicKeys) {
    if (!publicKeys.hasOwnProperty(level)) {
      continue;
    }

    const publicKeyString = publicKeys[level];
    const levelNumber = Number(level);

    const publicKey = new NodeRSA();
    publicKey.importKey(publicKeyString, "pkcs8-public-pem");
    publicKey.setOptions({
      encryptionScheme: "pkcs1"
    });
    keys.set(levelNumber, publicKey);
  }

  return keys;
}
