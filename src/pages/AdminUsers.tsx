import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Save, Users, Mail, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import { User, Company } from '../types';

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    company_id: '',
  });

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersData, companiesData] = await Promise.all([
        api.users.list(),
        api.companies.list(),
      ]);
      setUsers(usersData);
      setCompanies(companiesData);
    } catch (err) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const { password, ...updateData } = formData;
        await api.users.update(editingUser.id, password ? formData : updateData);
        toast.success('Usuário atualizado!');
      } else {
        await api.users.create(formData);
        toast.success('Usuário criado!');
      }
      setIsModalOpen(false);
      setEditingUser(null);
      loadData();
    } catch (err) {
      toast.error('Erro ao salvar usuário');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      company_id: user.company_id || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (id === currentUser.id) {
      toast.error('Você não pode excluir seu próprio usuário');
      return;
    }
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    try {
      await api.users.delete(id);
      toast.success('Usuário excluído!');
      loadData();
    } catch (err) {
      toast.error('Erro ao excluir usuário');
    }
  };

  if (loading) return <div className="flex justify-center py-20">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Usuários</h2>
        <button
          onClick={() => {
            setEditingUser(null);
            setFormData({ name: '', email: '', password: '', role: 'user', company_id: '' });
            setIsModalOpen(true);
          }}
          className="bg-[#141414] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Plus size={20} />
          Novo Usuário
        </button>
      </div>

      <div className="bg-white rounded-[32px] border border-[#141414]/5 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#F5F5F0] text-[10px] uppercase tracking-widest font-bold text-[#141414]/40">
              <th className="px-6 py-4">Usuário</th>
              <th className="px-6 py-4">Empresa</th>
              <th className="px-6 py-4">Função</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#141414]/5">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-[#F5F5F0]/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#141414]/5 rounded-xl flex items-center justify-center text-[#141414]/40">
                      <Users size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-[#141414]">{user.name}</p>
                      <p className="text-xs text-[#141414]/40">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-[#141414]/60">{user.company_name || '-'}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md",
                    user.role === 'superadmin' ? "bg-purple-100 text-purple-600" :
                    user.role === 'admin' ? "bg-blue-100 text-blue-600" :
                    "bg-[#141414]/5 text-[#141414]/60"
                  )}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="p-2 text-[#141414]/40 hover:text-[#141414] hover:bg-[#141414]/5 rounded-xl transition-all"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-[#141414]/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">{editingUser ? 'Editar' : 'Novo'} Usuário</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-[#141414]/5 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 ml-1">Nome</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#F5F5F0] border-none rounded-2xl py-4 px-4 focus:ring-2 focus:ring-[#141414] transition-all"
                    placeholder="Nome completo"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 ml-1">E-mail</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#F5F5F0] border-none rounded-2xl py-4 px-4 focus:ring-2 focus:ring-[#141414] transition-all"
                    placeholder="seu@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 ml-1">
                    Senha {editingUser && '(deixe em branco para manter)'}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-[#F5F5F0] border-none rounded-2xl py-4 px-4 focus:ring-2 focus:ring-[#141414] transition-all"
                    placeholder="••••••••"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 ml-1">Função</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full bg-[#F5F5F0] border-none rounded-2xl py-4 px-4 focus:ring-2 focus:ring-[#141414] transition-all"
                    >
                      <option value="user">Usuário</option>
                      <option value="admin">Admin</option>
                      {currentUser.role === 'superadmin' && <option value="superadmin">Super Admin</option>}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 ml-1">Empresa</label>
                    <select
                      value={formData.company_id}
                      onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                      className="w-full bg-[#F5F5F0] border-none rounded-2xl py-4 px-4 focus:ring-2 focus:ring-[#141414] transition-all"
                    >
                      <option value="">Selecione uma empresa</option>
                      {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#141414] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity mt-4"
                >
                  <Save size={18} />
                  {editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
