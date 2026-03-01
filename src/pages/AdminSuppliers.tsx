import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Save, Building2, Phone, Mail, User, MapPin, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import { Supplier } from '../types';

export default function AdminSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    corporate_name: '',
    trade_name: '',
    tax_id: '',
    registration: '',
    address: '',
    phone: '',
    email: '',
    rep_name: '',
    description: '',
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const data = await api.suppliers.list();
      setSuppliers(data);
    } catch (err) {
      toast.error('Erro ao carregar fornecedores');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await api.suppliers.update(editingSupplier.id, formData);
        toast.success('Fornecedor atualizado');
      } else {
        await api.suppliers.create(formData);
        toast.success('Fornecedor cadastrado');
      }
      setIsModalOpen(false);
      setEditingSupplier(null);
      resetForm();
      loadSuppliers();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar fornecedor');
    }
  };

  const resetForm = () => {
    setFormData({
      corporate_name: '',
      trade_name: '',
      tax_id: '',
      registration: '',
      address: '',
      phone: '',
      email: '',
      rep_name: '',
      description: '',
    });
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      corporate_name: supplier.corporate_name,
      trade_name: supplier.trade_name || '',
      tax_id: supplier.tax_id,
      registration: supplier.registration || '',
      address: supplier.address || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      rep_name: supplier.rep_name || '',
      description: supplier.description || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este fornecedor?')) return;
    try {
      await api.suppliers.delete(id);
      toast.success('Fornecedor removido');
      loadSuppliers();
    } catch (err) {
      toast.error('Erro ao excluir fornecedor');
    }
  };

  if (loading) return <div className="flex justify-center py-20">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Fornecedores</h2>
          <p className="text-sm text-[#141414]/40 font-medium">Gerencie o cadastro de seus parceiros comerciais.</p>
        </div>
        <button
          onClick={() => {
            setEditingSupplier(null);
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-[#141414] text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold hover:opacity-90 transition-all shadow-sm"
        >
          <Plus size={20} />
          Novo Fornecedor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.map((supplier) => (
          <motion.div
            layout
            key={supplier.id}
            className="bg-white rounded-[32px] border border-[#141414]/5 p-6 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-[#F5F5F0] rounded-2xl flex items-center justify-center text-[#141414]/40 group-hover:bg-[#141414] group-hover:text-white transition-colors">
                <Building2 size={24} />
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(supplier)}
                  className="p-2 hover:bg-[#141414]/5 rounded-lg text-[#141414]/40 hover:text-[#141414] transition-colors"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(supplier.id)}
                  className="p-2 hover:bg-red-50 rounded-lg text-red-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="font-bold text-lg leading-tight">{supplier.trade_name || supplier.corporate_name}</h3>
                <p className="text-xs text-[#141414]/40 font-bold uppercase tracking-widest">{supplier.corporate_name}</p>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-sm text-[#141414]/60">
                  <FileText size={14} className="shrink-0" />
                  <span className="font-medium">CNPJ/CPF: {supplier.tax_id}</span>
                </div>
                {supplier.rep_name && (
                  <div className="flex items-center gap-2 text-sm text-[#141414]/60">
                    <User size={14} className="shrink-0" />
                    <span>{supplier.rep_name}</span>
                  </div>
                )}
                {supplier.phone && (
                  <div className="flex items-center gap-2 text-sm text-[#141414]/60">
                    <Phone size={14} className="shrink-0" />
                    <span>{supplier.phone}</span>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-2 text-sm text-[#141414]/60">
                    <Mail size={14} className="shrink-0" />
                    <span className="truncate">{supplier.email}</span>
                  </div>
                )}
              </div>

              {supplier.description && (
                <p className="text-xs text-[#141414]/40 line-clamp-2 pt-2 italic">
                  "{supplier.description}"
                </p>
              )}
            </div>
          </motion.div>
        ))}
        {suppliers.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-[32px] border border-dashed border-[#141414]/10">
            <Building2 size={48} className="mx-auto text-[#141414]/10 mb-4" />
            <p className="text-[#141414]/40 font-medium">Nenhum fornecedor cadastrado.</p>
          </div>
        )}
      </div>

      {/* Modal */}
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
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-[#141414]/5 flex justify-between items-center bg-[#F5F5F0]/50">
                <h3 className="text-xl font-bold">{editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-[#141414]/5 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 ml-1">Razão Social</label>
                    <input
                      required
                      value={formData.corporate_name}
                      onChange={(e) => setFormData({ ...formData, corporate_name: e.target.value })}
                      className="w-full bg-[#F5F5F0] border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-[#141414]"
                      placeholder="Ex: Empresa de Alimentos LTDA"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 ml-1">Nome Fantasia</label>
                    <input
                      value={formData.trade_name}
                      onChange={(e) => setFormData({ ...formData, trade_name: e.target.value })}
                      className="w-full bg-[#F5F5F0] border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-[#141414]"
                      placeholder="Ex: Alimentos & Cia"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 ml-1">CNPJ / CPF</label>
                    <input
                      required
                      value={formData.tax_id}
                      onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                      className="w-full bg-[#F5F5F0] border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-[#141414]"
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 ml-1">Inscrição Estadual/Municipal</label>
                    <input
                      value={formData.registration}
                      onChange={(e) => setFormData({ ...formData, registration: e.target.value })}
                      className="w-full bg-[#F5F5F0] border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-[#141414]"
                      placeholder="Isento ou Número"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 ml-1">Endereço Completo</label>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-4 top-3.5 text-[#141414]/20" />
                    <input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full bg-[#F5F5F0] border-none rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-[#141414]"
                      placeholder="Rua, Número, Bairro, Cidade - UF"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 ml-1">Telefone</label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-4 top-3.5 text-[#141414]/20" />
                      <input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-[#F5F5F0] border-none rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-[#141414]"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 ml-1">E-mail</label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-4 top-3.5 text-[#141414]/20" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-[#F5F5F0] border-none rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-[#141414]"
                        placeholder="contato@fornecedor.com.br"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 ml-1">Representante Comercial</label>
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-3.5 text-[#141414]/20" />
                    <input
                      value={formData.rep_name}
                      onChange={(e) => setFormData({ ...formData, rep_name: e.target.value })}
                      className="w-full bg-[#F5F5F0] border-none rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-[#141414]"
                      placeholder="Nome do contato principal"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 ml-1">Breve Descrição</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-[#F5F5F0] border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-[#141414] resize-none"
                    placeholder="Produtos fornecidos, condições de pagamento, etc."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#141414] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all mt-4 shadow-lg"
                >
                  <Save size={20} />
                  {editingSupplier ? 'Salvar Alterações' : 'Cadastrar Fornecedor'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
