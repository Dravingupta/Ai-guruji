import User from '../models/User.js';

export const verifyUser = async (req, res) => {
    try {
        // Check if user profile exists
        const user = await User.findOne({ uid: req.user.uid });
        res.json({
            uid: req.user.uid,
            email: req.user.email,
            hasProfile: !!user
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
