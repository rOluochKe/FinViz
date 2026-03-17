import React from 'react';

import { Menu, Transition } from '@headlessui/react';

import { Bars3Icon, UserCircleIcon } from '@heroicons/react/24/outline';

import { Link, useLocation } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  setSidebarOpen?: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ setSidebarOpen }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();

  const publicNavItems = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  // Check if current route is a public page
  const isPublicPage = ['/', '/about', '/contact'].includes(location.pathname);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left section */}
        <div className="flex items-center">
          {/* Menu button - only show when authenticated */}
          {isAuthenticated && setSidebarOpen && (
            <button
              type="button"
              className="lg:hidden -ml-2 p-2 text-gray-400 hover:text-gray-500"
              onClick={() => setSidebarOpen(true)}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          )}

          {/* Logo - always visible */}
          <Link to="/" className="text-xl font-bold text-primary-600 ml-2 lg:ml-0">
            FinViz Pro
          </Link>

          {/* Public Navigation - only show on public pages */}
          {!isAuthenticated && isPublicPage && (
            <nav className="hidden md:flex ml-8 space-x-1">
              {publicNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center space-x-2 hover:opacity-80">
                {user?.first_name ? (
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-700">
                      {user.first_name[0]}
                      {user.last_name?.[0]}
                    </span>
                  </div>
                ) : (
                  <UserCircleIcon className="h-8 w-8 text-primary-600" />
                )}
              </Menu.Button>

              <Transition
                as={React.Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-48 rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        to="/dashboard"
                        className={`${active ? 'bg-gray-100' : ''} block px-4 py-2 text-sm text-gray-700`}
                      >
                        Dashboard
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        to="/settings"
                        className={`${active ? 'bg-gray-100' : ''} block px-4 py-2 text-sm text-gray-700`}
                      >
                        Settings
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={logout}
                        className={`${active ? 'bg-gray-100' : ''} block w-full text-left px-4 py-2 text-sm text-red-600`}
                      >
                        Sign out
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          ) : (
            <>
              {/* Mobile public navigation */}
              {isPublicPage && (
                <nav className="flex md:hidden space-x-1">
                  {publicNavItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`px-2 py-1 text-sm font-medium rounded-md transition-colors ${
                          isActive
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              )}

              {/* Auth buttons */}
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-600 hover:text-primary-600"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
                >
                  Sign Up
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile public navigation - separate row on small screens when not authenticated */}
      {!isAuthenticated && isPublicPage && (
        <div className="md:hidden border-t border-gray-200 px-4 py-2">
          <nav className="flex space-x-4">
            {publicNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-medium transition-colors ${
                    isActive ? 'text-primary-600' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
