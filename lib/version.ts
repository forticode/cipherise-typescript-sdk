import * as assert from "assert";

/**
 * @hidden
 * @internal
 */
export const SERIALIZED_VERSION = "6.0.0";

/**
 * [[Version]] describes a Major.Minor.Patch version for use in semantic versioning.
 *
 * @export
 * @class Version
 */
export class Version {
  /**
   * Parses a string and returns a [[Version]].
   *
   * @static
   * @param {string} version
   * @returns {Version}
   * @memberof Version
   */
  public static fromString(version: string): Version {
    return new Version(version.split(".").map(a => parseInt(a, 10)));
  }

  /**
   * Creates a [[Version]] from a three-digit array.
   * @param {number[]} digits
   * @memberof Version
   */
  constructor(public digits: number[]) {
    assert.ok(digits.length === 3, "Expected three digits for version");
  }
  /**
   * Compares two versions.
   * Returns -1 if the right version is newer than the left version.
   * Returns  0 if the right version is equal to   the left version.
   * Returns  1 if the right version is older than the left version.
   *
   * @param {Version} rhs
   * @returns {number}
   * @memberof Version
   */
  public compare(rhs: Version): number {
    for (const [index, leftElement] of this.digits.entries()) {
      const rightElement = rhs.digits[index];

      if (leftElement > rightElement) {
        return 1;
      } else if (rightElement > leftElement) {
        return -1;
      }
    }

    return 0;
  }

  /**
   * Returns whether this version is less than (i.e. older than) another version.
   *
   * @param {Version} rhs
   * @returns {boolean}
   * @memberof Version
   */
  public lessThan(rhs: Version): boolean {
    return this.compare(rhs) === -1;
  }

  /**
   * Returns whether this version is greater than (i.e. newer than) another version.
   *
   * @param {Version} rhs
   * @returns {boolean}
   * @memberof Version
   */
  public greaterThan(rhs: Version): boolean {
    return this.compare(rhs) === 1;
  }

  /**
   * Returns whether this version is equal to another version.
   *
   * @param {Version} rhs
   * @returns {boolean}
   * @memberof Version
   */
  public equalTo(rhs: Version): boolean {
    return this.compare(rhs) === 0;
  }

  /**
   * Returns whether this version is less than (i.e. older than) or equal to another version.
   *
   * @param {Version} rhs
   * @returns {boolean}
   * @memberof Version
   */
  public lessThanOrEqual(rhs: Version): boolean {
    return this.compare(rhs) !== 1;
  }

  /**
   * Returns a string representing the version.
   *
   * @returns {string}
   * @memberof Version
   */
  public toString(): string {
    return this.digits.join(".");
  }
}
