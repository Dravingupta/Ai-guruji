import app from '../app.js'; // Just a placeholder if needed, but not importing app here
import DietPlan from '../models/DietPlan.js';
import User from '../models/User.js';
import { generateDietPlan, swapMeal } from '../services/deepseekService.js';

export const createDietPlan = async (req, res) => {
    try {
        const user = await User.findOne({ uid: req.user.uid });
        if (!user) return res.status(404).json({ error: 'User profile not found' });

        const plan = await generateDietPlan(user);

        console.log("Saving Diet Plan:", JSON.stringify(plan, null, 2)); // Debug log

        // Save to DB
        const dietPlan = await DietPlan.create({
            userId: req.user.uid,
            date: new Date().toISOString().split('T')[0],
            ...plan
        });

        res.json(dietPlan);
    } catch (error) {
        console.error("Error creating diet plan:", error); // Debug log
        res.status(500).json({ error: error.message });
    }
};

export const getDietHistory = async (req, res) => {
    try {
        const plans = await DietPlan.find({ userId: req.user.uid }).sort({ createdAt: -1 });
        res.json(plans);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const swapDietMeal = async (req, res) => {
    try {
        const { meal } = req.body;
        const user = await User.findOne({ uid: req.user.uid });
        const newMeal = await swapMeal(user, meal);
        res.json(newMeal);
    } catch (error) {
        console.error("Error swapping meal:", error); // Debug log
        res.status(500).json({ error: error.message });
    }
};
