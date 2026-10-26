import mongoose from 'mongoose';
import { getApps } from 'firebase-admin/app';

export const createHealthHandler = (ready = () => mongoose.connection.readyState === 1 && getApps().length > 0) => (req, res) => {
    res.set('Cache-Control', 'no-store');
    const available = ready();
    return res.status(available ? 200 : 503).json({ service: 'ai-guruji-api', status: available ? 'ready' : 'starting' });
};
export const getHealth = createHealthHandler();
