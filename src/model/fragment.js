const { randomUUID } = require('crypto');
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

  // Get all fragments for a user
  static async byUser(ownerId, expand = false) {
    const fragments = await listFragments(ownerId, expand);

    if (!expand) return fragments;

    // Convert plain objects or strings into Fragment instances
    return fragments.map((f) => {
      if (f instanceof Fragment) return f;
      const data = typeof f === 'string' ? JSON.parse(f) : f;
      return new Fragment(data);
    });
  }

  // Get fragment by ID
  static async byId(ownerId, id) {
    const fragmentData = await readFragment(ownerId, id);
    if (!fragmentData) throw new Error('Fragment not found');
    return new Fragment(fragmentData);
  }

  // Delete a fragment
  static async delete(ownerId, id) {
    return deleteFragment(ownerId, id);
  }

  // Save metadata
  async save() {
    this.updated = new Date().toISOString();
    await writeFragment(this);
  }

  // Get data buffer
  async getData() {
    return readFragmentData(this.ownerId, this.id);
  }

  // Set data buffer
  async setData(data) {
    if (!Buffer.isBuffer(data)) throw new Error('Data must be a Buffer');
    this.size = data.length;
    this.updated = new Date().toISOString();
    await writeFragmentData(this.ownerId, this.id, data);
    await this.save();
  }

  // Get mime type (without charset)
  get mimeType() {
    const { type } = contentType.parse(this.type);
    return type;
  }

  // Check if text/*
  get isText() {
    return this.mimeType.startsWith('text/');
  }

  // Supported formats
  get formats() {
    return ['text/plain'];
  }

  // Check supported type
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
