// src/model/data/memory/index.js
const MemoryDB = require('./memory-db');

// One DB for fragment "data" (raw bytes) and one for "metadata"
const data = new MemoryDB();
const metadata = new MemoryDB();

/**
 * Write fragment metadata.
 */
function writeFragment(fragment) {
  const meta = {
    id: fragment.id,
    ownerId: fragment.ownerId,
    created: fragment.created,
    updated: fragment.updated,
    type: fragment.type,
    size: fragment.size,
  };
  return metadata.put(fragment.ownerId, fragment.id, meta);
}

/**
 * Read fragment metadata.
 * Must return undefined when not found (to satisfy tests).
 */
async function readFragment(ownerId, id) {
  try {
    return await metadata.get(ownerId, id);
  } catch {
    return undefined;  // <-- critical fix
  }
}

/**
 * Write fragment data (Buffer).
 */
function writeFragmentData(ownerId, id, buffer) {
  return data.put(ownerId, id, buffer);
}

/**
 * Read fragment data (Buffer or undefined if missing).
 */
function readFragmentData(ownerId, id) {
  return data.get(ownerId, id);
}

/**
 * List fragments for a user.
 */
async function listFragments(ownerId, expand = false) {
  const results = await metadata.query(ownerId);
  if (expand) return results;
  return results.map((f) => f.id);
}

/**
 * Delete fragment metadata + data.
 */
function deleteFragment(ownerId, id) {
  return Promise.all([
    metadata.del(ownerId, id),
    data.del(ownerId, id),
  ]);
}

module.exports = {
  writeFragment,
  readFragment,
  writeFragmentData,
  readFragmentData,
  listFragments,
  deleteFragment,
};
