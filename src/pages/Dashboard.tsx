import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, Send, Trash2, CheckCircle2, ShoppingCart, X, ChevronLeft, ChevronRight, Package, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import { Product, Brand, Category, Company, Supplier } from '../types';
import { generatePDF } from '../utils/pdfGenerator';

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsData, brandsData, categoriesData, companyData, suppliersData] = await Promise.all([
        api.products.list(),
        api.brands.list(),
        api.categories.list(),
        api.company.getMe(),
        api.suppliers.list()
      ]);
      setProducts(productsData);
      setBrands(brandsData);
      setCategories(categoriesData);
      setCompany(companyData);
      setSuppliers(suppliersData);
    } catch (err) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: next };
    });
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || p.category_id === selectedCategory;
    const matchesBrand = !selectedBrand || p.brand_id === selectedBrand;
    return matchesSearch && matchesCategory && matchesBrand;
  });

  const cartItems = Object.entries(cart).map(([id, quantity]) => {
    const product = products.find(p => p.id === id);
    return { ...product, quantity };
  }).filter(item => item.id);

  const getShareText = () => {
    const date = new Date().toLocaleDateString('pt-BR');
    return `Lista - ${date}`;
  };

  const sharePDF = async () => {
    if (!company) return;
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    const listData: any = {
      id: 'PREVIEW',
      company_id: company.id,
      company_name: company.name,
      user_name: user?.name || 'Usuário',
      supplier_name: suppliers.find(s => s.id === selectedSupplier)?.trade_name || suppliers.find(s => s.id === selectedSupplier)?.corporate_name,
      created_at: new Date().toISOString(),
      items: cartItems.map(item => ({
        product_name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        price: item.price
      }))
    };

    try {
      const doc = generatePDF(listData);
      const pdfBlob = doc.output('blob');
      const date = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
      const fileName = `lista-${date}.pdf`;
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: getShareText(),
          text: getShareText(),
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

  const downloadPDF = () => {
    if (!company) return;
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    const listData: any = {
      id: 'PREVIEW',
      company_id: company.id,
      company_name: company.name,
      user_name: user?.name || 'Usuário',
      supplier_name: suppliers.find(s => s.id === selectedSupplier)?.trade_name || suppliers.find(s => s.id === selectedSupplier)?.corporate_name,
      created_at: new Date().toISOString(),
      items: cartItems.map(item => ({
        product_name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        price: item.price
      }))
    };

    try {
      const doc = generatePDF(listData);
      const date = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
      doc.save(`lista-${date}.pdf`);
      toast.success('PDF gerado com sucesso!');
    } catch (err) {
      toast.error('Erro ao gerar PDF');
    }
  };


  const finalizeList = async () => {
    if (!selectedSupplier) {
      toast.error('Por favor, selecione um fornecedor');
      return;
    }
    try {
      const items = cartItems.map(item => ({ product_id: item.id!, quantity: item.quantity }));
      console.log('Finalizing list with items:', items, 'Supplier:', selectedSupplier);
      await api.lists.create(items, selectedSupplier);
      toast.success('Lista salva com sucesso!');
      setCart({});
      setSelectedSupplier('');
      setIsSummaryOpen(false);
    } catch (err: any) {
      console.error('Error finalizing list:', err);
      toast.error(err.message || 'Erro ao salvar lista');
    }
  };

  if (loading) return <div className="flex justify-center py-20">Carregando...</div>;

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Produtos</h2>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#141414]/30" size={18} />
            <input
              type="text"
              placeholder="Buscar produto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border-none rounded-2xl py-3 pl-12 pr-4 shadow-sm focus:ring-2 focus:ring-[#141414] transition-all"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white border-none rounded-xl py-2 px-4 text-sm font-medium shadow-sm focus:ring-2 focus:ring-[#141414]"
          >
            <option value="">Todas Categorias</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="bg-white border-none rounded-xl py-2 px-4 text-sm font-medium shadow-sm focus:ring-2 focus:ring-[#141414]"
          >
            <option value="">Todas Marcas</option>
            {brands.map(brand => (
              <option key={brand.id} value={brand.id}>{brand.name}</option>
            ))}
          </select>

          {(selectedCategory || selectedBrand || search) && (
            <button
              onClick={() => {
                setSelectedCategory('');
                setSelectedBrand('');
                setSearch('');
              }}
              className="text-xs font-bold text-[#141414]/40 hover:text-[#141414] transition-colors"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-[32px] border border-[#141414]/5 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#F5F5F0] text-[10px] uppercase tracking-widest font-bold text-[#141414]/40">
                <th className="px-6 py-4">Foto</th>
                <th className="px-6 py-4">Produto</th>
                <th className="px-6 py-4">Marca</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Preço</th>
                <th className="px-6 py-4">Unidade</th>
                <th className="px-6 py-4 text-center">Quantidade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#141414]/5">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-[#F5F5F0]/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="relative group/img">
                      <div className="w-12 h-12 rounded-lg bg-[#F5F5F0] overflow-hidden border border-[#141414]/5 flex items-center justify-center">
                        {Array.isArray(product.images) && product.images.length > 0 ? (
                          <img src={product.images[0]} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#141414]/10">
                            <Package size={20} />
                          </div>
                        )}
                      </div>
                      {Array.isArray(product.images) && product.images.length > 0 && (
                        <div className="absolute left-full ml-4 top-0 z-[70] hidden group-hover/img:block pointer-events-none">
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-64 h-64 rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-white"
                          >
                            <img src={product.images[0]} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </motion.div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-bold text-[#141414]">{product.name}</p>
                      <p className="text-xs text-[#141414]/40 line-clamp-1">{product.description}</p>
                    </div>
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
                  <td className="px-6 py-4 text-sm text-[#141414]/60">{product.unit || 'un'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center bg-[#F5F5F0] p-1 rounded-xl w-fit mx-auto">
                      <button
                        onClick={() => updateQuantity(product.id, -1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white transition-colors text-[#141414]"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="font-bold text-sm w-8 text-center">
                        {cart[product.id] || 0}
                      </span>
                      <button
                        onClick={() => updateQuantity(product.id, 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white transition-colors text-[#141414]"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {cartItems.length > 0 && (
          <motion.button
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            onClick={() => setIsSummaryOpen(true)}
            className="fixed bottom-8 right-8 bg-[#141414] text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 font-bold hover:scale-105 active:scale-95 transition-all z-50"
          >
            <div className="relative">
              <ShoppingCart size={24} />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#141414]">
                {cartItems.length}
              </span>
            </div>
            Ver Lista
          </motion.button>
        )}
      </AnimatePresence>

      {/* Summary Modal */}
      <AnimatePresence>
        {isSummaryOpen && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSummaryOpen(false)}
              className="absolute inset-0 bg-[#141414]/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-[#141414]/5 flex justify-between items-center">
                <h3 className="text-xl font-bold">Resumo da Lista</h3>
                <button onClick={() => setIsSummaryOpen(false)} className="p-2 hover:bg-[#141414]/5 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-[#F5F5F0] rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-xl overflow-hidden flex-shrink-0">
                        {Array.isArray(item.images) && item.images.length > 0 ? (
                          <img src={item.images[0]} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#141414]/10">
                            <Package size={20} />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold">{item.name}</h4>
                        <p className="text-[10px] text-[#141414]/40 uppercase tracking-wider font-bold">
                          {item.quantity} {item.unit || 'un'} × {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price || 0)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-[#141414]">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((item.price || 0) * item.quantity)}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id!, -item.quantity)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-6 py-4 border-t border-[#141414]/5 bg-white flex justify-between items-center">
                <span className="text-sm font-bold text-[#141414]/40 uppercase tracking-widest">Total Estimado</span>
                <span className="text-xl font-black text-[#141414]">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    cartItems.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0)
                  )}
                </span>
              </div>

              <div className="px-6 py-4 border-t border-[#141414]/5 bg-[#F5F5F0]/50 space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 ml-1">Fornecedor Destinatário</label>
                <select
                  required
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="w-full bg-white border-none rounded-2xl py-3 px-4 shadow-sm focus:ring-2 focus:ring-[#141414] font-medium"
                >
                  <option value="">Selecione um fornecedor...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.trade_name || s.corporate_name}</option>
                  ))}
                </select>
              </div>

              <div className="p-6 bg-[#F5F5F0] space-y-3">
                <button
                  onClick={sharePDF}
                  className="w-full flex items-center justify-center gap-2 bg-[#141414] text-white py-4 rounded-2xl font-bold hover:opacity-90 transition-opacity"
                >
                  <Download size={20} />
                  Compartilhar PDF
                </button>
                <button
                  onClick={finalizeList}
                  className="w-full flex items-center justify-center gap-2 bg-[#141414] text-white py-4 rounded-2xl font-bold hover:opacity-90 transition-opacity"
                >
                  <CheckCircle2 size={20} />
                  Salvar e Finalizar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
