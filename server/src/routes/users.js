import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getMe } from '../controllers/user.controller.js';

export const usersRouter = Router();

usersRouter.get('/me', authMiddleware(), getMe);
