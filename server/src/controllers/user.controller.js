import { User } from '../models/User.js';

export async function getMe(req, res) {
  // Backward compatibility: check both req.user.id and req.user.sub
  const userId = req.user?.id || req.user?.sub;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const user = await User.findByPk(userId, { attributes: ['id', 'name', 'email', 'role'] });
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({ user });
}
