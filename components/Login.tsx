import React, { useState } from 'react';
import { dataService } from '../services/mockData';

const BRAND_LOGO_URL = "https://www.naturals.in/wp-content/uploads/2023/04/Naturals-Logo.png";

export const Login: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = dataService.login(username, password);
    if (user) {
      onLogin();
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <img 
            src={BRAND_LOGO_URL} 
            alt="Naturals Brand Logo" 
            className="w-full max-w-[240px] h-auto object-contain mx-auto mb-8"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://placehold.co/600x180/7C3AED/white?text=NATURALS";
            }}
          />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Salon Management System</p>
        </div>

        <div className="bg-white p-10 rounded-3xl shadow-xl shadow-slate-200 border border-slate-100">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Username</label>
              <input 
                type="text" 
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-medium"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Password</label>
              <input 
                type="password" 
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-medium"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && <p className="text-rose-500 text-xs font-bold text-center">{error}</p>}

            <button 
              type="submit"
              className="w-full py-4 bg-[#7C3AED] text-white font-bold rounded-2xl shadow-xl shadow-purple-200 hover:bg-[#6D28D9] transition-all hover:-translate-y-1"
            >
              Secure Access
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-50 text-center">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
              Demo credentials: <br/>
              <span className="text-slate-900 font-bold">super / 123</span> | <span className="text-slate-900 font-bold">admin / 123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};