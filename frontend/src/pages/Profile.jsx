// src/pages/Profile.jsx - 健康档案页
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { getHealthProfile, saveHealthProfile } from '../utils/api';

export default function Profile({ user, onNavigate }) {
    const [formData, setFormData] = useState({
        height: '',
        weight: '',
        gender: 'male',
        age: '',
        activityLevel: 'sedentary',
        goal: 'maintain'
    });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);

    // 加载用户健康档案
    useEffect(() => {
        const loadProfile = async () => {
            try {
                const profile = await getHealthProfile();
                setFormData({
                    height: profile.height ?? '',
                    weight: profile.weight ?? '',
                    gender: profile.gender || 'male',
                    age: profile.age ?? '',
                    activityLevel: profile.activityLevel || 'sedentary',
                    goal: profile.goal || 'maintain'
                });
                if (profile.targetCalories) {
                    setResult({
                        calories: profile.targetCalories,
                        protein: Math.round((profile.weight || 0) * 1.6),
                        carbs: Math.round(profile.targetCalories * 0.5 / 4),
                        fat: Math.round(profile.targetCalories * 0.25 / 9),
                        goal: profile.goal === 'lose_weight'
                            ? '减脂'
                            : profile.goal === 'gain_muscle'
                                ? '增肌'
                                : '维持'
                    });
                }
            } catch (error) {
                console.error('加载健康档案失败:', error);
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSaveProfile = async () => {
        const { height, weight, gender, age, activityLevel, goal } = formData;

        if (!height || !weight || !age) {
            alert('请先填写身高、体重和年龄');
            return;
        }

        setSaving(true);
        try {
            const saved = await saveHealthProfile({
                height,
                weight,
                gender,
                age,
                activityLevel,
                goal
            });

            // 根据后端返回的 targetCalories 同步结果
            if (saved.targetCalories) {
                setResult({
                    calories: saved.targetCalories,
                    protein: Math.round(parseFloat(saved.weight) * 1.6),
                    carbs: Math.round(saved.targetCalories * 0.5 / 4),
                    fat: Math.round(saved.targetCalories * 0.25 / 9),
                    goal: saved.goal === 'lose_weight'
                        ? '减脂'
                        : saved.goal === 'gain_muscle'
                            ? '增肌'
                            : '维持'
                });
            }

            setEditing(false);
            alert('✅ 健康档案已保存');
        } catch (error) {
            console.error('保存健康档案失败:', error);
            alert('保存失败: ' + (error.message || '请稍后再试'));
        } finally {
            setSaving(false);
        }
    };

    const calculateTDEE = () => {
        const { height, weight, gender, age, activityLevel, goal } = formData;

        if (!height || !weight || !age) {
            alert('请填写完整信息!');
            return;
        }

        // 计算 BMR
        let bmr;
        if (gender === 'male') {
            bmr = 10 * parseFloat(weight) + 6.25 * parseFloat(height) - 5 * parseInt(age) + 5;
        } else {
            bmr = 10 * parseFloat(weight) + 6.25 * parseFloat(height) - 5 * parseInt(age) - 161;
        }

        // 活动系数
        const activityMultipliers = {
            sedentary: 1.2,
            light: 1.375,
            moderate: 1.55,
            heavy: 1.725
        };

        // TDEE
        let tdee = bmr * activityMultipliers[activityLevel];

        // 根据目标调整
        if (goal === 'lose_weight') {
            tdee -= 500;
        } else if (goal === 'gain_muscle') {
            tdee += 300;
        }

        tdee = Math.round(tdee);

        setResult({
            calories: tdee,
            protein: Math.round(parseFloat(weight) * 1.6),
            carbs: Math.round(tdee * 0.5 / 4),
            fat: Math.round(tdee * 0.25 / 9),
            goal: goal === 'lose_weight' ? '减脂' : goal === 'gain_muscle' ? '增肌' : '维持'
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
            <Navbar currentPage="profile" username={user.username} />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="bg-white rounded-2xl shadow-xl p-8">
                    <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
                        <span className="text-4xl mr-3">📋</span>
                        健康档案
                    </h2>

                    {loading ? (
                        <div className="py-12 text-center text-gray-500">
                            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent mb-4"></div>
                            <p>加载健康档案中...</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-center mb-6">
                                <p className="text-gray-600">
                                    健康档案将用于计算每日推荐摄入量和 AI 健康评估。
                                </p>
                                <button
                                    onClick={() => setEditing(!editing)}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                                        editing
                                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                                >
                                    {editing ? '取消编辑' : '编辑档案'}
                                </button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                        {/* 身高 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                身高 (cm)
                            </label>
                            <input
                                type="number"
                                name="height"
                                value={formData.height}
                                onChange={handleChange}
                                disabled={!editing}
                                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${!editing ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                                placeholder="例如: 170"
                            />
                        </div>

                        {/* 体重 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                体重 (kg)
                            </label>
                            <input
                                type="number"
                                name="weight"
                                value={formData.weight}
                                onChange={handleChange}
                                disabled={!editing}
                                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${!editing ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                                placeholder="例如: 65"
                            />
                        </div>

                        {/* 性别 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                性别
                            </label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                disabled={!editing}
                                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${!editing ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                            >
                                <option value="male">男</option>
                                <option value="female">女</option>
                            </select>
                        </div>

                        {/* 年龄 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                年龄
                            </label>
                            <input
                                type="number"
                                name="age"
                                value={formData.age}
                                onChange={handleChange}
                                disabled={!editing}
                                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${!editing ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                                placeholder="例如: 25"
                            />
                        </div>

                        {/* 运动量 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                运动量
                            </label>
                            <select
                                name="activityLevel"
                                value={formData.activityLevel}
                                onChange={handleChange}
                                disabled={!editing}
                                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${!editing ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                            >
                                <option value="sedentary">久坐 (几乎不运动)</option>
                                <option value="light">轻度 (每周1-3次)</option>
                                <option value="moderate">中度 (每周3-5次)</option>
                                <option value="heavy">重度 (每周6-7次)</option>
                            </select>
                        </div>

                        {/* 目标 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                健康目标
                            </label>
                            <select
                                name="goal"
                                value={formData.goal}
                                onChange={handleChange}
                                disabled={!editing}
                                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${!editing ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                            >
                                <option value="lose_weight">减脂</option>
                                <option value="gain_muscle">增肌</option>
                                <option value="maintain">维持</option>
                            </select>
                        </div>
                            </div>

                            {/* 按钮 */}
                            <div className="flex gap-4 mt-8">
                                <button
                                    onClick={calculateTDEE}
                                    className="flex-1 bg-white border border-green-200 text-green-700 hover:bg-green-50 font-semibold py-3 rounded-lg transition"
                                >
                                    重新计算推荐摄入量（本地预览）
                                </button>
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={!editing || saving}
                                    className={`flex-1 font-semibold py-3 rounded-lg transition ${
                                        editing
                                            ? 'bg-green-600 hover:bg-green-700 text-white'
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    {saving ? '保存中...' : '保存健康档案'}
                                </button>
                                <button
                                    onClick={() => onNavigate('dashboard')}
                                    className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition"
                                >
                                    返回
                                </button>
                            </div>
                        </>
                    )}

                    {/* 计算结果 */}
                    {result && (
                        <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border-l-4 border-green-500">
                            <h3 className="text-xl font-bold text-green-700 mb-4">
                                🎯 您的每日推荐摄入量
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white p-4 rounded-lg">
                                    <p className="text-sm text-gray-600">热量</p>
                                    <p className="text-2xl font-bold text-gray-800">{result.calories}</p>
                                    <p className="text-xs text-gray-500">千卡</p>
                                </div>
                                <div className="bg-white p-4 rounded-lg">
                                    <p className="text-sm text-gray-600">蛋白质</p>
                                    <p className="text-2xl font-bold text-gray-800">{result.protein}</p>
                                    <p className="text-xs text-gray-500">克/天</p>
                                </div>
                                <div className="bg-white p-4 rounded-lg">
                                    <p className="text-sm text-gray-600">碳水</p>
                                    <p className="text-2xl font-bold text-gray-800">{result.carbs}</p>
                                    <p className="text-xs text-gray-500">克/天</p>
                                </div>
                                <div className="bg-white p-4 rounded-lg">
                                    <p className="text-sm text-gray-600">脂肪</p>
                                    <p className="text-2xl font-bold text-gray-800">{result.fat}</p>
                                    <p className="text-xs text-gray-500">克/天</p>
                                </div>
                            </div>
                            <p className="mt-4 text-sm text-gray-700">
                                <strong>健康目标:</strong> {result.goal}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}