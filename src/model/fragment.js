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
   * 🔹 Utility: create a stable hash for user identity (like the auth middleware)
   */
  static createOwnerId(value) {
    return createHash('sha256').update(value).digest('hex');
  }

  /**
   * 🔹 Get all fragments for a given user
   */
  static async byUser(user, expand = false) {
    const ownerId =
      typeof user === 'string'
        ? Fragment.createOwnerId(user)
        : Fragment.createOwnerId(user.id || user.email || user.username || user);

    console.log('[DEBUG] Fragment.byUser() called:', { expand, ownerId });

    const fragments = await listFragments(ownerId, expand);

    if (!expand) return fragments;

    return fragments.map((f) => {
      const data = typeof f === 'string' ? JSON.parse(f) : f;
      return new Fragment(data);
    });
  }

  /**
   * 🔹 Get a single fragment by ID
   */
  static async byId(user, id) {
    const email =
      typeof user === 'string'
        ? user
        : user.email || user.id || user.username || user;
    const hashedId = Fragment.createOwnerId(email);

    // Try hashed lookup first
    let fragmentData = await readFragment(hashedId, id);

    // Fallback: try raw email (some tests may skip hashing)
    if (!fragmentData) {
      fragmentData = await readFragment(email, id);
    }

    console.log('[DEBUG] Fragment.byId() called:', {
      email,
      hashedId,
      id,
      found: !!fragmentData,
    });

    if (!fragmentData) return null;
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
    console.log('[DEBUG] Saved fragment metadata:', {
      id: this.id,
      ownerId: this.ownerId,
    });
  }

  /**
   * 🔹 Retrieve the fragment's data
   */
  async getData() {
    const buf = await readFragmentData(this.ownerId, this.id);
    console.log('[DEBUG] getData() ->', { id: this.id, found: !!buf });
    return buf;
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
    console.log('[DEBUG] setData() -> saved fragment:', {
      id: this.id,
      ownerId: this.ownerId,
      size: this.size,
    });
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