import { withLatestWeight } from '../services/profileContextService.js';
import ChatHistory from '../models/ChatHistory.js';
import User from '../models/User.js';
import { chatWithCoach } from '../services/deepseekService.js';

export const sendMessage = async (req, res) => {
    try {
        const { message, history, planContext } = req.body;
        const user = await User.findOne({ uid: req.user.uid });

        const responseText = await chatWithCoach(await withLatestWeight(user, req.user.uid), history || [], message, planContext);

      

        res.json({ text: responseText });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getChatHistory = async (req, res) => {
    try {
        const history = await ChatHistory.findOne({ userId: req.user.uid });
        res.json(history ? history.messages : []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
