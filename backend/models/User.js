// models/User.js - 用户模型(用户名登录版本)
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    // id 字段由 MongoDB 自动生成为 _id
    username: {
        type: String,
        required: true,
        unique: true,        // 用户名唯一
        trim: true,          // 去除首尾空格
        minlength: 3,        // 最少3个字符
        maxlength: 20        // 最多20个字符
    },
    password: {
        type: String,
        required: true,
        minlength: 6         // 密码最少6个字符
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);