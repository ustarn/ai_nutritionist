// 初始化食物库数据
const mongoose = require('mongoose');
require('dotenv').config();

const Food = require('./models/Food');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nutrition_db';

const sampleFoods = [
    // 主食
    { name: '白米饭', nameEn: 'White Rice', category: '主食', calories: 130, protein: 2.7, fat: 0.3, carbs: 28.2, fiber: 0.4 },
    { name: '面条', nameEn: 'Noodles', category: '主食', calories: 138, protein: 4.5, fat: 0.6, carbs: 28.0, fiber: 1.2 },
    { name: '全麦面包', nameEn: 'Whole Wheat Bread', category: '主食', calories: 247, protein: 13.0, fat: 4.2, carbs: 41.0, fiber: 7.0 },
    { name: '燕麦', nameEn: 'Oats', category: '主食', calories: 389, protein: 16.9, fat: 6.9, carbs: 66.3, fiber: 10.6 },
    
    // 蔬菜
    { name: '西兰花', nameEn: 'Broccoli', category: '蔬菜', calories: 34, protein: 2.8, fat: 0.4, carbs: 7.0, fiber: 2.6 },
    { name: '菠菜', nameEn: 'Spinach', category: '蔬菜', calories: 23, protein: 2.9, fat: 0.4, carbs: 3.6, fiber: 2.2 },
    { name: '胡萝卜', nameEn: 'Carrot', category: '蔬菜', calories: 41, protein: 0.9, fat: 0.2, carbs: 10.0, fiber: 2.8 },
    { name: '番茄', nameEn: 'Tomato', category: '蔬菜', calories: 18, protein: 0.9, fat: 0.2, carbs: 3.9, fiber: 1.2 },
    { name: '黄瓜', nameEn: 'Cucumber', category: '蔬菜', calories: 16, protein: 0.7, fat: 0.1, carbs: 4.0, fiber: 0.5 },
    
    // 水果
    { name: '苹果', nameEn: 'Apple', category: '水果', calories: 52, protein: 0.3, fat: 0.2, carbs: 14.0, fiber: 2.4 },
    { name: '香蕉', nameEn: 'Banana', category: '水果', calories: 89, protein: 1.1, fat: 0.3, carbs: 23.0, fiber: 2.6 },
    { name: '橙子', nameEn: 'Orange', category: '水果', calories: 47, protein: 0.9, fat: 0.1, carbs: 12.0, fiber: 2.4 },
    { name: '草莓', nameEn: 'Strawberry', category: '水果', calories: 32, protein: 0.7, fat: 0.3, carbs: 7.7, fiber: 2.0 },
    
    // 肉类
    { name: '鸡胸肉', nameEn: 'Chicken Breast', category: '肉类', calories: 165, protein: 31.0, fat: 3.6, carbs: 0, fiber: 0 },
    { name: '瘦牛肉', nameEn: 'Lean Beef', category: '肉类', calories: 250, protein: 26.0, fat: 17.0, carbs: 0, fiber: 0 },
    { name: '瘦猪肉', nameEn: 'Lean Pork', category: '肉类', calories: 242, protein: 27.3, fat: 14.0, carbs: 0, fiber: 0 },
    { name: '火鸡肉', nameEn: 'Turkey', category: '肉类', calories: 189, protein: 29.0, fat: 7.0, carbs: 0, fiber: 0 },
    
    // 海鲜
    { name: '三文鱼', nameEn: 'Salmon', category: '海鲜', calories: 208, protein: 20.0, fat: 13.0, carbs: 0, fiber: 0 },
    { name: '金枪鱼', nameEn: 'Tuna', category: '海鲜', calories: 144, protein: 30.0, fat: 1.0, carbs: 0, fiber: 0 },
    { name: '虾', nameEn: 'Shrimp', category: '海鲜', calories: 99, protein: 24.0, fat: 0.3, carbs: 0.2, fiber: 0 },
    { name: '鳕鱼', nameEn: 'Cod', category: '海鲜', calories: 82, protein: 18.0, fat: 0.7, carbs: 0, fiber: 0 },
    
    // 蛋奶
    { name: '鸡蛋', nameEn: 'Egg', category: '蛋奶', calories: 155, protein: 13.0, fat: 11.0, carbs: 1.1, fiber: 0 },
    { name: '牛奶', nameEn: 'Milk', category: '蛋奶', calories: 42, protein: 3.4, fat: 1.0, carbs: 5.0, fiber: 0 },
    { name: '酸奶', nameEn: 'Yogurt', category: '蛋奶', calories: 59, protein: 10.0, fat: 0.4, carbs: 3.6, fiber: 0 },
    { name: '奶酪', nameEn: 'Cheese', category: '蛋奶', calories: 402, protein: 25.0, fat: 33.0, carbs: 1.3, fiber: 0 },
    
    // 豆类
    { name: '豆腐', nameEn: 'Tofu', category: '豆类', calories: 76, protein: 8.1, fat: 4.8, carbs: 1.9, fiber: 0.3 },
    { name: '黑豆', nameEn: 'Black Beans', category: '豆类', calories: 132, protein: 8.9, fat: 0.5, carbs: 24.0, fiber: 8.7 },
    { name: '红豆', nameEn: 'Red Beans', category: '豆类', calories: 127, protein: 7.5, fat: 0.5, carbs: 22.8, fiber: 7.4 },
    
    // 坚果
    { name: '杏仁', nameEn: 'Almonds', category: '坚果', calories: 579, protein: 21.2, fat: 49.9, carbs: 21.6, fiber: 12.5 },
    { name: '核桃', nameEn: 'Walnuts', category: '坚果', calories: 654, protein: 15.2, fat: 65.2, carbs: 13.7, fiber: 6.7 },
    { name: '花生', nameEn: 'Peanuts', category: '坚果', calories: 567, protein: 25.8, fat: 49.2, carbs: 16.1, fiber: 8.5 },
    
    // 饮品
    { name: '水', nameEn: 'Water', category: '饮品', calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 },
    { name: '绿茶', nameEn: 'Green Tea', category: '饮品', calories: 2, protein: 0.2, fat: 0, carbs: 0, fiber: 0 },
    { name: '咖啡', nameEn: 'Coffee', category: '饮品', calories: 2, protein: 0.1, fat: 0, carbs: 0, fiber: 0 }
];

async function initFoods() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ 已连接到 MongoDB');

        // 清空现有数据（可选）
        // await Food.deleteMany({});
        // console.log('🗑️  已清空现有食物数据');

        // 检查是否已有数据
        const count = await Food.countDocuments();
        if (count > 0) {
            console.log(`ℹ️  食物库中已有 ${count} 条数据，跳过初始化`);
            await mongoose.connection.close();
            return;
        }

        // 插入示例数据
        await Food.insertMany(sampleFoods);
        console.log(`✅ 成功初始化 ${sampleFoods.length} 条食物数据`);

        await mongoose.connection.close();
        console.log('✅ 数据库连接已关闭');
    } catch (error) {
        console.error('❌ 初始化失败:', error);
        process.exit(1);
    }
}

initFoods();


