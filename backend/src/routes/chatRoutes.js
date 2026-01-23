import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { sendMessage, getChatHistory } from '../controllers/chatController.js';

const router = express.Router();

router.use(verifyToken);
router.post('/message', sendMessage);
router.get('/history', getChatHistory);

export default router;
