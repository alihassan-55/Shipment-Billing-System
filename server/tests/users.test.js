import request from 'supertest';

import app from '../src/app.js';
import { resetDb, seedAdmin, closeDb } from './helpers/db.js';

describe('Users endpoints', () => {
  let adminToken;

  beforeAll(async () => {
    await resetDb();
    await seedAdmin({ email: 'admin@example.com', password: 'admin123' });
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'admin123' });
    adminToken = login.body.token;
  });

  afterAll(async () => {
    await closeDb();
  });

  test('admin can create a user', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Operator', email: 'op@example.com', password: 'pass123', role: 'operator' })
      .expect(201);
    expect(res.body.email).toBe('op@example.com');
  });

  test('non-admin is forbidden to create user', async () => {
    // login as operator
    await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Operator2', email: 'op2@example.com', password: 'pass123', role: 'operator' })
      .expect(201);

    const opLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'op2@example.com', password: 'pass123' })
      .expect(200);

    await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${opLogin.body.token}`)
      .send({ name: 'Someone', email: 'x@example.com', password: 'abc123', role: 'accountant' })
      .expect(403);
  });
});

