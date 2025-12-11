// src/pages/FoodLog.jsx - 饮食记录页
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { calculateNutritionWithAI, createFoodLog, getTodayFoodLogs, deleteFoodLog, getFoodLogs, searchFoods } from '../utils/api';

export default function FoodLog({ user, onNavigate }) {
    const [logs, setLogs] = useState([]);
    const [aiLoading, setAiLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [filterMode, setFilterMode] = useState('today'); // 'today' | 'range'
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });
    const [refreshTick, setRefreshTick] = useState(0); // 手动刷新计数器
    const [searchTerm, setSearchTerm] = useState('');
    const [searching, setSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
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

    // 加载饮食记录（支持今日/日期范围）
    useEffect(() => {
        const loadLogs = async () => {
            setLoading(true);
            try {
                let data = [];
                if (filterMode === 'today') {
                    data = await getTodayFoodLogs();
                } else {
                    // 若未选择日期范围，默认过去7天
                    const todayStr = new Date().toISOString().slice(0, 10);
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
                    const start = dateRange.startDate || sevenDaysAgo.toISOString().slice(0, 10);
                    const end = dateRange.endDate || todayStr;
                    data = await getFoodLogs({ startDate: start, endDate: end, limit: 500 });
                }

                const formattedLogs = data.map(log => ({
                    id: log._id,
                    foodName: log.foodName,
                    mealType: log.mealType,
                    calories: log.calories,
                    protein: log.protein,
                    fat: log.fat,
                    carbs: log.carbs,
                    portion: log.portion,
                    // 展示日期+时间，方便查看历史
                    time: new Date(log.loggedAt).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                    date: new Date(log.loggedAt).toLocaleDateString('zh-CN')
                }));
                setLogs(formattedLogs);
            } catch (error) {
                console.error('加载饮食记录失败:', error);
            } finally {
                setLoading(false);
            }
        };
        loadLogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterMode, dateRange.startDate, dateRange.endDate, refreshTick]);

    const handleSearchLibrary = async () => {
        if (!searchTerm.trim()) {
            setSearchResults([]);
            return;
        }
        setSearching(true);
        try {
            const results = await searchFoods(searchTerm.trim(), '');
            setSearchResults(results || []);
        } catch (error) {
            console.error('搜索食物库失败:', error);
            alert('搜索失败，请稍后再试');
        } finally {
            setSearching(false);
        }
    };

    const fillFormFromFood = (food) => {
        if (!food) return;
        setFormData({
            ...formData,
            foodName: food.name,
            calories: food.calories || '',
            protein: food.protein || '',
            fat: food.fat || '',
            carbs: food.carbs || '',
            portion: formData.portion || 1,
        });
    };

    const handleAICalculate = async () => {
        if (!formData.foodName.trim()) {
            alert('请先输入食物名称或描述');
            return;
        }

        setAiLoading(true);
        try {
            const result = await calculateNutritionWithAI(formData.foodName);
            if (result.success && result.nutrition) {
                const nutrition = result.nutrition;
                setFormData({
                    ...formData,
                    foodName: nutrition.name || formData.foodName,
                    calories: nutrition.calories || '',
                    protein: nutrition.protein || '',
                    fat: nutrition.fat || '',
                    carbs: nutrition.carbs || '',
                    portion: nutrition.portion || ''
                });
                alert('✅ AI已自动识别并填充营养信息！');
            } else {
                throw new Error('AI返回数据格式错误');
            }
        } catch (error) {
            console.error('AI识别失败:', error);
            alert('AI识别失败: ' + (error.message || '请检查网络连接或API配置'));
        } finally {
            setAiLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.foodName || !formData.calories) {
            alert('请至少填写食物名称和热量!');
            return;
        }

        try {
            const logData = {
                foodName: formData.foodName,
                mealType: formData.mealType,
                calories: parseFloat(formData.calories) || 0,
                protein: parseFloat(formData.protein) || 0,
                fat: parseFloat(formData.fat) || 0,
                carbs: parseFloat(formData.carbs) || 0,
                portion: parseFloat(formData.portion) || 1
            };

            const savedLog = await createFoodLog(logData);
            
            // 添加到列表
            const newLog = {
                id: savedLog._id,
                ...logData,
                time: new Date(savedLog.loggedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
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

            alert('✅ 记录添加成功！');
        } catch (error) {
            console.error('添加记录失败:', error);
            alert('添加记录失败: ' + (error.message || '请重试'));
        }
    };

    const handleDeleteLog = async (id) => {
        if (!window.confirm('确定要删除这条记录吗？')) {
            return;
        }

        try {
            await deleteFoodLog(id);
            setLogs(logs.filter(log => log.id !== id));
            alert('✅ 删除成功！');
        } catch (error) {
            console.error('删除记录失败:', error);
            alert('删除失败: ' + (error.message || '请重试'));
        }
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
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-20">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                                <span className="text-3xl mr-2">➕</span>
                                添加记录
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        食物名称或描述
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            name="foodName"
                                            value={formData.foodName}
                                            onChange={handleChange}
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                            placeholder="例如: 鸡胸肉 150g 或 一碗白米饭"
                                            disabled={aiLoading}
                                        />
                                        <button
                                            onClick={handleAICalculate}
                                            disabled={aiLoading || !formData.foodName.trim()}
                                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center gap-2"
                                            title="使用AI自动识别营养信息"
                                        >
                                            {aiLoading ? (
                                                <>
                                                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                                                    <span className="hidden sm:inline">识别中...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>🤖</span>
                                                    <span className="hidden sm:inline">AI识别</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        💡 输入食物名称和份量，点击AI识别自动填充营养信息
                                    </p>
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

                        <div className="bg-white rounded-2xl shadow p-5">
                            <h3 className="text-lg font-bold text-gray-800 mb-3">从食物库填充</h3>
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearchLibrary(); } }}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                    placeholder="输入食物名称后搜索"
                                />
                                <button
                                    onClick={handleSearchLibrary}
                                    disabled={searching}
                                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-400 text-white rounded-lg font-semibold"
                                >
                                    {searching ? '搜索中' : '搜索'}
                                </button>
                            </div>
                            {searchResults.length > 0 ? (
                                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                    {searchResults.map((food) => (
                                        <div key={food._id} className="border border-gray-200 rounded-lg p-3 flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-gray-800">{food.name}</p>
                                                <p className="text-xs text-gray-500">热量 {food.calories} kcal /100g</p>
                                                <p className="text-xs text-gray-500">蛋白 {food.protein}g | 碳水 {food.carbs}g | 脂肪 {food.fat}g</p>
                                            </div>
                                            <button
                                                onClick={() => fillFormFromFood(food)}
                                                className="text-sm px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
                                            >
                                                填入表单
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">搜索食物库并一键填充表单，记得根据实际份量调整“份数”。</p>
                            )}
                        </div>
                    </div>

                    {/* 右侧: 统计和记录列表 */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* 过滤器 */}
                        <div className="bg-white rounded-2xl shadow p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setFilterMode('today')}
                                    className={`px-4 py-2 rounded-lg font-semibold ${filterMode === 'today' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                                >
                                    仅查看今天
                                </button>
                                <button
                                    onClick={() => setFilterMode('range')}
                                    className={`px-4 py-2 rounded-lg font-semibold ${filterMode === 'range' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                                >
                                    按日期范围
                                </button>
                            </div>

                            {filterMode === 'range' && (
                                <div className="flex flex-wrap gap-2 items-center">
                                    <input
                                        type="date"
                                        value={dateRange.startDate}
                                        onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                        className="px-3 py-2 border rounded-lg text-sm"
                                    />
                                    <span className="text-gray-500">至</span>
                                    <input
                                        type="date"
                                        value={dateRange.endDate}
                                        onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                        className="px-3 py-2 border rounded-lg text-sm"
                                    />
                                    <button
                                        onClick={() => setRefreshTick((t) => t + 1)}
                                        className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm"
                                    >
                                        刷新
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* 营养统计 */}
                        <div className="bg-white rounded-2xl shadow-xl p-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                                <span className="text-3xl mr-2">📊</span>
                                {filterMode === 'today' ? '今日营养摄入' : '营养摄入（所选日期）'}
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
                                {filterMode === 'today' ? '今日记录' : '历史记录'} ({logs.length})
                            </h2>

                            {loading ? (
                                <div className="text-center py-12">
                                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent mb-4"></div>
                                    <p className="text-gray-600">加载中...</p>
                                </div>
                            ) : logs.length === 0 ? (
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
                                                    <span className="text-sm text-gray-500">{log.date} {log.time}</span>
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    <span className="mr-3">🔥 {log.calories} 千卡</span>
                                                    <span className="mr-3">🥩 蛋白 {log.protein}g</span>
                                                    <span className="mr-3">🧈 脂肪 {log.fat}g</span>
                                                    <span>🍞 碳水 {log.carbs}g</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteLog(log.id)}
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