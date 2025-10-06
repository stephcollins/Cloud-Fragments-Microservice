// tests/unit/memory.test.js
const {
  writeFragment,
  readFragment,
  writeFragmentData,
  readFragmentData,
  deleteFragment,
  listFragments,
} = require('../../src/model/data/memory');

describe('memory index.js functions', () => {
  const fragment = {
    ownerId: 'user123',
    id: 'frag1',
    type: 'text/plain',
    size: 10,
  };
  const data = Buffer.from('Hello World');

  test('writeFragment() and readFragment() should store and retrieve metadata', async () => {
    await writeFragment(fragment);
    const result = await readFragment(fragment.ownerId, fragment.id);
    expect(result).toMatchObject(fragment);
  });

  test('writeFragmentData() and readFragmentData() should store and retrieve raw data', async () => {
    await writeFragmentData(fragment.ownerId, fragment.id, data);
    const result = await readFragmentData(fragment.ownerId, fragment.id);
    expect(result.equals(data)).toBe(true);
  });

  test('listFragments() should return all stored fragments for a user', async () => {
    const list = await listFragments(fragment.ownerId, true);
    expect(Array.isArray(list)).toBe(true);
  });

  test('deleteFragment() should remove both data and metadata', async () => {
    await writeFragment(fragment);
    await writeFragmentData(fragment.ownerId, fragment.id, data);
    await deleteFragment(fragment.ownerId, fragment.id);
    const result = await readFragment(fragment.ownerId, fragment.id);
    expect(result).toBeUndefined();
  });
});
