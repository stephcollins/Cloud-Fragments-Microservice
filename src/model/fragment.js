const { randomUUID, createHash } = require('crypto');
const contentType = require('content-type');
const sharp = require('sharp');
const yaml = require('js-yaml');
const marked = require('marked');

const {
  readFragment,
  writeFragment,
  readFragmentData,
  writeFragmentData,
  listFragments,
  deleteFragment,
} = require('./data');

// Supported media types for Assignment 3
const SUPPORTED_TYPES = [
  // Text formats
  'text/plain',
  'text/markdown',
  'text/html',
  'text/csv',

  // Data formats
  'application/json',
  'application/yaml',

  // Images
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/avif',
  'image/gif',
];

// Map extensions → MIME types
const EXT_TO_TYPE = {
  txt: 'text/plain',
  md: 'text/markdown',
  html: 'text/html',
  csv: 'text/csv',
  json: 'application/json',
  yaml: 'application/yaml',
  yml: 'application/yaml',

  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
};

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
    return SUPPORTED_TYPES;
  }

  static isSupportedType(value) {
    try {
      const { type } = contentType.parse(value);
      return SUPPORTED_TYPES.includes(type);
    } catch {
      return false;
    }
  }

  /**
   * Convert fragment data to another type based on extension
   */
  async convert(ext) {
    const targetType = EXT_TO_TYPE[ext];

    if (!targetType) {
      throw new Error(`Unsupported conversion extension: .${ext}`);
    }

    const data = await this.getData();
    const sourceType = this.mimeType;

    // If same type → no conversion
    if (sourceType === targetType) {
      return { type: targetType, data };
    }

    // ------------ TEXT CONVERSIONS ------------

    if (sourceType === 'text/plain') {
      return { type: 'text/plain', data };
    }

    if (sourceType === 'text/markdown') {
      if (targetType === 'text/plain') {
        return { type: 'text/plain', data: Buffer.from(data.toString(), 'utf-8') };
      }
      if (targetType === 'text/html') {
        return { type: 'text/html', data: Buffer.from(marked.parse(data.toString())) };
      }
    }

    if (sourceType === 'application/json') {
      const obj = JSON.parse(data.toString());

      if (targetType === 'text/plain') {
        return { type: 'text/plain', data: Buffer.from(JSON.stringify(obj)) };
      }
      if (targetType === 'application/yaml') {
        return { type: 'application/yaml', data: Buffer.from(yaml.dump(obj)) };
      }
    }

    if (sourceType === 'application/yaml') {
      const obj = yaml.load(data.toString());

      if (targetType === 'application/json') {
        return { type: 'application/json', data: Buffer.from(JSON.stringify(obj)) };
      }
      if (targetType === 'text/plain') {
        return { type: 'text/plain', data: Buffer.from(yaml.dump(obj)) };
      }
    }

    if (sourceType === 'text/csv') {
      const csvStr = data.toString();

      if (targetType === 'text/plain') {
        return { type: 'text/plain', data: Buffer.from(csvStr) };
      }
      if (targetType === 'application/json') {
        const rows = csvStr.trim().split('\n').map((r) => r.split(','));
        const headers = rows.shift();
        const json = rows.map((r) =>
          Object.fromEntries(r.map((value, i) => [headers[i], value]))
        );
        return { type: 'application/json', data: Buffer.from(JSON.stringify(json)) };
      }
    }

    // ------------ IMAGE CONVERSIONS (sharp) ------------

    if (sourceType.startsWith('image/')) {
      const sharpImg = sharp(data);

      switch (targetType) {
        case 'image/png':
          return { type: targetType, data: await sharpImg.png().toBuffer() };
        case 'image/jpeg':
          return { type: targetType, data: await sharpImg.jpeg().toBuffer() };
        case 'image/webp':
          return { type: targetType, data: await sharpImg.webp().toBuffer() };
        case 'image/gif':
          return { type: targetType, data: await sharpImg.gif().toBuffer() };
        case 'image/avif':
          return { type: targetType, data: await sharpImg.avif().toBuffer() };
      }
    }

    throw new Error(`Conversion from ${sourceType} to .${ext} is not supported`);
  }
}

module.exports.Fragment = Fragment;
