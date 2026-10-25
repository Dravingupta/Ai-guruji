import mongoose from 'mongoose';
const schema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    date: { type: String, required: true },
    status: { type: String, enum: ['measured', 'reused', 'skipped'], required: true },
    weightKg: { type: Number, min: 20, max: 500, default: null },
    sourceDate: { type: String, default: null },
    note: { type: String, maxlength: 280, default: '' }
}, { timestamps: true });
schema.index({ userId: 1, date: 1 }, { unique: true });
export default mongoose.model('WeightCheckIn', schema);
