import { Router } from 'express';
import multer from 'multer';
import { getCompanyProfile, updateCompanyProfile, uploadLogo } from '../controllers/companyController.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = Router();

// Multer setup for memory storage (for Supabase upload)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// GET /api/company - Public or accessible by logged in users (depending on preference)
// Let's make it accessible to anyone so Login page can show logo
router.get('/', getCompanyProfile);

// PUT /api/company - Admin only
router.put('/', requireAuth, requireRoles('ADMIN'), updateCompanyProfile);

// POST /api/company/logo - Admin only
router.post('/logo', requireAuth, requireRoles('ADMIN'), upload.single('logo'), uploadLogo);

export default router;
