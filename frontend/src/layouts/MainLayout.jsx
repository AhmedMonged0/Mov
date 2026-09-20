import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import AntiAdblockBanner from '../components/shared/AntiAdblockBanner';

export default function MainLayout() {
  return (
    <div className="app">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
      <AntiAdblockBanner />
    </div>
  );
}
