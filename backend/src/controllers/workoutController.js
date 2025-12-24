import WorkoutPlan from '../models/WorkoutPlan.js';
import User from '../models/User.js';
import { generateWeeklyWorkoutPlan } from '../services/deepseekService.js';

export const createWorkoutPlan = async (req, res) => {
    try {
        const { startDate } = req.body;
        const user = await User.findOne({ uid: req.user.uid });

        const weekPlan = await generateWeeklyWorkoutPlan(user, startDate || new Date());

        const savedPlans = await Promise.all(weekPlan.map(day =>
            WorkoutPlan.create({
                userId: req.user.uid,
                date: new Date().toISOString().split('T')[0], 
                ...day
            })
        ));

        res.json(savedPlans);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getWorkoutHistory = async (req, res) => {
    try {
        const plans = await WorkoutPlan.find({ userId: req.user.uid }).sort({ createdAt: -1 });
        res.json(plans);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
