import React from 'react';

import {
  ChartBarIcon,
  EnvelopeIcon,
  HomeIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

import { Link, useLocation } from 'react-router-dom';

const PublicNavigation: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/', icon: HomeIcon },
    { name: 'About', path: '/about', icon: InformationCircleIcon },
    { name: 'Contact', path: '/contact', icon: EnvelopeIcon },
  ];

  return (
    <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Left side - Public page navigation */}
          <nav className="flex space-x-1 sm:space-x-4">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <item.icon
                    className={`h-4 w-4 mr-2 ${isActive ? 'text-primary-600' : 'text-gray-400'}`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Right side - Dashboard access */}
          <div className="flex items-center space-x-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center px-4 py-2 rounded-md text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-sm"
            >
              <ChartBarIcon className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicNavigation;
