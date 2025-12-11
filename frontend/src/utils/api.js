// src/utils/api.js - API工具函数
const API_BASE = "http://localhost:3000";

// Token 管理
export const getToken = () => localStorage.getItem("token");
export const saveToken = (token) => localStorage.setItem("token", token);
export const removeToken = () => localStorage.removeItem("token");

// 通用 API 请求
export async function apiRequest(endpoint, options = {}) {
  const token = getToken();

  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...defaultOptions,
    ...options,
    headers: { ...defaultOptions.headers, ...options.headers },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "请求失败");
  }

  return data;
}

// 登录
export async function login(username, password) {
  const data = await apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  saveToken(data.token);
  return data;
}

// 注册
export async function register(username, password) {
  const data = await apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  saveToken(data.token);
  return data;
}

// 获取用户信息
export async function getUserProfile() {
  return await apiRequest("/api/user/profile");
}

// 获取健康档案
export async function getHealthProfile() {
  return await apiRequest("/api/health-profile");
}

// 保存健康档案（创建或更新）
export async function saveHealthProfile(profile) {
  const data = await apiRequest("/api/health-profile", {
    method: "PUT",
    body: JSON.stringify(profile),
  });
  // 健康档案变更后，清除 AI 评估缓存
  try {
    removeHealthAssessmentCache();
  } catch (e) {}
  return data;
}

// 登出
export function logout() {
  removeToken();
  window.location.href = "/";
}

// 获取今日营养摄入汇总
export async function getTodayNutrition() {
  return await apiRequest("/api/nutrition/today");
}

// --------- 健康评估缓存 ---------
const HEALTH_ASSESSMENT_CACHE_KEY = "health_assessment_cache_v1";
const HEALTH_ASSESSMENT_TTL_MS = 5 * 60 * 1000; // 5 分钟

function readHealthAssessmentCache() {
  try {
    const raw = localStorage.getItem(HEALTH_ASSESSMENT_CACHE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj.timestamp || !obj.data) return null;
    if (Date.now() - obj.timestamp > HEALTH_ASSESSMENT_TTL_MS) {
      localStorage.removeItem(HEALTH_ASSESSMENT_CACHE_KEY);
      return null;
    }
    return obj.data;
  } catch (e) {
    console.warn("读取健康评估缓存失败", e);
    return null;
  }
}

function writeHealthAssessmentCache(data) {
  try {
    const obj = { timestamp: Date.now(), data };
    localStorage.setItem(HEALTH_ASSESSMENT_CACHE_KEY, JSON.stringify(obj));
  } catch (e) {
    console.warn("写入健康评估缓存失败", e);
  }
}

export function removeHealthAssessmentCache() {
  try {
    localStorage.removeItem(HEALTH_ASSESSMENT_CACHE_KEY);
  } catch (e) {}
}

// 获取AI健康评估（带本地缓存以避免短时间内重复慢请求）
export async function getHealthAssessment() {
  const cached = readHealthAssessmentCache();
  if (cached) return cached;

  const data = await apiRequest("/api/health/assessment");
  try {
    writeHealthAssessmentCache(data);
  } catch (e) {}
  return data;
}

// ---- 体重相关 ----
export async function createWeightLog({ weight, logDate, note }) {
  return await apiRequest("/api/weight-logs", {
    method: "POST",
    body: JSON.stringify({ weight, logDate, note }),
  });
}

export async function getWeightLogs({ startDate, endDate, limit } = {}) {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  if (limit) params.append("limit", limit);
  const query = params.toString();
  return await apiRequest(`/api/weight-logs${query ? `?${query}` : ""}`);
}

export async function getWeightSummary() {
  return await apiRequest("/api/weight/summary");
}

// 连续打卡
export async function getStreak() {
  return await apiRequest("/api/streak");
}

// 搜索食物
export async function searchFoods(query, category) {
  const params = new URLSearchParams();
  if (query) params.append("q", query);
  if (category) params.append("category", category);
  return await apiRequest(`/api/foods/search?${params.toString()}`);
}

// 获取食物分类
export async function getFoodCategories() {
  return await apiRequest("/api/foods/categories");
}

// 获取食物详情
export async function getFoodDetail(id) {
  return await apiRequest(`/api/foods/${id}`);
}

// 创建食物
export async function createFood(foodData) {
  return await apiRequest("/api/foods", {
    method: "POST",
    body: JSON.stringify(foodData),
  });
}

// AI计算营养信息
export async function calculateNutritionWithAI(foodDescription) {
  return await apiRequest("/api/ai/calculate-nutrition", {
    method: "POST",
    body: JSON.stringify({ foodDescription }),
  });
}

// 创建饮食记录
export async function createFoodLog(logData) {
  const data = await apiRequest("/api/food-logs", {
    method: "POST",
    body: JSON.stringify(logData),
  });
  // 新饮食记录会影响 AI 评估，清除缓存
  try {
    removeHealthAssessmentCache();
  } catch (e) {}
  return data;
}

// 获取今日饮食记录
export async function getTodayFoodLogs() {
  return await apiRequest("/api/food-logs/today");
}

// 获取历史饮食记录（可按日期范围）
export async function getFoodLogs({ startDate, endDate, limit } = {}) {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  if (limit) params.append("limit", limit);

  const query = params.toString();
  const url = `/api/food-logs${query ? `?${query}` : ""}`;
  return await apiRequest(url);
}

// 删除饮食记录
export async function deleteFoodLog(id) {
  const data = await apiRequest(`/api/food-logs/${id}`, {
    method: "DELETE",
  });
  // 删除记录也可能影响评估，清除缓存
  try {
    removeHealthAssessmentCache();
  } catch (e) {}
  return data;
}
