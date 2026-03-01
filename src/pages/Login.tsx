import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Lock, Mail, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.auth.login(email, password);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      toast.success('Bem-vindo!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[32px] p-8 shadow-sm border border-[#141414]/5"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#141414] rounded-2xl flex items-center justify-center text-white mb-4 shadow-xl">
            <ShoppingCart size={32} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">DF Solutions</h1>
          <p className="text-[#141414]/40 text-sm font-medium">Faça login para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 ml-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#141414]/20" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#F5F5F0] border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-[#141414] transition-all"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#141414]/20" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#F5F5F0] border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-[#141414] transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#141414] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 mt-4"
          >
            {loading ? 'Entrando...' : 'Entrar'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
