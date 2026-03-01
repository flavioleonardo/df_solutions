import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Save, Package, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import { Product, Brand, Category } from '../types';

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    unit: 'un',
    brand_id: '',
    category_id: '',
    images: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsData, brandsData, categoriesData] = await Promise.all([
        api.products.list(),
        api.brands.list(),
        api.categories.list(),
      ]);
      setProducts(productsData);
      setBrands(brandsData);
      setCategories(categoriesData);
    } catch (err) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.products.update(editingProduct.id, formData);
        toast.success('Produto atualizado!');
      } else {
        await api.products.create(formData);
        toast.success('Produto criado!');
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      loadData();
    } catch (err) {
      toast.error('Erro ao salvar produto');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price || 0,
      unit: product.unit || 'un',
      brand_id: product.brand_id || '',
      category_id: product.category_id || '',
      images: product.images || [],
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
      await api.products.delete(id);
      toast.success('Produto excluído!');
      loadData();
    } catch (err) {
      toast.error('Erro ao excluir produto');
    }
  };

  if (loading) return <div className="flex justify-center py-20">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Produtos</h2>
        <button
          onClick={() => {
            setEditingProduct(null);
            setFormData({
              name: '',
              description: '',
              price: 0,
              unit: 'un',
              brand_id: '',
              category_id: '',
              images: [],
            });
            setIsModalOpen(true);
          }}
          className="bg-[#141414] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Plus size={20} />
          Novo Produto
        </button>
      </div>

      <div className="bg-white rounded-[32px] border border-[#141414]/5 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#F5F5F0] text-[10px] uppercase tracking-widest font-bold text-[#141414]/40">
                <th className="px-6 py-4">Foto</th>
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Marca</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Preço</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#141414]/5">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-[#F5F5F0]/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="w-10 h-10 rounded-lg bg-[#F5F5F0] overflow-hidden border border-[#141414]/5 flex items-center justify-center">
                      {product.images && product.images.length > 0 ? (
                        <img src={product.images[0]} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <Package size={18} className="text-[#141414]/20" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-[#141414]">{product.name}</p>
                    <p className="text-xs text-[#141414]/40 line-clamp-1">{product.description}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#141414]/60">{product.brand_name || '-'}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold bg-[#141414]/5 px-2 py-1 rounded-md text-[#141414]/60">
                      {product.category_name || 'Geral'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-[#141414]">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price || 0)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2 text-[#141414]/40 hover:text-[#141414] hover:bg-[#141414]/5 rounded-xl transition-all"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
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
              className="relative w-full max-w-2xl bg-white rounded-[32px] p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">{editingProduct ? 'Editar' : 'Novo'} Produto</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-[#141414]/5 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 ml-1">Nome</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-[#F5F5F0] border-none rounded-2xl py-4 px-4 focus:ring-2 focus:ring-[#141414] transition-all"
                        placeholder="Nome do produto"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 ml-1">Descrição</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full bg-[#F5F5F0] border-none rounded-2xl py-4 px-4 focus:ring-2 focus:ring-[#141414] transition-all min-h-[100px]"
                        placeholder="Detalhes do produto"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 ml-1">Preço</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                          className="w-full bg-[#F5F5F0] border-none rounded-2xl py-4 px-4 focus:ring-2 focus:ring-[#141414] transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 ml-1">Unidade</label>
                        <input
                          type="text"
                          required
                          value={formData.unit}
                          onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                          className="w-full bg-[#F5F5F0] border-none rounded-2xl py-4 px-4 focus:ring-2 focus:ring-[#141414] transition-all"
                          placeholder="un, kg, lt..."
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 ml-1">Marca</label>
                      <select
                        value={formData.brand_id}
                        onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                        className="w-full bg-[#F5F5F0] border-none rounded-2xl py-4 px-4 focus:ring-2 focus:ring-[#141414] transition-all"
                      >
                        <option value="">Selecione uma marca</option>
                        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 ml-1">Categoria</label>
                      <select
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                        className="w-full bg-[#F5F5F0] border-none rounded-2xl py-4 px-4 focus:ring-2 focus:ring-[#141414] transition-all"
                      >
                        <option value="">Selecione uma categoria</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 ml-1">URL da Imagem</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="image-url"
                      className="flex-1 bg-[#F5F5F0] border-none rounded-2xl py-4 px-4 focus:ring-2 focus:ring-[#141414] transition-all"
                      placeholder="https://exemplo.com/imagem.jpg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('image-url') as HTMLInputElement;
                        if (input.value) {
                          setFormData({ ...formData, images: [...formData.images, input.value] });
                          input.value = '';
                        }
                      }}
                      className="bg-[#141414] text-white px-6 rounded-2xl font-bold"
                    >
                      Adicionar
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {formData.images.map((img, i) => (
                      <div key={i} className="relative group">
                        <img src={img} alt="" className="w-20 h-20 rounded-xl object-cover border border-[#141414]/5" referrerPolicy="no-referrer" />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, images: formData.images.filter((_, idx) => idx !== i) })}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#141414] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity mt-4"
                >
                  <Save size={18} />
                  {editingProduct ? 'Salvar Alterações' : 'Criar Produto'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
