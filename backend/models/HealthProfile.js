const mongoose = require("mongoose");

const healthProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  height: {
    type: Number,
    min: 50, // cm，防止负数或不合理值
    max: 260,
  },
  weight: {
    type: Number,
    min: 10, // kg
    max: 400,
  },
  // 用户设定的目标体重（kg）
  targetWeight: {
    type: Number,
    min: 10,
    max: 400,
  },
  gender: {
    type: String,
    enum: ["male", "female", "other"],
  },
  age: {
    type: Number,
    min: 1,
    max: 120,
  },
  activityLevel: {
    type: String,
    enum: ["sedentary", "light", "moderate", "heavy"],
    default: "sedentary",
  },
  goal: {
    type: String,
    enum: ["lose_weight", "gain_muscle", "maintain"],
    default: "maintain",
  },
  targetCalories: Number,
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("HealthProfile", healthProfileSchema);
