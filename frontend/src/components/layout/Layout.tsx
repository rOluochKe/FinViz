import React from 'react';

import { useLocation } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import Footer from './Footer';
import Header from './Header';
import PublicNavigation from './PublicNavigation';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const isPublicPage = ['/', '/about', '/contact'].includes(location.pathname);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        {isPublicPage && <PublicNavigation />}
        <main>{children}</main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      <div className="lg:pl-64">
        <Header setSidebarOpen={setSidebarOpen} />

        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Layout;
