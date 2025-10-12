import { Router } from 'express';

import { requireAuth, requireRoles } from '../middleware/auth.js';
import { createUser, getMe } from '../controllers/userController.js';

const router = Router();

router.get('/me', requireAuth, getMe);
router.post('/', requireAuth, requireRoles('admin'), createUser);

export default router;


