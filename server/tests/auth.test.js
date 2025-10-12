import request from 'supertest';

import app from '../src/app.js';
import { resetDb, seedAdmin, closeDb } from './helpers/db.js';

describe('Auth & Me', () => {
  beforeAll(async () => {
    await resetDb();
    await seedAdmin({ email: 'admin@example.com', password: 'admin123' });
  });

  afterAll(async () => {
    await closeDb();
  });

  test('login returns JWT for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'admin123' })
      .expect(200);
    expect(res.body.token).toBeDefined();
  });

  test('me returns user profile with valid token', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'admin123' })
      .expect(200);
    const token = login.body.token;
    const me = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(me.body.email).toBe('admin@example.com');
  });
});

