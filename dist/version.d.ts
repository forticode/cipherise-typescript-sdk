/**
 * [[Version]] describes a Major.Minor.Patch version for use in semantic versioning.
 *
 * @export
 * @class Version
 */
export declare class Version {
    digits: number[];
    /**
     * Parses a string and returns a [[Version]].
     *
     * @static
     * @param {string} version
     * @returns {Version}
     * @memberof Version
     */
    static fromString(version: string): Version;
    /**
     * Creates a [[Version]] from a three-digit array.
     * @param {number[]} digits
     * @memberof Version
     */
    constructor(digits: number[]);
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
    compare(rhs: Version): number;
    /**
     * Returns whether this version is less than (i.e. older than) another version.
     *
     * @param {Version} rhs
     * @returns {boolean}
     * @memberof Version
     */
    lessThan(rhs: Version): boolean;
    /**
     * Returns whether this version is greater than (i.e. newer than) another version.
     *
     * @param {Version} rhs
     * @returns {boolean}
     * @memberof Version
     */
    greaterThan(rhs: Version): boolean;
    /**
     * Returns whether this version is equal to another version.
     *
     * @param {Version} rhs
     * @returns {boolean}
     * @memberof Version
     */
    equalTo(rhs: Version): boolean;
    /**
     * Returns whether this version is less than (i.e. older than) or equal to another version.
     *
     * @param {Version} rhs
     * @returns {boolean}
     * @memberof Version
     */
    lessThanOrEqual(rhs: Version): boolean;
    /**
     * Returns a string representing the version.
     *
     * @returns {string}
     * @memberof Version
     */
    toString(): string;
}
