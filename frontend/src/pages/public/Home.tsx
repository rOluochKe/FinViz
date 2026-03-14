import React from 'react';

import {
  ArrowTrendingUpIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  DevicePhoneMobileIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  const features = [
    {
      name: 'Smart Analytics',
      description:
        'Get intelligent insights into your spending patterns with AI-powered analytics and predictions.',
      icon: ChartBarIcon,
    },
    {
      name: 'Budget Planning',
      description:
        'Create and manage budgets with real-time alerts and projections to stay on track.',
      icon: CurrencyDollarIcon,
    },
    {
      name: 'Secure & Private',
      description: 'Your financial data is encrypted and protected with enterprise-grade security.',
      icon: ShieldCheckIcon,
    },
    {
      name: 'Investment Tracking',
      description: 'Monitor your investments and portfolio performance with detailed analytics.',
      icon: ArrowTrendingUpIcon,
    },
    {
      name: 'Multi-user Support',
      description: 'Perfect for families or small businesses with role-based access control.',
      icon: UserGroupIcon,
    },
    {
      name: 'Mobile Friendly',
      description: 'Access your finances on the go with our fully responsive design.',
      icon: DevicePhoneMobileIcon,
    },
  ];

  const stats = [
    { name: 'Active Users', value: '10,000+' },
    { name: 'Transactions Tracked', value: '1M+' },
    { name: 'Money Managed', value: '$500M+' },
    { name: 'Countries', value: '50+' },
  ];

  const testimonials = [
    {
      content:
        'FinViz Pro has transformed how I manage my personal finances. The insights and visualizations are incredible!',
      author: 'Sarah Johnson',
      role: 'Small Business Owner',
      avatar: 'SJ',
    },
    {
      content:
        'The budget planning features have helped our family save over 20% more each month. Highly recommended!',
      author: 'Michael Chen',
      role: 'Freelancer',
      avatar: 'MC',
    },
    {
      content:
        'As an accountant, I recommend FinViz Pro to all my clients. It&apos;s intuitive, powerful, and secure.',
      author: 'Emily Rodriguez',
      role: 'Certified Accountant',
      avatar: 'ER',
    },
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative isolate overflow-hidden bg-gradient-to-b from-primary-100 to-white">
        <div className="absolute inset-y-0 right-1/2 -z-10 -mr-96 w-[200%] origin-top-right skew-x-[-30deg] bg-white shadow-xl shadow-primary-600/10 ring-1 ring-primary-50 sm:-mr-80 lg:-mr-96" />
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Take Control of Your <span className="text-primary-600">Financial Future</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              FinViz Pro is your all-in-one financial analytics dashboard. Track expenses, manage
              budgets, analyze trends, and make smarter financial decisions with powerful insights
              and beautiful visualizations.
            </p>
            <div className="mt-10 flex items-center gap-x-6">
              <Link
                to="/register"
                className="rounded-md bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 transition-colors"
              >
                Get Started Free
              </Link>
              <Link
                to="/about"
                className="text-sm font-semibold leading-6 text-gray-900 hover:text-primary-600 transition-colors"
              >
                Learn more <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
          <div className="mt-16 sm:mt-24 lg:mt-32">
            <div className="rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:rounded-2xl">
              <img
                src="https://placehold.co/1200x600/2563eb/ffffff?text=FinViz+Pro+Dashboard"
                alt="FinViz Pro Dashboard Preview"
                className="rounded-lg shadow-2xl ring-1 ring-gray-900/10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32">
        <dl className="grid grid-cols-1 gap-x-8 gap-y-16 text-center lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.name} className="mx-auto flex max-w-xs flex-col gap-y-4">
              <dt className="text-base leading-7 text-gray-600">{stat.name}</dt>
              <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Features Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32 bg-gray-50">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-primary-600">Powerful Features</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need to manage your finances
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            FinViz Pro combines powerful analytics with an intuitive interface to give you complete
            control over your financial life.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
            {features.map((feature) => (
              <div key={feature.name} className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                    <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  {feature.name}
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">{feature.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-primary-600">Testimonials</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Loved by users worldwide
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Don't just take our word for it - hear from some of our satisfied users.
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.author}
              className="flex flex-col bg-white rounded-2xl shadow-lg p-8"
            >
              <div className="flex-1">
                <p className="text-gray-600">"{testimonial.content}"</p>
              </div>
              <div className="mt-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.author}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-600">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to take control of your finances?
            <br />
            Start your free trial today.
          </h2>
          <p className="mt-6 text-lg leading-8 text-primary-100">
            No credit card required. Cancel anytime.
          </p>
          <div className="mt-10 flex items-center gap-x-6">
            <Link
              to="/register"
              className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-primary-600 shadow-sm hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors"
            >
              Get Started
            </Link>
            <Link
              to="/about"
              className="text-sm font-semibold leading-6 text-white hover:text-primary-100 transition-colors"
            >
              Learn more <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
