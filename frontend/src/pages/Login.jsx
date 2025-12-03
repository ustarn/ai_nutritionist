// src/pages/Login.jsx - 登录/注册页
import React, { useState } from 'react';
import { login, register } from '../utils/api';

export default function Login({ onLoginSuccess }) {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!username || !password) {
            setMessage({ type: 'error', text: '用户名和密码不能为空' });
            return;
        }

        if (username.length < 3) {
            setMessage({ type: 'error', text: '用户名至少需要3个字符' });
            return;
        }

        if (password.length < 6) {
            setMessage({ type: 'error', text: '密码至少需要6个字符' });
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            const data = isLogin
                ? await login(username, password)
                : await register(username, password);

            setMessage({ type: 'success', text: data.message });
            setTimeout(() => {
                onLoginSuccess(data.user);
            }, 500);
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                {/* 标题 */}
                <div className="text-center mb-8">
                    <div className="text-6xl mb-4">🥗</div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        AI营养师
                    </h1>
                    <p className="text-gray-600">
                        {isLogin ? '登录您的账号' : '创建新账号'}
                    </p>
                </div>

                {/* 表单 */}
                <div className="space-y-5" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            用户名
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                            placeholder="请输入用户名(3-20个字符)"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            密码
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                            placeholder="请输入密码(至少6个字符)"
                            disabled={loading}
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={loading || !username || !password}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setMessage('');
                        }}
                        className="w-full text-green-600 hover:text-green-700 font-medium py-2"
                        disabled={loading}
                    >
                        {isLogin ? '还没账号? 去注册' : '已有账号? 去登录'}
                    </button>
                </div>

                {/* 消息提示 */}
                {message && (
                    <div className={`mt-4 p-3 rounded-lg text-sm ${
                        message.type === 'success'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                    }`}>
                        {message.text}
                    </div>
                )}

                {/* 测试提示 */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg text-xs text-gray-600">
                    <p className="font-semibold mb-1">💡 快速测试:</p>
                    <p>用户名: testuser</p>
                    <p>密码: 123456</p>
                    <p className="mt-2 text-gray-500">提示: 首次使用请先注册</p>
                </div>
            </div>
        </div>
    );
}