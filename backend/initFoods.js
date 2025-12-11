// 初始化食物库数据
const mongoose = require('mongoose');
require('dotenv').config();

const Food = require('./models/Food');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nutrition_db';
// 设置 INIT_FOODS_FORCE_CLEAR=true 可强制清空后重建
const FORCE_CLEAR = process.env.INIT_FOODS_FORCE_CLEAR === 'true';

const sampleFoods = [
    // 主食
    { name: '白米饭', nameEn: 'White Rice', category: '主食', calories: 130, protein: 2.7, fat: 0.3, carbs: 28.2, fiber: 0.4 },
    { name: '糙米饭', nameEn: 'Brown Rice', category: '主食', calories: 123, protein: 2.6, fat: 1.0, carbs: 25.6, fiber: 1.8 },
    { name: '面条', nameEn: 'Noodles', category: '主食', calories: 138, protein: 4.5, fat: 0.6, carbs: 28.0, fiber: 1.2 },
    { name: '全麦面包', nameEn: 'Whole Wheat Bread', category: '主食', calories: 247, protein: 13.0, fat: 4.2, carbs: 41.0, fiber: 7.0 },
    { name: '馒头', nameEn: 'Steamed Bun', category: '主食', calories: 227, protein: 7.0, fat: 0.5, carbs: 47.0, fiber: 2.0 },
    { name: '玉米', nameEn: 'Corn', category: '主食', calories: 96, protein: 3.4, fat: 1.5, carbs: 21.0, fiber: 2.4 },
    { name: '土豆', nameEn: 'Potato', category: '主食', calories: 77, protein: 2.0, fat: 0.1, carbs: 17.5, fiber: 2.2 },
    { name: '燕麦', nameEn: 'Oats', category: '主食', calories: 389, protein: 16.9, fat: 6.9, carbs: 66.3, fiber: 10.6 },
    { name: '意大利面', nameEn: 'Pasta', category: '主食', calories: 131, protein: 5.0, fat: 1.1, carbs: 25.0, fiber: 1.4 },
    { name: '红薯', nameEn: 'Sweet Potato', category: '主食', calories: 86, protein: 1.6, fat: 0.1, carbs: 20.1, fiber: 3.0 },
    { name: '紫薯', nameEn: 'Purple Sweet Potato', category: '主食', calories: 90, protein: 2.0, fat: 0.2, carbs: 21.0, fiber: 3.3 },
    { name: '藜麦', nameEn: 'Quinoa', category: '主食', calories: 120, protein: 4.1, fat: 1.9, carbs: 21.3, fiber: 2.8 },
    { name: '荞麦', nameEn: 'Buckwheat', category: '主食', calories: 343, protein: 13.3, fat: 3.4, carbs: 71.5, fiber: 10.0 },
    { name: '杂粮饭', nameEn: 'Mixed Grain Rice', category: '主食', calories: 150, protein: 4.0, fat: 1.2, carbs: 32.0, fiber: 3.0 },

    // 蔬菜
    { name: '西兰花', nameEn: 'Broccoli', category: '蔬菜', calories: 34, protein: 2.8, fat: 0.4, carbs: 7.0, fiber: 2.6 },
    { name: '菠菜', nameEn: 'Spinach', category: '蔬菜', calories: 23, protein: 2.9, fat: 0.4, carbs: 3.6, fiber: 2.2 },
    { name: '胡萝卜', nameEn: 'Carrot', category: '蔬菜', calories: 41, protein: 0.9, fat: 0.2, carbs: 10.0, fiber: 2.8 },
    { name: '番茄', nameEn: 'Tomato', category: '蔬菜', calories: 18, protein: 0.9, fat: 0.2, carbs: 3.9, fiber: 1.2 },
    { name: '黄瓜', nameEn: 'Cucumber', category: '蔬菜', calories: 16, protein: 0.7, fat: 0.1, carbs: 4.0, fiber: 0.5 },
    { name: '生菜', nameEn: 'Lettuce', category: '蔬菜', calories: 15, protein: 1.4, fat: 0.2, carbs: 2.9, fiber: 1.3 },
    { name: '甜椒', nameEn: 'Bell Pepper', category: '蔬菜', calories: 26, protein: 1.0, fat: 0.3, carbs: 6.0, fiber: 2.0 },
    { name: '洋葱', nameEn: 'Onion', category: '蔬菜', calories: 40, protein: 1.1, fat: 0.1, carbs: 9.3, fiber: 1.7 },
    { name: '南瓜', nameEn: 'Pumpkin', category: '蔬菜', calories: 26, protein: 1.0, fat: 0.1, carbs: 6.5, fiber: 0.5 },
    { name: '芦笋', nameEn: 'Asparagus', category: '蔬菜', calories: 20, protein: 2.2, fat: 0.1, carbs: 3.9, fiber: 2.1 },
    { name: '茄子', nameEn: 'Eggplant', category: '蔬菜', calories: 25, protein: 1.0, fat: 0.2, carbs: 6.0, fiber: 3.0 },
    { name: '香菇', nameEn: 'Shiitake', category: '蔬菜', calories: 34, protein: 2.2, fat: 0.5, carbs: 6.8, fiber: 2.5 },
    { name: '莲藕', nameEn: 'Lotus Root', category: '蔬菜', calories: 74, protein: 2.6, fat: 0.1, carbs: 17.2, fiber: 4.9 },
    { name: '紫甘蓝', nameEn: 'Red Cabbage', category: '蔬菜', calories: 31, protein: 1.4, fat: 0.2, carbs: 7.4, fiber: 2.1 },

    // 水果
    { name: '苹果', nameEn: 'Apple', category: '水果', calories: 52, protein: 0.3, fat: 0.2, carbs: 14.0, fiber: 2.4 },
    { name: '香蕉', nameEn: 'Banana', category: '水果', calories: 89, protein: 1.1, fat: 0.3, carbs: 23.0, fiber: 2.6 },
    { name: '橙子', nameEn: 'Orange', category: '水果', calories: 47, protein: 0.9, fat: 0.1, carbs: 12.0, fiber: 2.4 },
    { name: '草莓', nameEn: 'Strawberry', category: '水果', calories: 32, protein: 0.7, fat: 0.3, carbs: 7.7, fiber: 2.0 },
    { name: '蓝莓', nameEn: 'Blueberry', category: '水果', calories: 57, protein: 0.7, fat: 0.3, carbs: 14.5, fiber: 2.4 },
    { name: '葡萄', nameEn: 'Grapes', category: '水果', calories: 69, protein: 0.7, fat: 0.2, carbs: 18.1, fiber: 0.9 },
    { name: '猕猴桃', nameEn: 'Kiwi', category: '水果', calories: 61, protein: 1.1, fat: 0.5, carbs: 14.7, fiber: 3.0 },
    { name: '菠萝', nameEn: 'Pineapple', category: '水果', calories: 50, protein: 0.5, fat: 0.1, carbs: 13.1, fiber: 1.4 },
    { name: '西瓜', nameEn: 'Watermelon', category: '水果', calories: 30, protein: 0.6, fat: 0.2, carbs: 7.6, fiber: 0.4 },
    { name: '牛油果', nameEn: 'Avocado', category: '水果', calories: 160, protein: 2.0, fat: 15.0, carbs: 9.0, fiber: 7.0 },
    { name: '柚子', nameEn: 'Pomelo', category: '水果', calories: 38, protein: 0.8, fat: 0.0, carbs: 9.6, fiber: 1.0 },
    { name: '石榴', nameEn: 'Pomegranate', category: '水果', calories: 83, protein: 1.7, fat: 1.2, carbs: 19.0, fiber: 4.0 },
    { name: '樱桃', nameEn: 'Cherry', category: '水果', calories: 63, protein: 1.1, fat: 0.2, carbs: 16.0, fiber: 2.1 },
    { name: '芒果', nameEn: 'Mango', category: '水果', calories: 60, protein: 0.8, fat: 0.4, carbs: 15.0, fiber: 1.6 },

    // 肉类
    { name: '鸡胸肉', nameEn: 'Chicken Breast', category: '肉类', calories: 165, protein: 31.0, fat: 3.6, carbs: 0, fiber: 0 },
    { name: '瘦牛肉', nameEn: 'Lean Beef', category: '肉类', calories: 250, protein: 26.0, fat: 17.0, carbs: 0, fiber: 0 },
    { name: '瘦猪肉', nameEn: 'Lean Pork', category: '肉类', calories: 242, protein: 27.3, fat: 14.0, carbs: 0, fiber: 0 },
    { name: '火鸡肉', nameEn: 'Turkey', category: '肉类', calories: 189, protein: 29.0, fat: 7.0, carbs: 0, fiber: 0 },
    { name: '羊肉', nameEn: 'Lamb', category: '肉类', calories: 294, protein: 25.0, fat: 21.0, carbs: 0, fiber: 0 },
    { name: '午餐肉', nameEn: 'Ham', category: '肉类', calories: 145, protein: 21.0, fat: 6.0, carbs: 1.5, fiber: 0 },
    { name: '鸡腿肉', nameEn: 'Chicken Thigh', category: '肉类', calories: 209, protein: 26.0, fat: 10.9, carbs: 0, fiber: 0 },
    { name: '牛腱子', nameEn: 'Beef Shank', category: '肉类', calories: 215, protein: 26.0, fat: 12.0, carbs: 0, fiber: 0 },

    // 海鲜
    { name: '三文鱼', nameEn: 'Salmon', category: '海鲜', calories: 208, protein: 20.0, fat: 13.0, carbs: 0, fiber: 0 },
    { name: '金枪鱼', nameEn: 'Tuna', category: '海鲜', calories: 144, protein: 30.0, fat: 1.0, carbs: 0, fiber: 0 },
    { name: '虾', nameEn: 'Shrimp', category: '海鲜', calories: 99, protein: 24.0, fat: 0.3, carbs: 0.2, fiber: 0 },
    { name: '鳕鱼', nameEn: 'Cod', category: '海鲜', calories: 82, protein: 18.0, fat: 0.7, carbs: 0, fiber: 0 },
    { name: '带鱼', nameEn: 'Hairtail', category: '海鲜', calories: 131, protein: 18.0, fat: 6.0, carbs: 0, fiber: 0 },
    { name: '青口贝', nameEn: 'Mussels', category: '海鲜', calories: 86, protein: 12.0, fat: 2.2, carbs: 3.7, fiber: 0 },
    { name: '扇贝', nameEn: 'Scallops', category: '海鲜', calories: 111, protein: 20.5, fat: 0.8, carbs: 5.4, fiber: 0 },
    { name: '带壳生蚝', nameEn: 'Oyster', category: '海鲜', calories: 68, protein: 7.0, fat: 2.5, carbs: 4.0, fiber: 0 },

    // 蛋奶
    { name: '鸡蛋', nameEn: 'Egg', category: '蛋奶', calories: 155, protein: 13.0, fat: 11.0, carbs: 1.1, fiber: 0 },
    { name: '牛奶', nameEn: 'Milk', category: '蛋奶', calories: 42, protein: 3.4, fat: 1.0, carbs: 5.0, fiber: 0 },
    { name: '低脂牛奶', nameEn: 'Low-fat Milk', category: '蛋奶', calories: 35, protein: 3.4, fat: 0.2, carbs: 5.0, fiber: 0 },
    { name: '酸奶', nameEn: 'Yogurt', category: '蛋奶', calories: 59, protein: 10.0, fat: 0.4, carbs: 3.6, fiber: 0 },
    { name: '希腊酸奶', nameEn: 'Greek Yogurt', category: '蛋奶', calories: 97, protein: 9.0, fat: 5.0, carbs: 4.0, fiber: 0 },
    { name: '奶酪', nameEn: 'Cheese', category: '蛋奶', calories: 402, protein: 25.0, fat: 33.0, carbs: 1.3, fiber: 0 },
    { name: '蛋清', nameEn: 'Egg White', category: '蛋奶', calories: 52, protein: 11.0, fat: 0.2, carbs: 0.7, fiber: 0 },
    { name: '全脂牛奶', nameEn: 'Whole Milk', category: '蛋奶', calories: 62, protein: 3.2, fat: 3.4, carbs: 4.8, fiber: 0 },

    // 豆类
    { name: '豆腐', nameEn: 'Tofu', category: '豆类', calories: 76, protein: 8.1, fat: 4.8, carbs: 1.9, fiber: 0.3 },
    { name: '黑豆', nameEn: 'Black Beans', category: '豆类', calories: 132, protein: 8.9, fat: 0.5, carbs: 24.0, fiber: 8.7 },
    { name: '红豆', nameEn: 'Red Beans', category: '豆类', calories: 127, protein: 7.5, fat: 0.5, carbs: 22.8, fiber: 7.4 },
    { name: '鹰嘴豆', nameEn: 'Chickpeas', category: '豆类', calories: 164, protein: 8.9, fat: 2.6, carbs: 27.0, fiber: 7.6 },
    { name: '毛豆', nameEn: 'Edamame', category: '豆类', calories: 122, protein: 11.9, fat: 5.2, carbs: 9.9, fiber: 5.2 },
    { name: '扁豆', nameEn: 'Lentils', category: '豆类', calories: 116, protein: 9.0, fat: 0.4, carbs: 20.0, fiber: 8.0 },
    { name: '豆浆', nameEn: 'Soy Milk', category: '豆类', calories: 54, protein: 3.3, fat: 1.8, carbs: 6.0, fiber: 0.6 },

    // 坚果
    { name: '杏仁', nameEn: 'Almonds', category: '坚果', calories: 579, protein: 21.2, fat: 49.9, carbs: 21.6, fiber: 12.5 },
    { name: '核桃', nameEn: 'Walnuts', category: '坚果', calories: 654, protein: 15.2, fat: 65.2, carbs: 13.7, fiber: 6.7 },
    { name: '花生', nameEn: 'Peanuts', category: '坚果', calories: 567, protein: 25.8, fat: 49.2, carbs: 16.1, fiber: 8.5 },
    { name: '腰果', nameEn: 'Cashews', category: '坚果', calories: 553, protein: 18.0, fat: 44.0, carbs: 30.0, fiber: 3.3 },
    { name: '开心果', nameEn: 'Pistachios', category: '坚果', calories: 562, protein: 20.0, fat: 45.0, carbs: 28.0, fiber: 10.0 },
    { name: '榛子', nameEn: 'Hazelnuts', category: '坚果', calories: 628, protein: 15.0, fat: 61.0, carbs: 17.0, fiber: 10.0 },

    // 饮品
    { name: '水', nameEn: 'Water', category: '饮品', calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 },
    { name: '绿茶', nameEn: 'Green Tea', category: '饮品', calories: 2, protein: 0.2, fat: 0, carbs: 0, fiber: 0 },
    { name: '咖啡', nameEn: 'Coffee', category: '饮品', calories: 2, protein: 0.1, fat: 0, carbs: 0, fiber: 0 },
    { name: '橙汁', nameEn: 'Orange Juice', category: '饮品', calories: 45, protein: 0.7, fat: 0.2, carbs: 10.4, fiber: 0.2 },
    { name: '椰子水', nameEn: 'Coconut Water', category: '饮品', calories: 19, protein: 0.7, fat: 0.2, carbs: 3.7, fiber: 1.1 },
    { name: '燕麦奶', nameEn: 'Oat Milk', category: '饮品', calories: 43, protein: 1.0, fat: 1.5, carbs: 6.7, fiber: 0.8 },
    { name: '无糖豆浆', nameEn: 'Unsweetened Soy Milk', category: '饮品', calories: 38, protein: 3.0, fat: 2.0, carbs: 2.0, fiber: 0.5 },

    // 其他（方便零食/酱料）
    { name: '蜂蜜', nameEn: 'Honey', category: '其他', calories: 304, protein: 0.3, fat: 0, carbs: 82.0, fiber: 0.2 },
    { name: '花生酱', nameEn: 'Peanut Butter', category: '其他', calories: 588, protein: 25.0, fat: 50.0, carbs: 20.0, fiber: 6.0 },
    { name: '番茄酱', nameEn: 'Ketchup', category: '其他', calories: 112, protein: 1.2, fat: 0.2, carbs: 26.0, fiber: 0.3 },
    { name: '燕麦能量棒', nameEn: 'Oat Bar', category: '其他', calories: 380, protein: 10.0, fat: 12.0, carbs: 58.0, fiber: 5.0 },
    { name: '黑巧克力(70%)', nameEn: 'Dark Chocolate 70%', category: '其他', calories: 600, protein: 7.8, fat: 43.0, carbs: 45.0, fiber: 10.9 },
];

async function initFoods() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ 已连接到 MongoDB');

        // 可选清空
        if (FORCE_CLEAR) {
            await Food.deleteMany({});
            console.log('🗑️  已清空现有食物数据');
        }

        // 检查是否已有数据
        const count = await Food.countDocuments();
        if (count > 0 && !FORCE_CLEAR) {
            console.log(`ℹ️  食物库中已有 ${count} 条数据，跳过初始化（如需重置，设 INIT_FOODS_FORCE_CLEAR=true）`);
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


