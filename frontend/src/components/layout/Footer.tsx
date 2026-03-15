import React from 'react';

import {
  ArrowTrendingUpIcon,
  BookOpenIcon,
  CalculatorIcon,
  ChartBarIcon,
  CreditCardIcon,
  DocumentDuplicateIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  HeartIcon,
  HomeIcon,
  InformationCircleIcon,
  LockClosedIcon,
  PhoneIcon,
  QuestionMarkCircleIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  TagIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const navigation = {
    public: [
      { name: 'Home', href: '/', icon: HomeIcon },
      { name: 'About Us', href: '/about', icon: InformationCircleIcon },
      { name: 'Contact', href: '/contact', icon: EnvelopeIcon },
    ],
    mainApp: [
      { name: 'Dashboard', href: '/dashboard', icon: ChartBarIcon },
      { name: 'Transactions', href: '/transactions', icon: CreditCardIcon },
      { name: 'Categories', href: '/categories', icon: TagIcon },
      { name: 'Budgets', href: '/budgets', icon: CalculatorIcon },
      { name: 'Reports', href: '/reports', icon: DocumentTextIcon },
      { name: 'Analytics', href: '/analytics', icon: ArrowTrendingUpIcon },
    ],
    account: [
      { name: 'Sign In', href: '/login', icon: LockClosedIcon },
      { name: 'Create Account', href: '/register', icon: HeartIcon },
      { name: 'Forgot Password', href: '/forgot-password', icon: QuestionMarkCircleIcon },
    ],
    resources: [
      { name: 'Help Center', href: '/help', icon: BookOpenIcon },
      { name: 'API Documentation', href: '/docs', icon: DocumentDuplicateIcon },
      { name: 'Community', href: '/community', icon: UserGroupIcon },
      { name: 'Feature Requests', href: '/features', icon: RocketLaunchIcon },
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy', icon: ShieldCheckIcon },
      { name: 'Terms of Service', href: '/terms', icon: DocumentTextIcon },
      { name: 'Security', href: '/security', icon: LockClosedIcon },
      { name: 'Cookie Policy', href: '/cookies', icon: GlobeAltIcon },
    ],
    contact: [
      { name: 'support@finvizpro.com', href: 'mailto:support@finvizpro.com', icon: EnvelopeIcon },
      { name: '+1 (555) 123-4567', href: 'tel:+15551234567', icon: PhoneIcon },
      { name: '123 Finance Street, SF, CA 94105', href: '#', icon: HomeIcon },
    ],
  };

  const socialLinks = [
    {
      name: 'Twitter',
      href: 'https://twitter.com/finvizpro',
      icon: (props: any) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
        </svg>
      ),
    },
    {
      name: 'LinkedIn',
      href: 'https://linkedin.com/company/finvizpro',
      icon: (props: any) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path
            fillRule="evenodd"
            d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    {
      name: 'GitHub',
      href: 'https://github.com/finvizpro',
      icon: (props: any) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path
            fillRule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    {
      name: 'YouTube',
      href: 'https://youtube.com/@finvizpro',
      icon: (props: any) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path
            fillRule="evenodd"
            d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    {
      name: 'Instagram',
      href: 'https://instagram.com/finvizpro',
      icon: (props: any) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path
            fillRule="evenodd"
            d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 016.38 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
  ];

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <h3 className="text-xl font-bold text-primary-600 mb-4">FinViz Pro</h3>
            <p className="text-sm text-gray-500 mb-4">
              A comprehensive finance analytics dashboard to help you track, analyze, and optimize
              your personal finances with powerful insights and visualizations.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-primary-600 transition-colors"
                  aria-label={item.name}
                >
                  <item.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Public Pages */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Public Pages
            </h3>
            <ul className="space-y-3">
              {navigation.public.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className="text-sm text-gray-500 hover:text-primary-600 transition-colors flex items-center group"
                  >
                    <item.icon className="h-4 w-4 mr-2 text-gray-400 group-hover:text-primary-500" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Main Application */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Main App
            </h3>
            <ul className="space-y-3">
              {navigation.mainApp.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className="text-sm text-gray-500 hover:text-primary-600 transition-colors flex items-center group"
                  >
                    <item.icon className="h-4 w-4 mr-2 text-gray-400 group-hover:text-primary-500" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account & Resources */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Account
            </h3>
            <ul className="space-y-3 mb-6">
              {navigation.account.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className="text-sm text-gray-500 hover:text-primary-600 transition-colors flex items-center group"
                  >
                    <item.icon className="h-4 w-4 mr-2 text-gray-400 group-hover:text-primary-500" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>

            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Resources
            </h3>
            <ul className="space-y-3">
              {navigation.resources.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="text-sm text-gray-500 hover:text-primary-600 transition-colors flex items-center group"
                  >
                    <item.icon className="h-4 w-4 mr-2 text-gray-400 group-hover:text-primary-500" />
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Contact */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Legal
            </h3>
            <ul className="space-y-3 mb-6">
              {navigation.legal.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className="text-sm text-gray-500 hover:text-primary-600 transition-colors flex items-center group"
                  >
                    <item.icon className="h-4 w-4 mr-2 text-gray-400 group-hover:text-primary-500" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>

            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Contact
            </h3>
            <ul className="space-y-3">
              {navigation.contact.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="text-sm text-gray-500 hover:text-primary-600 transition-colors flex items-center group"
                  >
                    <item.icon className="h-4 w-4 mr-2 text-gray-400 group-hover:text-primary-500" />
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar with Copyright and Quick Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400 mb-4 md:mb-0">
              &copy; {currentYear} FinViz Pro. All rights reserved.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/dashboard"
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium shadow-sm"
              >
                <ChartBarIcon className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                <LockClosedIcon className="h-4 w-4 mr-2" />
                Sign In
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                <HeartIcon className="h-4 w-4 mr-2" />
                Sign Up
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-6 flex flex-wrap justify-center gap-x-8 gap-y-2 text-xs text-gray-400">
            <Link to="/privacy" className="hover:text-primary-600 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-primary-600 transition-colors">
              Terms of Service
            </Link>
            <Link to="/security" className="hover:text-primary-600 transition-colors">
              Security
            </Link>
            <Link to="/cookies" className="hover:text-primary-600 transition-colors">
              Cookie Policy
            </Link>
            <Link to="/sitemap" className="hover:text-primary-600 transition-colors">
              Sitemap
            </Link>
            <Link to="/accessibility" className="hover:text-primary-600 transition-colors">
              Accessibility
            </Link>
          </div>

          {/* App Badges */}
          <div className="mt-6 flex justify-center space-x-4">
            <button
              type="button"
              className="inline-block p-0 border-0 bg-transparent cursor-pointer"
              aria-label="Download on App Store"
              disabled
            >
              <img
                src="https://placehold.co/120x40/000000/ffffff?text=App+Store"
                alt="Download on App Store"
                className="h-10 rounded-lg"
              />
            </button>
            <button
              type="button"
              className="inline-block p-0 border-0 bg-transparent cursor-pointer"
              aria-label="Get it on Google Play"
              disabled
            >
              <img
                src="https://placehold.co/120x40/000000/ffffff?text=Google+Play"
                alt="Get it on Google Play"
                className="h-10 rounded-lg"
              />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
