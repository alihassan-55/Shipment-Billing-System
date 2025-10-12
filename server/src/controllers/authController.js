import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { prisma } from '../db/client.js';

export async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ sub: user.id, role: user.role, email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: '1d' });
  return res.json({ token });
}

export async function logout(_req, res) {
  // Stateless JWT: client deletes token; optionally implement denylist.
  return res.json({ ok: true });
}
