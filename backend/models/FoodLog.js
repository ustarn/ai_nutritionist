const mongoose = require('mongoose');

const foodLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    foodName: String,
    mealType: {
        type: String,
        enum: ['breakfast', 'lunch', 'dinner', 'snack']
    },
    calories: Number,
    protein: Number,
    fat: Number,
    carbs: Number,
    portion: Number,
    loggedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('FoodLog', foodLogSchema);