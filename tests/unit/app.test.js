const request = require('supertest');
const app = require('../../src/app');

describe('App 404 handler', () => {
  test('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/nonexistent-route');
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('not found');
    expect(res.body.error.code).toBe(404);
  });
});
