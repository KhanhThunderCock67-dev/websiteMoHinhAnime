import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CartDrawer from '../components/CartDrawer';
import ChatWidget from '../components/Chatbox';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';

export const MainLayout = () => {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const { fetchCart, syncWithBackend } = useCartStore();

  useEffect(() => {
    checkAuth();
    if (isAuthenticated) {
      syncWithBackend();
    } else {
      fetchCart(false);
    }
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen flex flex-col bg-vault-950 text-slate-100">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <ChatWidget />
    </div>
  );
};

export default MainLayout;
