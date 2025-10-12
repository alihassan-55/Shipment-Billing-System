import { execSync } from 'node:child_process';

beforeAll(() => {
  process.env.NODE_ENV = 'test';
  // Ensure DB is migrated
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  } catch {}
});

afterAll(async () => {
  // noop placeholder for future teardown
});

