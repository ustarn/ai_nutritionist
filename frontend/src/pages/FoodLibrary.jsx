// src/pages/FoodLibrary.jsx - 食物库页面
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { searchFoods, getFoodCategories, createFood, getTodayFoodLogs } from '../utils/api';

export default function FoodLibrary({ user, onNavigate }) {
    const [foods, setFoods] = useState([]);
    const [categories, setCategories] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [loading, setLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [todayLogs, setTodayLogs] = useState([]);
    const [importingIds, setImportingIds] = useState([]);
    const [newFood, setNewFood] = useState({
        name: '',
        nameEn: '',
        category: '其他',
        calories: '',
        protein: '',
        fat: '',
        carbs: '',
        fiber: '',
        description: ''
    });

    useEffect(() => {
        loadCategories();
        loadFoods();
        loadTodayLogs();
    }, []);

    useEffect(() => {
        loadFoods();
    }, [searchQuery, selectedCategory]);

    const loadTodayLogs = async () => {
        try {
            const logs = await getTodayFoodLogs();
            setTodayLogs(logs || []);
        } catch (error) {
            console.error('加载今日饮食失败:', error);
        }
    };

    const loadCategories = async () => {
        try {
            const cats = await getFoodCategories();
            setCategories(cats);
        } catch (error) {
            console.error('加载分类失败:', error);
        }
    };

    const loadFoods = async () => {
        setLoading(true);
        try {
            const results = await searchFoods(searchQuery, selectedCategory);
            setFoods(results);
        } catch (error) {
            console.error('搜索食物失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddFood = async (e) => {
        e.preventDefault();
        try {
            await createFood(newFood);
            alert('食物添加成功！');
            setShowAddForm(false);
            setNewFood({
                name: '',
                nameEn: '',
                category: '其他',
                calories: '',
                protein: '',
                fat: '',
                carbs: '',
                fiber: '',
                description: ''
            });
            loadFoods();
        } catch (error) {
            alert('添加失败: ' + (error.message || '未知错误'));
        }
    };

    const importFromLog = async (log) => {
        if (!log) return;
        setImportingIds((prev) => [...prev, log._id]);
        try {
            const payload = {
                name: log.foodName || '自定义食物',
                nameEn: '',
                category: '其他',
                calories: Math.round(log.calories || 0),
                protein: Math.round(log.protein || 0),
                fat: Math.round(log.fat || 0),
                carbs: Math.round(log.carbs || 0),
                fiber: 0,
                description: `来自${log.mealType || '未知餐次'}记录，份量${log.portion || 1}份`
            };
            await createFood(payload);
            await loadFoods();
        } catch (error) {
            alert('导入失败: ' + (error.message || '未知错误'));
        } finally {
            setImportingIds((prev) => prev.filter((id) => id !== log._id));
        }
    };

    const importAllLogs = async () => {
        if (!todayLogs || todayLogs.length === 0) return;
        setImportingIds(todayLogs.map((l) => l._id));
        try {
            for (const log of todayLogs) {
                const payload = {
                    name: log.foodName || '自定义食物',
                    nameEn: '',
                    category: '其他',
                    calories: Math.round(log.calories || 0),
                    protein: Math.round(log.protein || 0),
                    fat: Math.round(log.fat || 0),
                    carbs: Math.round(log.carbs || 0),
                    fiber: 0,
                    description: `来自${log.mealType || '未知餐次'}记录，份量${log.portion || 1}份`
                };
                await createFood(payload);
            }
            await loadFoods();
            alert('已将今日饮食全部导入到食物库');
        } catch (error) {
            alert('批量导入失败: ' + (error.message || '未知错误'));
        } finally {
            setImportingIds([]);
        }
    };

    const categoryNames = {
        '主食': '🍚',
        '蔬菜': '🥬',
        '水果': '🍎',
        '肉类': '🥩',
        '海鲜': '🐟',
        '蛋奶': '🥛',
        '豆类': '🫘',
        '坚果': '🥜',
        '饮品': '🥤',
        '其他': '🍽️'
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
            <Navbar currentPage="food-library" username={user.username} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 标题和添加按钮 */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                        <span className="text-4xl mr-3">📚</span>
                        食物库
                    </h1>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition"
                    >
                        {showAddForm ? '取消' : '+ 添加食物'}
                    </button>
                </div>

                {/* 添加食物表单 */}
                {showAddForm && (
                    <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">添加新食物</h2>
                        <form onSubmit={handleAddFood} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        食物名称 *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newFood.name}
                                        onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                        placeholder="例如: 鸡胸肉"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        英文名称
                                    </label>
                                    <input
                                        type="text"
                                        value={newFood.nameEn}
                                        onChange={(e) => setNewFood({ ...newFood, nameEn: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                        placeholder="例如: Chicken Breast"
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        分类
                                    </label>
                                    <select
                                        value={newFood.category}
                                        onChange={(e) => setNewFood({ ...newFood, category: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                    >
                                        {Object.keys(categoryNames).map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        热量 (千卡/100g) *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        step="0.1"
                                        value={newFood.calories}
                                        onChange={(e) => setNewFood({ ...newFood, calories: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                        placeholder="例如: 165"
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        蛋白质 (g/100g)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={newFood.protein}
                                        onChange={(e) => setNewFood({ ...newFood, protein: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        脂肪 (g/100g)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={newFood.fat}
                                        onChange={(e) => setNewFood({ ...newFood, fat: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        碳水 (g/100g)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={newFood.carbs}
                                        onChange={(e) => setNewFood({ ...newFood, carbs: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        纤维 (g/100g)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={newFood.fiber}
                                        onChange={(e) => setNewFood({ ...newFood, fiber: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    描述
                                </label>
                                <textarea
                                    value={newFood.description}
                                    onChange={(e) => setNewFood({ ...newFood, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                    rows="2"
                                    placeholder="可选的食物描述..."
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition"
                            >
                                添加食物
                            </button>
                        </form>
                    </div>
                )}

                {/* 搜索和筛选 */}
                <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                placeholder="🔍 搜索食物名称..."
                            />
                        </div>
                        <div className="md:w-48">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            >
                                <option value="">全部分类</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="font-semibold text-green-800">一键把今日饮食存为自定义食物</p>
                                <p className="text-sm text-green-700">导入后可在食物库中搜索使用，避免重复录入。</p>
                            </div>
                            <button
                                onClick={importAllLogs}
                                disabled={!todayLogs.length || importingIds.length > 0}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-semibold"
                            >
                                {importingIds.length > 0 ? '导入中...' : '导入今日全部'}
                            </button>
                        </div>

                        {todayLogs.length > 0 ? (
                            <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {todayLogs.map((log) => (
                                    <div key={log._id} className="bg-white border border-green-200 rounded-lg p-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-gray-800">{log.foodName}</p>
                                                <p className="text-xs text-gray-500">{log.mealType || '餐次'} | {log.calories} kcal</p>
                                            </div>
                                            <button
                                                onClick={() => importFromLog(log)}
                                                disabled={importingIds.includes(log._id)}
                                                className="text-sm px-3 py-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-400 text-white rounded"
                                            >
                                                {importingIds.includes(log._id) ? '导入中' : '存为食物'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 mt-2">今日暂无饮食记录</p>
                        )}
                    </div>
                </div>

                {/* 食物列表 */}
                <div className="bg-white rounded-2xl shadow-xl p-6">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent mb-4"></div>
                            <p className="text-gray-600">加载中...</p>
                        </div>
                    ) : foods.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <div className="text-6xl mb-4">🔍</div>
                            <p>没有找到相关食物</p>
                            <p className="text-sm mt-2">试试其他搜索关键词或添加新食物</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {foods.map((food) => (
                                <div
                                    key={food._id}
                                    className="border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all hover:border-green-300"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-2xl">{categoryNames[food.category] || '🍽️'}</span>
                                                <h3 className="text-lg font-bold text-gray-800">{food.name}</h3>
                                            </div>
                                            {food.nameEn && (
                                                <p className="text-sm text-gray-500 italic">{food.nameEn}</p>
                                            )}
                                            <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                                                {food.category}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t">
                                        <div>
                                            <p className="text-xs text-gray-600">热量</p>
                                            <p className="text-lg font-bold text-orange-600">{food.calories}</p>
                                            <p className="text-xs text-gray-500">千卡/100g</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-600">蛋白质</p>
                                            <p className="text-lg font-bold text-red-600">{food.protein.toFixed(1)}</p>
                                            <p className="text-xs text-gray-500">g/100g</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-600">脂肪</p>
                                            <p className="text-lg font-bold text-yellow-600">{food.fat.toFixed(1)}</p>
                                            <p className="text-xs text-gray-500">g/100g</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-600">碳水</p>
                                            <p className="text-lg font-bold text-green-600">{food.carbs.toFixed(1)}</p>
                                            <p className="text-xs text-gray-500">g/100g</p>
                                        </div>
                                    </div>

                                    {food.fiber > 0 && (
                                        <div className="mt-2 pt-2 border-t">
                                            <p className="text-xs text-gray-600">
                                                纤维: <span className="font-semibold">{food.fiber.toFixed(1)}g</span>
                                            </p>
                                        </div>
                                    )}

                                    {food.description && (
                                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{food.description}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


