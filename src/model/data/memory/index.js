// src/model/data/memory/index.js
const MemoryDB = require('./memory-db');

// Create two in-memory databases
const data = new MemoryDB();
const metadata = new MemoryDB();

// Write fragment metadata
function writeFragment(fragment) {
  const serialized = JSON.stringify(fragment);
  return metadata.put(fragment.ownerId, fragment.id, serialized);
}

// Read fragment metadata
async function readFragment(ownerId, id) {
  const serialized = await metadata.get(ownerId, id);
  if (!serialized) return null;
  try {
    return typeof serialized === 'string' ? JSON.parse(serialized) : serialized;
  } catch (e) {
    console.error('[ERROR] Failed to parse fragment:', e);
    return null;
  }
}

// Write fragment data
function writeFragmentData(ownerId, id, buffer) {
  return data.put(ownerId, id, buffer);
}

// Read fragment data
async function readFragmentData(ownerId, id) {
  return data.get(ownerId, id);
}

// List fragments for a user
async function listFragments(ownerId, expand = false) {
  const results = (await metadata.query(ownerId)) || [];
  if (expand) {
    return results.map(f => {
      try {
        return typeof f === 'string' ? JSON.parse(f) : f;
      } catch {
        return null;
      }
    }).filter(Boolean);
  }

  // Return just IDs
  return results.map(f => {
    try {
      const obj = typeof f === 'string' ? JSON.parse(f) : f;
      return obj.id;
    } catch {
      return null;
    }
  }).filter(Boolean);
}

// Delete fragment metadata + data
function deleteFragment(ownerId, id) {
  return Promise.all([
    metadata.del(ownerId, id),
    data.del(ownerId, id),
  ]);
}

module.exports = {
  listFragments,
  writeFragment,
  readFragment,
  writeFragmentData,
  readFragmentData,
  deleteFragment,
};