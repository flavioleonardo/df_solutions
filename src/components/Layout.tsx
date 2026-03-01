"use client";

import React, { useEffect, useState } from 'react';
import Navigation from './Navigation';
import { useRouter, usePathname } from 'next/navigation';

export default function Layout({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    if (!token) {
      router.push('/login');
      return;
    }

    if (adminOnly && user?.role !== 'admin' && user?.role !== 'superadmin') {
      router.push('/');
      return;
    }

    setLoading(false);
  }, [router, adminOnly]);

  if (loading) {
    return <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center font-sans">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#141414] font-sans">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
