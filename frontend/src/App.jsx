import React, { useState, useEffect } from 'react';
import { getToken, getUserProfile } from './utils/api';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import FoodLog from './pages/FoodLog';
import Recommend from './pages/Recommend';

export default function App() {
    const [user, setUser] = useState(null);
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [loading, setLoading] = useState(true);

    // 页面加载时检查登录状态
    useEffect(() => {
        const checkAuth = async () => {
            const token = getToken();
            if (token) {
                try {
                    const userData = await getUserProfile();
                    setUser(userData);
                } catch (error) {
                    console.error('获取用户信息失败:', error);
                    // Token可能过期,清除
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    // 监听URL hash变化
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.slice(1) || 'dashboard';
            setCurrentPage(hash);
        };

        window.addEventListener('hashchange', handleHashChange);
        handleHashChange(); // 初始化

        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const handleLoginSuccess = (userData) => {
        setUser(userData);
        setCurrentPage('dashboard');
    };

    const handleNavigate = (page) => {
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
            {currentPage === 'dashboard' && <Dashboard user={user} onNavigate={handleNavigate} />}
            {currentPage === 'profile' && <Profile user={user} onNavigate={handleNavigate} />}
            {currentPage === 'food-log' && <FoodLog user={user} onNavigate={handleNavigate} />}
            {currentPage === 'recommend' && <Recommend user={user} onNavigate={handleNavigate} />}
        </>
    );
}