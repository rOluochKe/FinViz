import React from 'react';

import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Link to="/" className="text-lg font-bold text-primary-600">
              FinViz Pro
            </Link>
            <p className="text-sm text-gray-500 mt-1">Personal Finance Analytics Dashboard</p>
          </div>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            <Link to="/about" className="text-gray-500 hover:text-primary-600">
              About
            </Link>
            <Link to="/contact" className="text-gray-500 hover:text-primary-600">
              Contact
            </Link>
            <Link to="/privacy" className="text-gray-500 hover:text-primary-600">
              Privacy
            </Link>
            <Link to="/terms" className="text-gray-500 hover:text-primary-600">
              Terms
            </Link>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-400">
          &copy; {currentYear} FinViz Pro. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
