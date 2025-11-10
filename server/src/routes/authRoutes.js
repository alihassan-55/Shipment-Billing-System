import { Router } from 'express';
import { login, register, logout, getProfile, updateProfile } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Authentication routes
router.post('/login', login);
router.post('/register', register);
router.post('/logout', logout);

// Profile routes (protected)
router.get('/profile', requireAuth, getProfile);
router.put('/profile', requireAuth, updateProfile);

export default router;
