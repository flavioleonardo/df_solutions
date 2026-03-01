import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LogOut, ShoppingCart, Package, Users, ClipboardList, Menu, X, ChevronRight, Grid, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import './index.css';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import AdminLists from '@/pages/AdminLists';
import AdminSuppliers from '@/pages/AdminSuppliers';
import { api } from './services/api';
import { Company } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin' && user.role !== 'superadmin') return <Navigate to="/" />;

  return <>{children}</>;
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    api.company.getMe().then(setCompany).catch(() => {});
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = [
    { label: 'Nova Lista', path: '/', icon: ShoppingCart, roles: ['user', 'admin', 'superadmin'] },
    { label: 'Fornecedores', path: '/admin/suppliers', icon: Building2, roles: ['admin', 'superadmin'] },
    { label: 'Histórico', path: '/admin/lists', icon: ClipboardList, roles: ['user', 'admin', 'superadmin'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#141414] font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#141414]/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#141414] rounded-xl flex items-center justify-center text-white">
                <ShoppingCart size={20} />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight leading-none">DF Solutions</h1>
                <p className="text-[10px] uppercase tracking-widest opacity-50 font-semibold">
                  {company?.name || 'Carregando...'}
                </p>
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {filteredNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                    location.pathname === item.path
                      ? "bg-[#141414] text-white"
                      : "hover:bg-[#141414]/5 text-[#141414]/60 hover:text-[#141414]"
                  )}
                >
                  <item.icon size={16} />
                  {item.label}
                </Link>
              ))}
              <div className="w-px h-6 bg-[#141414]/10 mx-2" />
              <button
                onClick={handleLogout}
                className="p-2 rounded-full hover:bg-red-50 text-red-500 transition-colors"
                title="Sair"
              >
                <LogOut size={18} />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-xl hover:bg-[#141414]/5"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed inset-0 z-40 bg-white pt-16"
          >
            <div className="p-4 space-y-2">
              {filteredNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "w-full p-4 rounded-2xl flex items-center justify-between text-lg font-medium",
                    location.pathname === item.path
                      ? "bg-[#141414] text-white"
                      : "bg-[#141414]/5 text-[#141414]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={20} />
                    {item.label}
                  </div>
                  <ChevronRight size={20} />
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="w-full p-4 rounded-2xl bg-red-50 text-red-500 flex items-center gap-3 text-lg font-medium"
              >
                <LogOut size={20} />
                Sair
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/suppliers"
          element={
            <ProtectedRoute adminOnly>
              <Layout>
                <AdminSuppliers />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/lists"
          element={
            <ProtectedRoute>
              <Layout>
                <AdminLists />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
