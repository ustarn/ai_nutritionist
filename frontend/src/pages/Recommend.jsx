// src/pages/Recommend.jsx - AI推荐页
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { getHealthProfile, apiRequest, createFoodLog } from '../utils/api';

export default function Recommend({ user, onNavigate }) {
    const [loading, setLoading] = useState(false);
    const [recommendation, setRecommendation] = useState(null);
    const [error, setError] = useState(null);
    const [hasProfile, setHasProfile] = useState(false);
    const [addingLogs, setAddingLogs] = useState(false);

    const quickOptions = [
        { label: '减脂餐', emoji: '🥗', goal: '减脂' },
        { label: '增肌餐', emoji: '💪', goal: '增肌' },
        { label: '均衡餐', emoji: '🍱', goal: '维持' }
    ];

    // 根据用户ID生成存储key
    const getStorageKey = () => {
        return `mealRecommendation_${user?.id || user?.username}`;
    };

    // 检查用户是否有健康档案并加载保存的推荐
    useEffect(() => {
        const checkProfile = async () => {
            try {
                const profile = await getHealthProfile();
                if (profile && profile.height && profile.weight && profile.age) {
                    setHasProfile(true);
                } else {
                    setHasProfile(false);
                }
            } catch (err) {
                console.error('检查健康档案失败:', err);
                setHasProfile(false);
            }
        };
        checkProfile();

        // 从 localStorage 加载当前用户的推荐结果
        const storageKey = getStorageKey();
        const savedRecommendation = localStorage.getItem(storageKey);
        if (savedRecommendation) {
            try {
                const parsed = JSON.parse(savedRecommendation);
                setRecommendation(parsed);
                console.log('✨ 加载了用户', user?.username, '之前保存的推荐结果');
            } catch (err) {
                console.error('加载保存的推荐失败:', err);
            }
        } else {
            console.log('📝 用户', user?.username, '没有保存的推荐结果');
            setRecommendation(null);
        }
    }, [user?.id, user?.username]);

    const generateRecommendation = async (option) => {
        setLoading(true);
        setError(null);

        // 检查用户是否有健康档案
        if (!hasProfile) {
            setError('请先在个人中心完善您的健康档案(身高、体重、年龄等信息)');
            setLoading(false);
            return;
        }

        try {
            // 调用后端AI推荐接口
            const data = await apiRequest('/api/ai/meal-recommendation', {
                method: 'POST',
                body: JSON.stringify({ goal: option.goal })
            });

            if (data.success) {
                setRecommendation(data.recommendation);
                // 保存推荐结果到 localStorage (使用用户特定的key)
                const storageKey = getStorageKey();
                localStorage.setItem(storageKey, JSON.stringify(data.recommendation));
                console.log('💾 用户', user?.username, '的推荐结果已保存');
                
                // 如果是缓存结果,提示用户
                if (data.cached) {
                    console.log('✨ 使用了缓存的推荐结果');
                }
            } else {
                setError('推荐生成失败，请重试');
            }
        } catch (err) {
            console.error('AI推荐错误:', err);
            setError(err.message || '推荐生成失败，请检查网络连接或稍后重试');
        } finally {
            setLoading(false);
        }
    };

    const addMealsToTodayLog = async () => {
        setError(null);
        if (!recommendation || !recommendation.meals) {
            setError('请先生成AI推荐餐单');
            return;
        }

        const meals = Object.entries(recommendation.meals);
        if (meals.length === 0) {
            setError('推荐中没有餐食数据');
            return;
        }

        setAddingLogs(true);
        try {
            await Promise.all(
                meals.map(([mealType, meal]) => {
                    const logData = {
                        foodName: meal.name || `${mealType} 推荐餐`,
                        mealType,
                        calories: parseFloat(meal.calories) || 0,
                        protein: parseFloat(meal.protein) || 0,
                        fat: parseFloat(meal.fat) || 0,
                        carbs: parseFloat(meal.carbs) || 0,
                        portion: 1,
                    };
                    return createFoodLog(logData);
                })
            );
            alert('✅ 已将AI推荐的三餐添加到今日饮食记录');
        } catch (err) {
            console.error('添加AI推荐到饮食记录失败:', err);
            setError(err.message || '添加失败，请稍后重试');
        } finally {
            setAddingLogs(false);
        }
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

                    <p className="text-gray-600 mb-4">
                        根据您的身高、体重、年龄等信息,AI将为您生成个性化的一日三餐食谱
                    </p>

                    {!hasProfile && (
                        <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                            <p className="text-yellow-800 flex items-center">
                                <span className="text-2xl mr-2">⚠️</span>
                                请先在<button onClick={() => onNavigate('profile')} className="mx-1 text-blue-600 hover:underline font-semibold">个人中心</button>完善您的健康档案(身高、体重、年龄等)
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded">
                            <p className="text-red-800 flex items-center">
                                <span className="text-2xl mr-2">❌</span>
                                {error}
                            </p>
                        </div>
                    )}

                    <div className="grid md:grid-cols-3 gap-4 mb-8">
                        {quickOptions.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => generateRecommendation(option)}
                                disabled={loading || !hasProfile}
                                className="p-6 bg-gradient-to-br from-green-100 to-blue-100 rounded-xl hover:shadow-lg transition transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="text-5xl mb-3">{option.emoji}</div>
                                <h3 className="text-xl font-bold text-gray-800">{option.label}</h3>
                                <p className="text-sm text-gray-600 mt-2">
                                    AI为您定制
                                </p>
                            </button>
                        ))}
                    </div>

                    {loading && (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
                            <p className="mt-4 text-gray-600">AI正在分析您的身体状况...</p>
                            <p className="mt-2 text-sm text-gray-500">正在根据您的身高、体重、年龄生成个性化方案</p>
                            <p className="mt-2 text-xs text-gray-400">这通常需要5-15秒，请耐心等待</p>
                        </div>
                    )}

                    {recommendation && !loading && (
                        <div className="space-y-6">
                            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border-l-4 border-green-500">
                                <h3 className="text-xl font-bold text-green-700 mb-3">
                                    🎯 {recommendation.goal}计划
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4 text-gray-700">
                                    <div>
                                        <p className="mb-1">
                                            每日目标摄入: <span className="font-bold text-green-600">{recommendation.targetCalories}</span> 千卡
                                        </p>
                                        {recommendation.userInfo && (
                                            <>
                                                <p className="text-sm text-gray-600">
                                                    基础代谢率(BMR): {Math.round(recommendation.userInfo.bmr)} 千卡
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    每日总消耗(TDEE): {Math.round(recommendation.userInfo.tdee)} 千卡
                                                </p>
                                            </>
                                        )}
                                    </div>
                                    {recommendation.userInfo && (
                                        <div className="text-sm text-gray-600">
                                            <p>身高: {recommendation.userInfo.height} cm</p>
                                            <p>体重: {recommendation.userInfo.weight} kg</p>
                                        </div>
                                    )}
                                </div>
                            </div>

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

                            <div className="bg-blue-50 p-6 rounded-xl">
                                <h4 className="font-bold text-blue-900 mb-3">💡 营养师建议</h4>
                                <ul className="space-y-2 text-sm text-blue-800">
                                    {recommendation.nutritionTips && recommendation.nutritionTips.length > 0 ? (
                                        recommendation.nutritionTips.map((tip, index) => (
                                            <li key={index}>• {tip}</li>
                                        ))
                                    ) : (
                                        <>
                                            <li>• 每天保持充足的水分摄入(1.5-2L)</li>
                                            <li>• 餐前30分钟适量饮水有助于消化</li>
                                            <li>• 蔬菜优先,细嚼慢咽</li>
                                            <li>• 晚餐尽量在19:00前完成</li>
                                        </>
                                    )}
                                </ul>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={addMealsToTodayLog}
                                    disabled={addingLogs}
                                    className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow transition flex items-center gap-2"
                                >
                                    {addingLogs ? '添加中…' : '一键加入今日饮食'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
