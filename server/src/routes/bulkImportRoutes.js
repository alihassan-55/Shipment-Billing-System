import { Router } from 'express';
import multer from 'multer';

import { requireAuth, requireRoles } from '../middleware/auth.js';
import { bulkImportShipments } from '../controllers/bulkImportController.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.use(requireAuth);

router.post('/shipments', requireRoles('admin', 'operator'), upload.single('file'), bulkImportShipments);

export default router;





