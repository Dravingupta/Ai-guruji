import mongoose from 'mongoose';

const mealSlotSchema = new mongoose.Schema({ id: String, type: { type: String }, label: String, time: String }, { _id: false });

const mealSchema = new mongoose.Schema({
    id: String,
    name: String,
    type: { type: String },
    slotId: String,
    label: String,
    time: String,
    calories: Number,
    proteinGrams: Number,
    carbsGrams: Number,
    fatsGrams: Number,
    shortDescription: String,
    recipeDetail: {
        ingredients: [{
            name: String,
            quantity: String
        }],
        steps: [String],
        prepTime: String,
        cookTime: String
    },
    source: String
});

const dietPlanSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    date: { type: String, required: true },
    totalCalories: Number,
    mealSchedule: { type: [mealSlotSchema], default: undefined },
    nutritionProfileKey: String,
    nutritionTargets: {
        source: { type: String, enum: ['auto', 'custom'] },
        calories: Number,
        proteinGrams: Number,
        carbsGrams: Number,
        fatsGrams: Number
    },
    meals: [mealSchema],
    tips: [String]
}, { timestamps: true });

dietPlanSchema.index({ userId: 1, date: 1 });
export default mongoose.model('DietPlan', dietPlanSchema);
