'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      router.push('/dashboard');
    } else {
      const data = await res.json();
      setError(data.message || 'خطا در ورود');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-blue-200">
        <div className="text-center mb-6">
          <span className="text-4xl">✨</span>
          <h2 className="text-2xl font-bold text-blue-800 mt-2">قالیشویی صداقت</h2>
          <p className="text-gray-500 text-sm mt-1">ورود به پنل مدیریت</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">نام کاربری</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">رمز عبور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none transition"
              required
            />
          </div>
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl text-center">
              {error}
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-linear-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 rounded-xl hover:shadow-lg transition cursor-pointer transform hover:-translate-y-0.5"
          >
            ورود به پنل
          </button>
        </form>
      </div>
    </div>
  );
}