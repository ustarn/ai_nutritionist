const mongoose = require('mongoose');

const healthProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    height: Number,
    weight: Number,
    gender: {
        type: String,
        enum: ['male', 'female', 'other']
    },
    age: Number,
    activityLevel: {
        type: String,
        enum: ['sedentary', 'light', 'moderate', 'heavy'],
        default: 'sedentary'
    },
    goal: {
        type: String,
        enum: ['lose_weight', 'gain_muscle', 'maintain'],
        default: 'maintain'
    },
    targetCalories: Number,
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('HealthProfile', healthProfileSchema);