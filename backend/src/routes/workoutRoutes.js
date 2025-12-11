import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { createWorkoutPlan, getWorkoutHistory } from '../controllers/workoutController.js';

const router = express.Router();

router.use(verifyToken);
router.post('/generate', createWorkoutPlan);
router.get('/history', getWorkoutHistory);

export default router;
