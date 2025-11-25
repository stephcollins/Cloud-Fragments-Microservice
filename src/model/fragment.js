// src/model/fragment.js
const { randomUUID, createHash } = require('crypto');
const contentType = require('content-type');
const {
  readFragment,
  writeFragment,
  readFragmentData,
  writeFragmentData,
  listFragments,
  deleteFragment,
} = require('./data');

class Fragment {
  constructor({ id, ownerId, created, updated, type, size = 0 }) {
    if (!ownerId) throw new Error('ownerId is required');
    if (!type) throw new Error('type is required');
    if (typeof size !== 'number' || size < 0)
      throw new Error('size must be a non-negative number');
    if (!Fragment.isSupportedType(type))
      throw new Error(`Unsupported type: ${type}`);

    this.id = id || randomUUID();
    this.ownerId = ownerId;
    this.created = created || new Date().toISOString();
    this.updated = updated || new Date().toISOString();
    this.type = type;
    this.size = size;
  }

  /**
   * 🔹 Utility: Hash user identifiers (consistent with auth)
   */
  static createOwnerId(value) {
    return createHash('sha256').update(value).digest('hex');
  }

  /**
   * 🔹 Get all fragments for a given user (list IDs or expanded objects)
   */
  static async byUser(user, expand = false) {
    const rawId =
      typeof user === 'string'
        ? user
        : user.id || user.email || user.username || user;

    const hashedId = Fragment.createOwnerId(rawId);

    // Try hashed storage first
    let results = await listFragments(hashedId, expand);

    // Fallback for un-hashed values (mainly for unit tests)
    if (!results || results.length === 0) {
      results = await listFragments(rawId, expand);
    }

    if (!expand) return results || [];

    return results.map((meta) => new Fragment(meta));
  }

  /**
   * 🔹 Get a single fragment by ID
   */
  static async byId(user, id) {
    const rawId =
      typeof user === 'string'
        ? user
        : user.email || user.id || user.username || user;

    const hashedId = Fragment.createOwnerId(rawId);

    let fragmentData = await readFragment(hashedId, id);

    if (!fragmentData) {
      fragmentData = await readFragment(rawId, id);
    }

    if (!fragmentData) {
      throw new Error('Fragment not found');
    }

    return new Fragment(fragmentData);
  }

  /**
   * 🔹 Delete a fragment
   */
  static async delete(ownerId, id) {
    return deleteFragment(ownerId, id);
  }

  /**
   * 🔹 Save or update fragment metadata
   */
  async save() {
    this.updated = new Date().toISOString();
    await writeFragment(this);
  }

  /**
   * 🔹 Retrieve the fragment's data
   */
  async getData() {
    return readFragmentData(this.ownerId, this.id);
  }

  /**
   * 🔹 Set or update fragment data
   */
  async setData(data) {
    if (!Buffer.isBuffer(data)) throw new Error('Data must be a Buffer');
    this.size = data.length;
    this.updated = new Date().toISOString();
    await writeFragmentData(this.ownerId, this.id, data);
    await this.save();
  }

  /**
   * 🔹 MIME type parsing
   */
  get mimeType() {
    const { type } = contentType.parse(this.type);
    return type;
  }

  get isText() {
    return this.mimeType.startsWith('text/');
  }

  get formats() {
    return ['text/plain'];
  }

  /**
   * 🔹 Type validation
   */
  static isSupportedType(value) {
    const supported = ['text/plain'];
    try {
      const { type } = contentType.parse(value);
      return supported.includes(type);
    } catch {
      return false;
    }
  }
}

module.exports.Fragment = Fragment;
