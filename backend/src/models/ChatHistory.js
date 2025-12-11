import mongoose from 'mongoose';

const chatHistorySchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    messages: [{
        role: { type: String, enum: ['user', 'model'], required: true },
        text: { type: String, required: true },
        timestamp: { type: Number, default: () => Date.now() }
    }]
}, { timestamps: true });

export default mongoose.model('ChatHistory', chatHistorySchema);
