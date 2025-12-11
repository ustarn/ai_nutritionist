const mongoose = require("mongoose");

const foodLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  foodName: String,
  mealType: {
    type: String,
    enum: ["breakfast", "lunch", "dinner", "snack"],
  },
  calories: Number,
  protein: Number,
  fat: Number,
  carbs: Number,
  portion: Number,
  loggedAt: {
    type: Date,
    default: Date.now,
  },
});

// 为按用户和时间范围查询创建索引，加速 /api/nutrition/today 等接口
foodLogSchema.index({ userId: 1, loggedAt: -1 });

module.exports = mongoose.model("FoodLog", foodLogSchema);
