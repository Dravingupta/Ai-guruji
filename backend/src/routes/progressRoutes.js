import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { getProgress, saveCheckIn, saveProgressPreferences } from '../controllers/progressController.js';
const router = express.Router();
router.use(verifyToken);
router.get('/', getProgress);
router.put('/preferences', saveProgressPreferences);
router.put('/check-ins/:date', saveCheckIn);
export default router;
