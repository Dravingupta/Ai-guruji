import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import dietRoutes from './routes/dietRoutes.js';
import workoutRoutes from './routes/workoutRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import { getHealth } from './controllers/healthController.js';

const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || '*', // Allow frontend access
    credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Support large payloads (e.g. images)

// Public readiness probe; no auth, personal data, or model request.
app.get('/api/health', getHealth);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/diet', dietRoutes);
app.use('/api/workout', workoutRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/progress', progressRoutes);

// Health check
app.get('/', (req, res) => {
    res.send('AI Fitness Coach API is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

export default app;
