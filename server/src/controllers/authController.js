import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { prisma } from '../db/client.js';

export async function login(req, res) {
  const { email, password } = req.body || {};
  
  console.log('=== LOGIN DEBUG ===');
  console.log('Login attempt for email:', email);
  console.log('Request body:', req.body);
  
  if (!email || !password) {
    console.log('Missing email or password');
    return res.status(400).json({ error: 'Email and password required' });
  }
  
  console.log('Looking for user with email:', email);
  const user = await prisma.user.findUnique({ where: { email } });
  console.log('Found user:', user ? { id: user.id, email: user.email, isActive: user.isActive } : 'null');
  
  if (!user || !user.isActive) {
    console.log('User not found or inactive');
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  console.log('Comparing password...');
  const ok = await bcrypt.compare(password, user.passwordHash);
  console.log('Password match:', ok);
  
  if (!ok) {
    console.log('Password does not match');
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  console.log('Login successful, generating token...');
  console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
  const token = jwt.sign({ sub: user.id, role: user.role, email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: '1d' });
  console.log('Token generated successfully');
  
  return res.json({ token });
}

export async function logout(_req, res) {
  // Stateless JWT: client deletes token; optionally implement denylist.
  return res.json({ ok: true });
}
