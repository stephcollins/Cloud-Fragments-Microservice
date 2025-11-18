// src/model/data/memory/memory-db.js
/**
 * Simple in-memory key/value database that supports per-owner collections.
 */
class MemoryDB {
  constructor() {
    this.db = new Map();
  }

  // Save value for an owner + key
  put(ownerId, key, value) {
    if (!this.db.has(ownerId)) {
      this.db.set(ownerId, new Map());
    }
    this.db.get(ownerId).set(key, value);
    return Promise.resolve();
  }

  // Retrieve value for an owner + key
  get(ownerId, key) {
    const ownerData = this.db.get(ownerId);
    if (!ownerData) return Promise.resolve(null);
    return Promise.resolve(ownerData.get(key) || null);
  }

  // Retrieve all values for an owner
  async query(ownerId) {
    const ownerData = this.db.get(ownerId);
    if (!ownerData) return Promise.resolve([]);
    return Promise.resolve(Array.from(ownerData.values()));
  }

  // Delete one key for an owner
  del(ownerId, key) {
    const ownerData = this.db.get(ownerId);
    if (ownerData) ownerData.delete(key);
    return Promise.resolve();
  }
}

module.exports = MemoryDB;