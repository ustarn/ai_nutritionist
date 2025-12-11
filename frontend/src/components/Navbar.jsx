// src/components/Navbar.jsx - 导航栏组件
import React from 'react';
import { logout } from '../utils/api';

export default function Navbar({ currentPage, username }) {
    const navItems = [
        { name: '主页', path: 'dashboard', icon: '🏠' },
        { name: '健康档案', path: 'profile', icon: '📋' },
        { name: '饮食记录', path: 'food-log', icon: '🍽️' },
        { name: '食物库', path: 'food-library', icon: '📚' },
        { name: 'AI推荐', path: 'recommend', icon: '🤖' }
    ];

    const handleLogout = () => {
        if (window.confirm('确定要退出登录吗?')) {
            logout();
        }
    };

    return (
        <nav className="bg-white shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center space-x-2">
                        <span className="text-3xl">🥗</span>
                        <span className="text-2xl font-bold text-green-600">AI营养师</span>
                    </div>

                    {/* 导航链接 */}
                    <div className="hidden md:flex items-center space-x-1">
                        {navItems.map((item) => (
                            <button
                                key={item.path}
                                onClick={() => window.location.hash = item.path}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                    currentPage === item.path
                                        ? 'bg-green-100 text-green-700'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <span className="mr-1">{item.icon}</span>
                                {item.name}
                            </button>
                        ))}
                    </div>

                    {/* 用户信息和退出 */}
                    <div className="flex items-center space-x-4">
            <span className="text-gray-700 font-medium hidden sm:block">
              👤 {username}
            </span>
                        <button
                            onClick={handleLogout}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            退出
                        </button>
                    </div>
                </div>

                {/* 移动端导航 */}
                <div className="md:hidden flex justify-around py-2 border-t">
                    {navItems.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => window.location.hash = item.path}
                            className={`flex flex-col items-center px-3 py-1 rounded-lg ${
                                currentPage === item.path
                                    ? 'text-green-600 bg-green-50'
                                    : 'text-gray-600'
                            }`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span className="text-xs mt-1">{item.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </nav>
    );
}