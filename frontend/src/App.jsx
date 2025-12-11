import React, { useState, useEffect } from "react";
import {
  getToken,
  getUserProfile,
  getHealthProfile,
  saveHealthProfile,
} from "./utils/api";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import FoodLog from "./pages/FoodLog";
import FoodLibrary from "./pages/FoodLibrary";
import Recommend from "./pages/Recommend";

export default function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    height: "",
    weight: "",
    targetWeight: "",
    gender: "male",
    age: "",
    activityLevel: "sedentary",
    goal: "maintain",
  });
  const [profileSaving, setProfileSaving] = useState(false);

  // 页面加载时检查登录状态
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (token) {
        try {
          const userData = await getUserProfile();
          setUser(userData);
          await checkHealthProfile();
        } catch (error) {
          console.error("获取用户信息失败:", error);
          // Token可能过期,清除
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const checkHealthProfile = async () => {
    try {
      const profile = await getHealthProfile();
      setProfileForm({
        height: profile.height ?? "",
        weight: profile.weight ?? "",
        targetWeight: profile.targetWeight ?? "",
        gender: profile.gender || "male",
        age: profile.age ?? "",
        activityLevel: profile.activityLevel || "sedentary",
        goal: profile.goal || "maintain",
      });
      if (!isProfileComplete(profile)) {
        setProfileModalOpen(true);
      }
    } catch (error) {
      console.error("检查健康档案失败:", error);
    }
  };

  const isProfileComplete = (profile) => {
    return Boolean(profile && profile.height && profile.weight && profile.age);
  };

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const { height, weight, age } = profileForm;
    if (!height || !weight || !age) {
      alert("请填写身高、体重和年龄");
      return;
    }
    setProfileSaving(true);
    try {
      await saveHealthProfile(profileForm);
      setProfileModalOpen(false);
      alert("✅ 健康档案已保存");
    } catch (error) {
      console.error("保存健康档案失败:", error);
      alert("保存失败: " + (error.message || "请稍后再试"));
    } finally {
      setProfileSaving(false);
    }
  };

  // 监听URL hash变化
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || "dashboard";
      setCurrentPage(hash);
    };

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange(); // 初始化

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleLoginSuccess = async (userData) => {
    setUser(userData);
    setCurrentPage("dashboard");
    await checkHealthProfile();
  };

  const handleNavigate = (page) => {
    if (profileModalOpen) {
      // 强制填写健康档案时阻止导航
      alert("请先完成健康档案，才能访问主页面");
      // 打开个人档案页面以便填写
      setProfileModalOpen(true);
      window.location.hash = "profile";
      return;
    }
    window.location.hash = page;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  // 未登录显示登录页
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // 已登录,根据currentPage渲染对应页面
  return (
    <>
      {currentPage === "dashboard" && (
        <Dashboard user={user} onNavigate={handleNavigate} />
      )}
      {currentPage === "profile" && (
        <Profile user={user} onNavigate={handleNavigate} />
      )}
      {currentPage === "food-log" && (
        <FoodLog user={user} onNavigate={handleNavigate} />
      )}
      {currentPage === "food-library" && (
        <FoodLibrary user={user} onNavigate={handleNavigate} />
      )}
      {currentPage === "recommend" && (
        <Recommend user={user} onNavigate={handleNavigate} />
      )}

      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* 背景遮罩，阻止对底层的点击 */}
          <div className="absolute inset-0 bg-black/40" />
          {/* 浮在首页上的卡片 */}
          <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-green-100 max-w-lg w-full p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
              🩺 完成健康档案
            </h3>
            <p className="text-gray-600 text-sm text-center mb-6">
              为了给您提供准确的营养建议，请先填写基本身体数据。
            </p>
            <form className="space-y-4" onSubmit={handleProfileSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    身高 (cm)
                  </label>
                  <input
                    type="number"
                    name="height"
                    value={profileForm.height}
                    onChange={handleProfileInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="170"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    体重 (kg)
                  </label>
                  <input
                    type="number"
                    name="weight"
                    value={profileForm.weight}
                    onChange={handleProfileInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="65"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    体重 (kg)
                  </label>
                  <input
                    type="number"
                    name="weight"
                    value={profileForm.weight}
                    onChange={handleProfileInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="65"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  目标体重 (kg)
                </label>
                <input
                  type="number"
                  name="targetWeight"
                  value={profileForm.targetWeight}
                  onChange={handleProfileInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="60"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    年龄
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={profileForm.age}
                    onChange={handleProfileInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="25"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    性别
                  </label>
                  <select
                    name="gender"
                    value={profileForm.gender}
                    onChange={handleProfileInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="male">男</option>
                    <option value="female">女</option>
                    <option value="other">其他</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    日常活动
                  </label>
                  <select
                    name="activityLevel"
                    value={profileForm.activityLevel}
                    onChange={handleProfileInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="sedentary">久坐 (几乎不运动)</option>
                    <option value="light">轻度 (每周1-3次)</option>
                    <option value="moderate">中度 (每周3-5次)</option>
                    <option value="heavy">重度 (每周6-7次)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    健康目标
                  </label>
                  <select
                    name="goal"
                    value={profileForm.goal}
                    onChange={handleProfileInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="lose_weight">减脂</option>
                    <option value="gain_muscle">增肌</option>
                    <option value="maintain">维持</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={profileSaving}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition"
              >
                {profileSaving ? "保存中..." : "保存健康档案"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
