import bcrypt from 'bcrypt';

import { prisma } from '../db/client.js';

export async function createUser(req, res) {
  const { name, email, password, role } = req.body || {};
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'name, email, password, role required' });
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Email already in use' });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name, email, passwordHash, role } });
  return res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive });
}

export async function getMe(req, res) {
  // Backward compatibility: check both req.user.sub and req.user.id
  const userId = req.user.sub || req.user.id;
  
  if (!userId) {
    return res.status(401).json({ error: 'User ID not found in token' });
  }

  const user = await prisma.user.findUnique({ 
    where: { id: userId }, 
    select: { id: true, name: true, email: true, role: true, isActive: true } 
  });
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  return res.json(user);
}
