import bcrypt from 'bcrypt';
import { z } from 'zod';

import { User } from '../models/User.js';
import { signJwt } from '../utils/jwt.js';

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'employee', 'accountant']).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function register(req, res) {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid input', details: parse.error.flatten() });

  const { name, email, password, role } = parse.data;
  const exists = await User.findOne({ where: { email } });
  if (exists) return res.status(409).json({ error: 'Email already in use' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: passwordHash, role: role || 'employee' });

  const token = signJwt({ id: user.id, email: user.email, role: user.role, name: user.name });
  res.status(201).json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
}

export async function login(req, res) {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid input', details: parse.error.flatten() });

  const { email, password } = parse.data;
  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signJwt({ id: user.id, email: user.email, role: user.role, name: user.name });
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
}
