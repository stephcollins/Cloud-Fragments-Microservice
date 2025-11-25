// src/model/data/memory/memory-db.js
class MemoryDB {
  constructor() {
    this.db = new Map();
  }

  _validateKeys(ownerId, key, checkKey = false) {
    if (typeof ownerId !== 'string') throw new Error('Primary key must be a string');
    if (checkKey && typeof key !== 'string') throw new Error('Secondary key must be a string');
  }

  async get(ownerId, key) {
    this._validateKeys(ownerId, key, true);
    const ownerData = this.db.get(ownerId);
    if (!ownerData || !ownerData.has(key)) {
      return undefined;  // <-- return undefined, not throw
    }
    return ownerData.get(key);
  }

  async put(ownerId, key, value) {
    this._validateKeys(ownerId, key, true);
    if (!this.db.has(ownerId)) {
      this.db.set(ownerId, new Map());
    }
    this.db.get(ownerId).set(key, value);
  }

  async query(ownerId) {
    this._validateKeys(ownerId);
    const ownerData = this.db.get(ownerId);
    return ownerData ? Array.from(ownerData.values()) : [];
  }

  async del(ownerId, key) {
    this._validateKeys(ownerId, key, true);
    const ownerData = this.db.get(ownerId);
    if (!ownerData || !ownerData.has(key)) {
      throw new Error('Fragment not found');  // <-- must throw
    }
    ownerData.delete(key);
  }
}

module.exports = MemoryDB;
