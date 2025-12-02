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

  static createOwnerId(value) {
    return createHash('sha256').update(value).digest('hex');
  }

  static async byUser(user, expand = false) {
    const rawId =
      typeof user === 'string'
        ? user
        : user.id || user.email || user.username || user;

    const hashedId = Fragment.createOwnerId(rawId);

    let results = await listFragments(hashedId, expand);

    if (!results || results.length === 0) {
      results = await listFragments(rawId, expand);
    }

    if (!expand) return results || [];

    return results.map((meta) => new Fragment(meta));
  }

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

  static async delete(ownerId, id) {
    return deleteFragment(ownerId, id);
  }

  async save() {
    this.updated = new Date().toISOString();
    await writeFragment(this);
  }

  async getData() {
    return readFragmentData(this.ownerId, this.id);
  }

  async setData(data) {
    if (!Buffer.isBuffer(data)) throw new Error('Data must be a Buffer');
    this.size = data.length;
    this.updated = new Date().toISOString();
    await writeFragmentData(this.ownerId, this.id, data);
    await this.save();
  }

  get mimeType() {
    const { type } = contentType.parse(this.type);
    return type;
  }

  get isText() {
    return this.mimeType.startsWith('text/');
  }

  get formats() {
  return ['text/plain', 'text/markdown', 'application/json'];
}

  static isSupportedType(value) {
    // 💥 Updated to allow JSON + Markdown (needed for Lab 10)
    const supported = [
      'text/plain',
      'application/json',
      'text/markdown'
    ];
    try {
      const { type } = contentType.parse(value);
      return supported.includes(type);
    } catch {
      return false;
    }
  }
}

module.exports.Fragment = Fragment;