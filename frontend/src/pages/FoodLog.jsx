// src/pages/FoodLog.jsx - 饮食记录页
import React, { useState } from 'react';
import Navbar from '../components/Navbar';

export default function FoodLog({ user, onNavigate }) {
    const [logs, setLogs] = useState([]);
    const [formData, setFormData] = useState({
        foodName: '',
        mealType: 'breakfast',
        calories: '',
        protein: '',
        fat: '',
        carbs: '',
        portion: ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = () => {
        if (!formData.foodName || !formData.calories) {
            alert('请至少填写食物名称和热量!');
            return;
        }

        const newLog = {
            id: Date.now(),
            ...formData,
            calories: parseFloat(formData.calories) || 0,
            protein: parseFloat(formData.protein) || 0,
            fat: parseFloat(formData.fat) || 0,
            carbs: parseFloat(formData.carbs) || 0,
            portion: parseFloat(formData.portion) || 1,
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        };

        setLogs([newLog, ...logs]);

        // 重置表单
        setFormData({
            foodName: '',
            mealType: 'breakfast',
            calories: '',
            protein: '',
            fat: '',
            carbs: '',
            portion: ''
        });
    };

    const deleteLog = (id) => {
        setLogs(logs.filter(log => log.id !== id));
    };

    // 计算今日总营养
    const totals = logs.reduce((acc, log) => ({
        calories: acc.calories + log.calories,
        protein: acc.protein + log.protein,
        fat: acc.fat + log.fat,
        carbs: acc.carbs + log.carbs
    }), { calories: 0, protein: 0, fat: 0, carbs: 0 });

    const mealTypeNames = {
        breakfast: '早餐',
        lunch: '午餐',
        dinner: '晚餐',
        snack: '零食'
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
            <Navbar currentPage="food-log" username={user.username} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* 左侧: 添加记录表单 */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-20">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                                <span className="text-3xl mr-2">➕</span>
                                添加记录
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        食物名称
                                    </label>
                                    <input
                                        type="text"
                                        name="foodName"
                                        value={formData.foodName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                        placeholder="例如: 鸡胸肉"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        餐次
                                    </label>
                                    <select
                                        name="mealType"
                                        value={formData.mealType}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                    >
                                        <option value="breakfast">早餐</option>
                                        <option value="lunch">午餐</option>
                                        <option value="dinner">晚餐</option>
                                        <option value="snack">零食</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        热量 (千卡)
                                    </label>
                                    <input
                                        type="number"
                                        name="calories"
                                        value={formData.calories}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                        placeholder="例如: 165"
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="block text-xs text-gray-600 mb-1">蛋白质(g)</label>
                                        <input
                                            type="number"
                                            name="protein"
                                            value={formData.protein}
                                            onChange={handleChange}
                                            className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                                            placeholder="31"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 mb-1">脂肪(g)</label>
                                        <input
                                            type="number"
                                            name="fat"
                                            value={formData.fat}
                                            onChange={handleChange}
                                            className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                                            placeholder="3.6"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 mb-1">碳水(g)</label>
                                        <input
                                            type="number"
                                            name="carbs"
                                            value={formData.carbs}
                                            onChange={handleChange}
                                            className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleSubmit}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition"
                                >
                                    添加记录
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 右侧: 今日统计和记录列表 */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* 今日营养统计 */}
                        <div className="bg-white rounded-2xl shadow-xl p-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                                <span className="text-3xl mr-2">📊</span>
                                今日营养摄入
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-gradient-to-br from-orange-100 to-orange-200 p-4 rounded-xl">
                                    <p className="text-sm text-orange-800 font-medium">热量</p>
                                    <p className="text-3xl font-bold text-orange-900">{totals.calories}</p>
                                    <p className="text-xs text-orange-700">/ 2000 千卡</p>
                                </div>
                                <div className="bg-gradient-to-br from-red-100 to-red-200 p-4 rounded-xl">
                                    <p className="text-sm text-red-800 font-medium">蛋白质</p>
                                    <p className="text-3xl font-bold text-red-900">{totals.protein.toFixed(1)}</p>
                                    <p className="text-xs text-red-700">克</p>
                                </div>
                                <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 p-4 rounded-xl">
                                    <p className="text-sm text-yellow-800 font-medium">脂肪</p>
                                    <p className="text-3xl font-bold text-yellow-900">{totals.fat.toFixed(1)}</p>
                                    <p className="text-xs text-yellow-700">克</p>
                                </div>
                                <div className="bg-gradient-to-br from-green-100 to-green-200 p-4 rounded-xl">
                                    <p className="text-sm text-green-800 font-medium">碳水</p>
                                    <p className="text-3xl font-bold text-green-900">{totals.carbs.toFixed(1)}</p>
                                    <p className="text-xs text-green-700">克</p>
                                </div>
                            </div>
                        </div>

                        {/* 记录列表 */}
                        <div className="bg-white rounded-2xl shadow-xl p-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                                <span className="text-3xl mr-2">🍽️</span>
                                今日记录 ({logs.length})
                            </h2>

                            {logs.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <div className="text-6xl mb-4">🥗</div>
                                    <p>还没有记录,快添加第一条吧!</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {logs.map((log) => (
                                        <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-1">
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                            {mealTypeNames[log.mealType]}
                          </span>
                                                    <span className="font-semibold text-gray-800">{log.foodName}</span>
                                                    <span className="text-sm text-gray-500">{log.time}</span>
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    <span className="mr-3">🔥 {log.calories} 千卡</span>
                                                    <span className="mr-3">🥩 蛋白 {log.protein}g</span>
                                                    <span className="mr-3">🧈 脂肪 {log.fat}g</span>
                                                    <span>🍞 碳水 {log.carbs}g</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => deleteLog(log.id)}
                                                className="ml-4 px-3 py-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition text-sm font-medium"
                                            >
                                                删除
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}