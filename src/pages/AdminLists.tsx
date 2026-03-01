import React, { useState, useEffect } from 'react';
import { ClipboardList, Calendar, User, ChevronRight, X, Download, Building2, Copy, CheckCircle2, Package, Trash2, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import { ShoppingList, Supplier, Product } from '../types';
import { generatePDF } from '../utils/pdfGenerator';

export default function AdminLists() {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedList, setSelectedList] = useState<ShoppingList | null>(null);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [duplicateCart, setDuplicateCart] = useState<{ product_id: string; quantity: number }[]>([]);
  const [duplicateSupplier, setDuplicateSupplier] = useState('');

  useEffect(() => {
    loadLists();
    loadSuppliers();
    loadProducts();
  }, []);

  const loadLists = async () => {
    try {
      const data = await api.lists.list();
      setLists(data);
    } catch (err) {
      toast.error('Erro ao carregar histórico');
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const data = await api.suppliers.list();
      setSuppliers(data);
    } catch (err) {}
  };

  const loadProducts = async () => {
    try {
      const data = await api.products.list();
      setProducts(data);
    } catch (err) {}
  };

  const startDuplication = (list: ShoppingList) => {
    if (!list.items) return;
    
    // Pre-fill duplicate cart with items from the list
    const items = list.items.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity
    }));
    
    setDuplicateCart(items);
    setDuplicateSupplier(list.supplier_id || '');
    setIsDuplicateModalOpen(true);
    setSelectedList(null); // Close details modal if open
  };

  const finalizeDuplication = async () => {
    if (!duplicateSupplier) {
      toast.error('Selecione um fornecedor');
      return;
    }
    if (duplicateCart.length === 0) {
      toast.error('A lista está vazia');
      return;
    }

    try {
      await api.lists.create(duplicateCart, duplicateSupplier);
      toast.success('Nova lista criada com sucesso!');
      setIsDuplicateModalOpen(false);
      loadLists();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao duplicar lista');
    }
  };

  const updateDuplicateQuantity = (productId: string, delta: number) => {
    setDuplicateCart(prev => {
      const existing = prev.find(item => item.product_id === productId);
      if (!existing) return prev;

      const newQuantity = Math.max(0, existing.quantity + delta);
      if (newQuantity === 0) {
        return prev.filter(item => item.product_id !== productId);
      }

      return prev.map(item => 
        item.product_id === productId ? { ...item, quantity: newQuantity } : item
      );
    });
  };

  const viewDetails = async (id: string) => {
    try {
      const data = await api.lists.get(id);
      setSelectedList(data);
    } catch (err) {
      toast.error('Erro ao carregar detalhes');
    }
  };

  const getShareText = (list: ShoppingList) => {
    const date = new Date(list.created_at).toLocaleDateString('pt-BR');
    return `Lista - ${date}`;
  };

  const sharePDF = async (list: ShoppingList) => {
    try {
      const doc = generatePDF(list);
      const pdfBlob = doc.output('blob');
      const date = new Date(list.created_at).toLocaleDateString('pt-BR').replace(/\//g, '-');
      const fileName = `lista-${date}.pdf`;
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: getShareText(list),
          text: getShareText(list),
        });
      } else {
        doc.save(fileName);
        toast.success('PDF baixado! Compartilhe o arquivo manualmente.');
      }
    } catch (err) {
      console.error('Error sharing PDF:', err);
      toast.error('Erro ao compartilhar PDF');
    }
  };

  const downloadPDF = (list: ShoppingList) => {
    try {
      const doc = generatePDF(list);
      const date = new Date(list.created_at).toLocaleDateString('pt-BR').replace(/\//g, '-');
      doc.save(`lista-${date}.pdf`);
      toast.success('PDF gerado com sucesso!');
    } catch (err) {
      toast.error('Erro ao gerar PDF');
    }
  };

  if (loading) return <div className="flex justify-center py-20">Carregando...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Histórico de Listas</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {lists.map((list) => (
          <motion.div
            key={list.id}
            whileHover={{ y: -4 }}
            className="bg-white p-6 rounded-[24px] border border-[#141414]/5 shadow-sm cursor-pointer group"
            onClick={() => viewDetails(list.id)}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-[#141414]/5 rounded-xl flex items-center justify-center text-[#141414]/40 group-hover:bg-[#141414] group-hover:text-white transition-all">
                <ClipboardList size={24} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/30">
                ID: {list.id}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[#141414]/60">
                <Calendar size={14} />
                <span className="text-sm font-medium">
                  {new Date(list.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[#141414]/60">
                <User size={14} />
                <span className="text-sm font-medium">{list.user_name}</span>
              </div>
              {list.supplier_name && (
                <div className="flex items-center gap-2 text-[#141414]/60">
                  <Building2 size={14} />
                  <span className="text-sm font-medium text-[#141414]">{list.supplier_name}</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-[#141414]/5">
              <span className="text-xs font-bold text-[#141414]/40 uppercase tracking-wider">Ver Detalhes</span>
              <ChevronRight size={18} className="text-[#141414]/20 group-hover:text-[#141414] transition-colors" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedList && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedList(null)}
              className="absolute inset-0 bg-[#141414]/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-[#141414]/5 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">Detalhes da Lista</h3>
                  <div className="flex flex-col mt-1">
                    <p className="text-xs text-[#141414]/40 font-bold uppercase tracking-widest">
                      Gerada por {selectedList.user_name}
                    </p>
                    {selectedList.supplier_name && (
                      <p className="text-xs text-[#141414] font-bold uppercase tracking-widest flex items-center gap-1 mt-0.5">
                        <Building2 size={10} />
                        Fornecedor: {selectedList.supplier_name}
                      </p>
                    )}
                  </div>
                </div>
                <button onClick={() => setSelectedList(null)} className="p-2 hover:bg-[#141414]/5 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {selectedList.items?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-[#F5F5F0] rounded-2xl">
                    <div className="flex flex-col">
                      <span className="font-bold">{item.product_name}</span>
                      <span className="text-[10px] font-bold text-[#141414]/40 uppercase tracking-widest">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price || 0)} / {item.unit}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-bold bg-[#141414]/5 px-3 py-1 rounded-lg text-[#141414]/60">
                        {item.quantity} {item.unit}
                      </span>
                      <span className="text-xs font-bold text-[#141414] mt-1">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((item.price || 0) * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-6 py-4 border-t border-[#141414]/5 bg-white flex justify-between items-center">
                <span className="text-sm font-bold text-[#141414]/40 uppercase tracking-widest">Total Estimado</span>
                <span className="text-xl font-black text-[#141414]">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    selectedList.items?.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0) || 0
                  )}
                </span>
              </div>

              <div className="p-6 bg-[#F5F5F0] flex gap-3">
                <button
                  onClick={() => sharePDF(selectedList)}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                >
                  <Share2 size={20} />
                  Compartilhar
                </button>
                <button
                  onClick={() => startDuplication(selectedList)}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#141414] text-white py-4 rounded-2xl font-bold hover:opacity-90 transition-opacity"
                >
                  <Copy size={20} />
                  Duplicar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Duplicate Modal */}
      <AnimatePresence>
        {isDuplicateModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDuplicateModalOpen(false)}
              className="absolute inset-0 bg-[#141414]/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-[#141414]/5 flex justify-between items-center bg-[#F5F5F0]/50">
                <div>
                  <h3 className="text-xl font-bold">Nova Lista (Duplicada)</h3>
                  <p className="text-xs text-[#141414]/40 font-bold uppercase tracking-widest mt-1">
                    Os preços foram atualizados automaticamente
                  </p>
                </div>
                <button onClick={() => setIsDuplicateModalOpen(false)} className="p-2 hover:bg-[#141414]/5 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {duplicateCart.map((item) => {
                  const product = products.find(p => p.id === item.product_id);
                  if (!product) return null;
                  
                  return (
                    <div key={item.product_id} className="flex items-center justify-between p-4 bg-[#F5F5F0] rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-[#141414]/10 overflow-hidden">
                          {product.images && product.images.length > 0 ? (
                            <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package size={20} />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm">{product.name}</h4>
                          <p className="text-[10px] text-[#141414]/40 uppercase tracking-wider font-bold">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price || 0)} / {product.unit}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-white rounded-lg p-1">
                          <button 
                            onClick={() => updateDuplicateQuantity(item.product_id, -1)}
                            className="w-6 h-6 flex items-center justify-center hover:bg-[#F5F5F0] rounded"
                          >
                            <X size={12} className="text-red-500" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                          <button 
                            onClick={() => updateDuplicateQuantity(item.product_id, 1)}
                            className="w-6 h-6 flex items-center justify-center hover:bg-[#F5F5F0] rounded"
                          >
                            <ChevronRight size={12} className="rotate-90" />
                          </button>
                        </div>
                        <button 
                          onClick={() => updateDuplicateQuantity(item.product_id, -item.quantity)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="px-6 py-4 border-t border-[#141414]/5 bg-white flex justify-between items-center">
                <span className="text-sm font-bold text-[#141414]/40 uppercase tracking-widest">Novo Total</span>
                <span className="text-xl font-black text-[#141414]">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    duplicateCart.reduce((acc, item) => {
                      const product = products.find(p => p.id === item.product_id);
                      return acc + (product?.price || 0) * item.quantity;
                    }, 0)
                  )}
                </span>
              </div>

              <div className="px-6 py-4 border-t border-[#141414]/5 bg-[#F5F5F0]/50 space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 ml-1">Alterar Fornecedor (Opcional)</label>
                <select
                  value={duplicateSupplier}
                  onChange={(e) => setDuplicateSupplier(e.target.value)}
                  className="w-full bg-white border-none rounded-2xl py-3 px-4 shadow-sm focus:ring-2 focus:ring-[#141414] font-medium"
                >
                  <option value="">Selecione um fornecedor...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.trade_name || s.corporate_name}</option>
                  ))}
                </select>
              </div>

              <div className="p-6 bg-[#F5F5F0]">
                <button
                  onClick={finalizeDuplication}
                  className="w-full flex items-center justify-center gap-2 bg-[#141414] text-white py-4 rounded-2xl font-bold hover:opacity-90 transition-opacity"
                >
                  <CheckCircle2 size={20} />
                  Confirmar Nova Lista
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
