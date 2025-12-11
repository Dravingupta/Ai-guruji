import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { verifyUser } from '../controllers/authController.js';

const router = express.Router();

router.post('/verify', verifyToken, verifyUser);

export default router;
