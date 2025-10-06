const request = require('supertest');
const app = require('../../src/app');
const { Fragment } = require('../../src/model/fragment');
const hash = require('../../src/hash'); // ✅ added for hashed email lookup

describe('POST /v1/fragments', () => {
  const user = 'user1@email.com';
  const password = 'password1';

  test('unauthenticated requests are denied', async () => {
    const res = await request(app).post('/v1/fragments');
    expect(res.statusCode).toBe(401);
  });

  test('authenticated users can create a text/plain fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth(user, password)
      .set('Content-Type', 'text/plain')
      .send('hello world');

    expect(res.statusCode).toBe(201);
    expect(res.headers.location).toBeDefined();
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment).toBeDefined();
  });

  test('creating a fragment with unsupported type returns 415', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth(user, password)
      .set('Content-Type', 'application/msword')
      .send('invalid');

    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
  });

  test('fragment is saved correctly', async () => {
    const data = Buffer.from('hello world');
    const res = await request(app)
      .post('/v1/fragments')
      .auth(user, password)
      .set('Content-Type', 'text/plain')
      .send(data);

    expect(res.statusCode).toBe(201);

    const id = res.body.fragment.id;

    // ✅ Use hashed email here because fragments are stored under hashed user IDs
    const hashedUser = hash(user);
    const fragment = await Fragment.byId(hashedUser, id);

    expect(fragment.type).toBe('text/plain');
    expect(fragment.size).toBe(data.length);
  });
});