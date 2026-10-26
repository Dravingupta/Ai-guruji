import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { getProfile, createOrUpdateProfile, deleteProfile, ensureNutritionTargets } from '../controllers/userController.js';

const router = express.Router();

router.use(verifyToken);
router.get('/profile', getProfile);
router.post('/profile', createOrUpdateProfile);
router.post('/nutrition-targets', ensureNutritionTargets);
router.delete('/profile', deleteProfile);

export default router;
