import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { getProfile, createOrUpdateProfile, deleteProfile } from '../controllers/userController.js';

const router = express.Router();

router.use(verifyToken);
router.get('/profile', getProfile);
router.post('/profile', createOrUpdateProfile);
router.delete('/profile', deleteProfile);

export default router;
