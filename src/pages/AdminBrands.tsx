import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Save, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import { Brand } from '../types';

export default function AdminBrands() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState({
    name: '',
  });

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      const data = await api.brands.list();
      setBrands(data);
    } catch (err) {
      toast.error('Erro ao carregar marcas');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBrand) {
        await api.brands.update(editingBrand.id, formData);
        toast.success('Marca atualizada!');
      } else {
        await api.brands.create(formData);
        toast.success('Marca criada!');
      }
      setIsModalOpen(false);
      setEditingBrand(null);
      setFormData({ name: '' });
      loadBrands();
    } catch (err) {
      toast.error('Erro ao salvar marca');
    }
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({ name: brand.name });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta marca?')) return;
    try {
      await api.brands.delete(id);
      toast.success('Marca excluída!');
      loadBrands();
    } catch (err) {
      toast.error('Erro ao excluir marca');
    }
  };

  if (loading) return <div className="flex justify-center py-20">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Marcas</h2>
        <button
          onClick={() => {
            setEditingBrand(null);
            setFormData({ name: '' });
            setIsModalOpen(true);
          }}
          className="bg-[#141414] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Plus size={20} />
          Nova Marca
        </button>
      </div>

      <div className="bg-white rounded-[32px] border border-[#141414]/5 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#F5F5F0] text-[10px] uppercase tracking-widest font-bold text-[#141414]/40">
              <th className="px-6 py-4">Nome</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#141414]/5">
            {brands.map((brand) => (
              <tr key={brand.id} className="hover:bg-[#F5F5F0]/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#141414]/5 rounded-lg flex items-center justify-center text-[#141414]/40">
                      <ClipboardList size={16} />
                    </div>
                    <span className="font-bold text-[#141414]">{brand.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(brand)}
                      className="p-2 text-[#141414]/40 hover:text-[#141414] hover:bg-[#141414]/5 rounded-xl transition-all"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(brand.id)}
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
                <h3 className="text-xl font-bold">{editingBrand ? 'Editar' : 'Nova'} Marca</h3>
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
                    placeholder="Ex: Coca-Cola"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#141414] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity mt-4"
                >
                  <Save size={18} />
                  {editingBrand ? 'Salvar Alterações' : 'Criar Marca'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
