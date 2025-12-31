import { Router } from 'express';

import { requireAuth, requireRoles } from '../middleware/auth.js';
import { createUser, getMe, getAllUsers, updateUser, deleteUser } from '../controllers/userController.js';

const router = Router();

router.get('/me', requireAuth, getMe);
// Admin only routes
router.get('/', requireAuth, requireRoles('ADMIN'), getAllUsers);
router.post('/', requireAuth, requireRoles('ADMIN'), createUser);
router.put('/:id', requireAuth, requireRoles('ADMIN'), updateUser);
router.delete('/:id', requireAuth, requireRoles('ADMIN'), deleteUser);

export default router;


