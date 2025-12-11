// src/pages/Dashboard.jsx - 用户主页
import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import {
  getTodayNutrition,
  getHealthAssessment,
  getStreak,
} from "../utils/api";

export default function Dashboard({ user, onNavigate }) {
  const [nutrition, setNutrition] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [loadingNutrition, setLoadingNutrition] = useState(true);
  const [loadingAssessment, setLoadingAssessment] = useState(true);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    // 先尽快加载今日营养摄入并展示，不要被 AI 评估阻塞
    const fetchNutrition = async () => {
      try {
        const nutritionData = await getTodayNutrition();
        setNutrition(nutritionData);
      } catch (error) {
        console.error("获取今日营养失败:", error);
      } finally {
        setLoadingNutrition(false);
      }
    };

    // AI 健康评估单独加载，可能较慢
    const fetchAssessment = async () => {
      try {
        const assessmentData = await getHealthAssessment();
        setAssessment(assessmentData);
      } catch (error) {
        console.error("获取AI健康评估失败:", error);
      } finally {
        setLoadingAssessment(false);
      }
    };

    const fetchStreak = async () => {
      try {
        const data = await getStreak();
        setStreak(data.streakDays || 0);
      } catch (error) {
        console.error("获取连续打卡失败:", error);
      }
    };

    fetchNutrition();
    fetchAssessment();
    fetchStreak();
  }, []);
  const features = [
    {
      icon: "📋",
      title: "健康档案",
      description: "查看和更新您的身体数据、健康目标等信息",
      color: "from-blue-400 to-blue-600",
      page: "profile",
    },
    {
      icon: "🍽️",
      title: "饮食记录",
      description: "记录今天吃了什么,自动计算营养摄入量",
      color: "from-green-400 to-green-600",
      page: "food-log",
    },
    {
      icon: "🤖",
      title: "AI推荐",
      description: "根据您的目标,智能推荐健康食谱",
      color: "from-purple-400 to-purple-600",
      page: "recommend",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navbar currentPage="dashboard" username={user.username} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 欢迎卡片 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            欢迎回来, {user.username}! 👋
          </h1>
          <p className="text-gray-600 text-lg">今天也要健康饮食哦 💪</p>
        </div>

        {/* 功能卡片网格 */}
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <button
              key={index}
              onClick={() => onNavigate(feature.page)}
              className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 text-left group"
            >
              <div
                className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform`}
              >
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </button>
          ))}
        </div>

        {/* 今日营养摄入卡片 */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <span className="text-3xl mr-2">📊</span>
            今日营养摄入
          </h2>
          {loadingNutrition ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-green-500 border-t-transparent"></div>
              <p className="text-gray-600 mt-2">加载中...</p>
            </div>
          ) : nutrition ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-orange-100 to-orange-200 p-5 rounded-xl">
                <p className="text-sm text-orange-800 font-medium mb-2">热量</p>
                <p className="text-3xl font-bold text-orange-900">
                  {Math.round(nutrition.totals.calories)}
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  / {nutrition.targetCalories} 千卡
                </p>
                <div className="mt-2 bg-orange-300 rounded-full h-2">
                  <div
                    className="bg-orange-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        (nutrition.totals.calories / nutrition.targetCalories) *
                          100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-red-100 to-red-200 p-5 rounded-xl">
                <p className="text-sm text-red-800 font-medium mb-2">蛋白质</p>
                <p className="text-3xl font-bold text-red-900">
                  {nutrition.totals.protein.toFixed(1)}
                </p>
                <p className="text-xs text-red-700 mt-1">克</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 p-5 rounded-xl">
                <p className="text-sm text-yellow-800 font-medium mb-2">脂肪</p>
                <p className="text-3xl font-bold text-yellow-900">
                  {nutrition.totals.fat.toFixed(1)}
                </p>
                <p className="text-xs text-yellow-700 mt-1">克</p>
              </div>
              <div className="bg-gradient-to-br from-green-100 to-green-200 p-5 rounded-xl">
                <p className="text-sm text-green-800 font-medium mb-2">碳水</p>
                <p className="text-3xl font-bold text-green-900">
                  {nutrition.totals.carbs.toFixed(1)}
                </p>
                <p className="text-xs text-green-700 mt-1">克</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>暂无数据，快去记录饮食吧！</p>
            </div>
          )}
        </div>

        {/* AI健康评估卡片 */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <span className="text-3xl mr-2">🤖</span>
            AI健康评估
          </h2>
          {loadingAssessment ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-green-500 border-t-transparent"></div>
              <p className="text-gray-600 mt-2">分析中...</p>
            </div>
          ) : assessment ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-2">健康评分</p>
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-5xl font-bold ${
                        assessment.levelColor === "green"
                          ? "text-green-600"
                          : assessment.levelColor === "yellow"
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {assessment.score}
                    </span>
                    <span className="text-2xl text-gray-400">/ 100</span>
                  </div>
                </div>
                <div
                  className={`px-6 py-3 rounded-xl font-bold text-lg ${
                    assessment.levelColor === "green"
                      ? "bg-green-100 text-green-700"
                      : assessment.levelColor === "yellow"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {assessment.level}
                </div>
              </div>

              {assessment.suggestions && assessment.suggestions.length > 0 && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-blue-800 font-semibold mb-2">
                    💡 健康建议：
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    {assessment.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm">
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-gray-600 mb-1">热量进度</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            assessment.progress.calories * 100
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium">
                      {Math.round(assessment.progress.calories * 100)}%
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">蛋白质进度</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            assessment.progress.protein * 100
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium">
                      {Math.round(assessment.progress.protein * 100)}%
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">脂肪进度</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            assessment.progress.fat * 100
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium">
                      {Math.round(assessment.progress.fat * 100)}%
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">碳水进度</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            assessment.progress.carbs * 100
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium">
                      {Math.round(assessment.progress.carbs * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>暂无评估数据</p>
            </div>
          )}
        </div>

        {/* 快捷统计 */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">今日记录</p>
                <p className="text-2xl font-bold text-gray-800">
                  {nutrition?.logsCount || 0} 条
                </p>
              </div>
              <div className="text-4xl">📝</div>
            </div>
            <p className="text-xs text-gray-500 mt-2">饮食记录</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">连续打卡</p>
                <p className="text-2xl font-bold text-gray-800">{streak} 天</p>
              </div>
              <div className="text-4xl">📅</div>
            </div>
            <p className="text-xs text-gray-500 mt-2">继续加油!</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">健康评分</p>
                <p className="text-2xl font-bold text-gray-800">
                  {assessment?.score || "--"}
                </p>
              </div>
              <div className="text-4xl">⭐</div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {assessment?.level || "暂无数据"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
