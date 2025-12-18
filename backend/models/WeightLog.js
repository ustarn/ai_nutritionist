const mongoose = require("mongoose");

const weightLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  weight: {
    type: Number,
    required: true,
  },
  // 记录日期统一归一到当天 00:00，保证一天一条
  logDate: {
    type: Date,
    required: true,
  },
  note: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// 归一化日期，避免同一天重复
weightLogSchema.pre("validate", function (next) {
  const d = this.logDate ? new Date(this.logDate) : new Date();
  d.setHours(0, 0, 0, 0);
  this.logDate = d;
  next();
});

// 同一用户同一天只保留一条（后写覆盖）
weightLogSchema.index({ userId: 1, logDate: 1 }, { unique: true });

module.exports = mongoose.model("WeightLog", weightLogSchema);

