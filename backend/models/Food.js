//lpx


const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        index: true
    },
    nameEn: String,
    category: {
        type: String,
        enum: ['主食', '蔬菜', '水果', '肉类', '海鲜', '蛋奶', '豆类', '坚果', '饮品', '其他'],
        default: '其他'
    },
    // 每100克的营养数据
    calories: {
        type: Number,
        required: true,
        default: 0
    },
    protein: {
        type: Number,
        default: 0
    },
    fat: {
        type: Number,
        default: 0
    },
    carbs: {
        type: Number,
        default: 0
    },
    fiber: {
        type: Number,
        default: 0
    },
    description: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// 创建索引以便搜索
foodSchema.index({ name: 'text', nameEn: 'text' });

module.exports = mongoose.model('Food', foodSchema);


