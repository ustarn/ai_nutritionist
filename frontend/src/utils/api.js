// src/utils/api.js - API工具函数
const API_BASE = 'http://localhost:3000';

// Token 管理
export const getToken = () => localStorage.getItem('token');
export const saveToken = (token) => localStorage.setItem('token', token);
export const removeToken = () => localStorage.removeItem('token');

// 通用 API 请求
export async function apiRequest(endpoint, options = {}) {
    const token = getToken();

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...defaultOptions,
        ...options,
        headers: { ...defaultOptions.headers, ...options.headers }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || '请求失败');
    }

    return data;
}

// 登录
export async function login(username, password) {
    const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
    });
    saveToken(data.token);
    return data;
}

// 注册
export async function register(username, password) {
    const data = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password })
    });
    saveToken(data.token);
    return data;
}

// 获取用户信息
export async function getUserProfile() {
    return await apiRequest('/api/user/profile');
}

// 登出
export function logout() {
    removeToken();
    window.location.href = '/';
}