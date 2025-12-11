import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { createDietPlan, getDietHistory, swapDietMeal } from '../controllers/dietController.js';

const router = express.Router();

router.use(verifyToken);
router.post('/generate', createDietPlan);
router.get('/history', getDietHistory);
router.post('/swap-meal', swapDietMeal);

export default router;
