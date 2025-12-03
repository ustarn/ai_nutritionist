// src/pages/Recommend.jsx - AI推荐页
import React, { useState } from 'react';
import Navbar from '../components/Navbar';

export default function Recommend({ user, onNavigate }) {
    const [loading, setLoading] = useState(false);
    const [recommendation, setRecommendation] = useState(null);

    const quickOptions = [
        { label: '减脂餐', emoji: '🥗', goal: '减脂', calories: 1500 },
        { label: '增肌餐', emoji: '💪', goal: '增肌', calories: 2500 },
        { label: '均衡餐', emoji: '🍱', goal: '维持', calories: 2000 }
    ];

    const generateRecommendation = (option) => {
        setLoading(true);

        // 模拟AI推荐(实际项目中调用Claude API)
        setTimeout(() => {
            const meals = {
                '减脂': {
                    breakfast: {
                        name: '营养早餐',
                        foods: ['燕麦片 50g', '鸡蛋 2个', '低脂牛奶 250ml', '蓝莓 30g'],
                        calories: 380,
                        protein: 25,
                        carbs: 45,
                        fat: 10
                    },
                    lunch: {
                        name: '低卡午餐',
                        foods: ['糙米饭 100g', '鸡胸肉 150g', '西兰花 100g', '番茄 50g'],
                        calories: 450,
                        protein: 40,
                        carbs: 50,
                        fat: 8
                    },
                    dinner: {
                        name: '轻食晚餐',
                        foods: ['全麦面包 2片', '三文鱼 120g', '生菜沙拉 150g', '橄榄油 5ml'],
                        calories: 420,
                        protein: 35,
                        carbs: 35,
                        fat: 15
                    }
                },
                '增肌': {
                    breakfast: {
                        name: '高蛋白早餐',
                        foods: ['全麦面包 3片', '鸡蛋 3个', '全脂牛奶 300ml', '香蕉 1根'],
                        calories: 580,
                        protein: 38,
                        carbs: 70,
                        fat: 18
                    },
                    lunch: {
                        name: '增肌午餐',
                        foods: ['米饭 200g', '牛肉 200g', '土豆 150g', '青菜 100g'],
                        calories: 720,
                        protein: 50,
                        carbs: 85,
                        fat: 15
                    },
                    dinner: {
                        name: '高能晚餐',
                        foods: ['意大利面 150g', '鸡胸肉 200g', '番茄酱 50g', '芝士 20g'],
                        calories: 680,
                        protein: 48,
                        carbs: 75,
                        fat: 18
                    }
                },
                '维持': {
                    breakfast: {
                        name: '均衡早餐',
                        foods: ['全麦面包 2片', '鸡蛋 2个', '牛奶 250ml', '苹果 1个'],
                        calories: 450,
                        protein: 28,
                        carbs: 55,
                        fat: 12
                    },
                    lunch: {
                        name: '均衡午餐',
                        foods: ['米饭 150g', '鱼肉 150g', '蔬菜 150g', '豆腐 100g'],
                        calories: 550,
                        protein: 38,
                        carbs: 65,
                        fat: 12
                    },
                    dinner: {
                        name: '均衡晚餐',
                        foods: ['紫薯 150g', '鸡肉 150g', '西兰花 100g', '坚果 15g'],
                        calories: 500,
                        protein: 35,
                        carbs: 58,
                        fat: 14
                    }
                }
            };

            setRecommendation({
                goal: option.goal,
                targetCalories: option.calories,
                meals: meals[option.goal]
            });
            setLoading(false);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
            <Navbar currentPage="recommend" username={user.username} />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
                        <span className="text-4xl mr-3">🤖</span>
                        AI智能推荐
                    </h2>

                    <p className="text-gray-600 mb-8">
                        根据您的健康目标,AI将为您生成个性化的一日三餐食谱
                    </p>

                    {/* 快捷选项 */}
                    <div className="grid md:grid-cols-3 gap-4 mb-8">
                        {quickOptions.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => generateRecommendation(option)}
                                disabled={loading}
                                className="p-6 bg-gradient-to-br from-green-100 to-blue-100 rounded-xl hover:shadow-lg transition transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="text-5xl mb-3">{option.emoji}</div>
                                <h3 className="text-xl font-bold text-gray-800">{option.label}</h3>
                                <p className="text-sm text-gray-600 mt-2">
                                    目标: {option.calories} 千卡/天
                                </p>
                            </button>
                        ))}
                    </div>

                    {/* 加载动画 */}
                    {loading && (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
                            <p className="mt-4 text-gray-600">AI正在生成推荐...</p>
                        </div>
                    )}

                    {/* 推荐结果 */}
                    {recommendation && !loading && (
                        <div className="space-y-6">
                            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border-l-4 border-green-500">
                                <h3 className="text-xl font-bold text-green-700 mb-2">
                                    🎯 {recommendation.goal}计划
                                </h3>
                                <p className="text-gray-700">
                                    每日目标摄入: <span className="font-bold">{recommendation.targetCalories}</span> 千卡
                                </p>
                            </div>

                            {/* 三餐卡片 */}
                            <div className="grid md:grid-cols-3 gap-6">
                                {Object.entries(recommendation.meals).map(([mealType, meal]) => {
                                    const mealNames = {
                                        breakfast: '早餐',
                                        lunch: '午餐',
                                        dinner: '晚餐'
                                    };
                                    const mealIcons = {
                                        breakfast: '🌅',
                                        lunch: '☀️',
                                        dinner: '🌙'
                                    };

                                    return (
                                        <div key={mealType} className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-green-300 transition">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-xl font-bold text-gray-800">
                                                    {mealIcons[mealType]} {mealNames[mealType]}
                                                </h4>
                                                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                          {meal.calories} 千卡
                        </span>
                                            </div>

                                            <p className="text-gray-600 font-medium mb-3">{meal.name}</p>

                                            <ul className="space-y-2 mb-4">
                                                {meal.foods.map((food, index) => (
                                                    <li key={index} className="flex items-start">
                                                        <span className="text-green-500 mr-2">•</span>
                                                        <span className="text-gray-700 text-sm">{food}</span>
                                                    </li>
                                                ))}
                                            </ul>

                                            <div className="pt-4 border-t border-gray-200">
                                                <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                                                    <div>
                                                        <span className="font-medium">蛋白</span>
                                                        <p className="font-bold text-gray-800">{meal.protein}g</p>
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">碳水</span>
                                                        <p className="font-bold text-gray-800">{meal.carbs}g</p>
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">脂肪</span>
                                                        <p className="font-bold text-gray-800">{meal.fat}g</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* 营养建议 */}
                            <div className="bg-blue-50 p-6 rounded-xl">
                                <h4 className="font-bold text-blue-900 mb-3">💡 营养师建议</h4>
                                <ul className="space-y-2 text-sm text-blue-800">
                                    <li>• 每天保持充足的水分摄入(1.5-2L)</li>
                                    <li>• 餐前30分钟适量饮水有助于消化</li>
                                    <li>• 蔬菜优先,细嚼慢咽</li>
                                    <li>• 晚餐尽量在19:00前完成</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}