import React from 'react';

import {
  ArrowTrendingUpIcon,
  BanknotesIcon,
  ChartBarIcon,
  ChartPieIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  PresentationChartLineIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
  UserGroupIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  const features = [
    {
      name: 'Smart Analytics',
      description:
        'Get intelligent insights into your spending patterns with AI-powered analytics and predictions.',
      icon: ChartBarIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Budget Planning',
      description:
        'Create and manage budgets with real-time alerts and projections to stay on track.',
      icon: CurrencyDollarIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Secure & Private',
      description: 'Your financial data is encrypted and protected with enterprise-grade security.',
      icon: ShieldCheckIcon,
      color: 'bg-purple-500',
    },
    {
      name: 'Investment Tracking',
      description: 'Monitor your investments and portfolio performance with detailed analytics.',
      icon: ArrowTrendingUpIcon,
      color: 'bg-indigo-500',
    },
    {
      name: 'Multi-user Support',
      description: 'Perfect for families or small businesses with role-based access control.',
      icon: UserGroupIcon,
      color: 'bg-pink-500',
    },
    {
      name: 'Mobile Friendly',
      description: 'Access your finances on the go with our fully responsive design.',
      icon: DevicePhoneMobileIcon,
      color: 'bg-orange-500',
    },
    {
      name: 'Visual Reports',
      description: 'Beautiful charts and graphs to visualize your financial data at a glance.',
      icon: ChartPieIcon,
      color: 'bg-red-500',
    },
    {
      name: 'AI Insights',
      description: 'Get personalized recommendations to optimize your spending and savings.',
      icon: SparklesIcon,
      color: 'bg-yellow-500',
    },
    {
      name: 'Real-time Updates',
      description: 'See your transactions and balances update in real-time.',
      icon: ClockIcon,
      color: 'bg-cyan-500',
    },
  ];

  const stats = [
    { name: 'Active Users', value: '10,000+', icon: UserIcon },
    { name: 'Transactions Tracked', value: '1M+', icon: BanknotesIcon },
    { name: 'Money Managed', value: '$500M+', icon: PresentationChartLineIcon },
    { name: 'Countries', value: '50+', icon: GlobeAltIcon },
    { name: 'Average Savings', value: '23%', icon: ArrowTrendingUpIcon },
    { name: 'User Satisfaction', value: '98%', icon: StarIcon },
  ];

  const testimonials = [
    {
      content:
        'FinViz Pro has transformed how I manage my personal finances. The insights and visualizations are incredible!',
      author: 'Sarah Johnson',
      role: 'Small Business Owner',
      avatar: 'SJ',
      rating: 5,
    },
    {
      content:
        'The budget planning features have helped our family save over 20% more each month. Highly recommended!',
      author: 'Michael Chen',
      role: 'Freelancer',
      avatar: 'MC',
      rating: 5,
    },
    {
      content:
        'As an accountant, I recommend FinViz Pro to all my clients. It&apos;s intuitive, powerful, and secure.',
      author: 'Emily Rodriguez',
      role: 'Certified Accountant',
      avatar: 'ER',
      rating: 5,
    },
    {
      content:
        'The investment tracking tools are fantastic. I can see all my portfolio performance in one place.',
      author: 'David Kim',
      role: 'Investor',
      avatar: 'DK',
      rating: 5,
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Create Account',
      description: 'Sign up for free in under 2 minutes. No credit card required.',
    },
    {
      number: '02',
      title: 'Connect Accounts',
      description: 'Link your bank accounts or start by adding transactions manually.',
    },
    {
      number: '03',
      title: 'Set Goals',
      description: 'Create budgets, set savings goals, and track your progress.',
    },
    {
      number: '04',
      title: 'Get Insights',
      description: 'Receive personalized insights and recommendations to improve your finances.',
    },
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative isolate overflow-hidden bg-gradient-to-b from-primary-50 to-white">
        <div className="absolute inset-y-0 right-1/2 -z-10 -mr-96 w-[200%] origin-top-right skew-x-[-30deg] bg-white shadow-xl shadow-primary-600/10 ring-1 ring-primary-50 sm:-mr-80 lg:-mr-96" />
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl">
            <div className="flex items-center gap-x-4 mb-6">
              <span className="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-800">
                <SparklesIcon className="h-4 w-4 mr-1" />
                New: AI-Powered Insights
              </span>
            </div>
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
            <div className="mt-8 flex items-center gap-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-1" />
                No credit card required
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-1" />
                14-day free trial
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-1" />
                Cancel anytime
              </div>
            </div>
          </div>
          <div className="mt-16 sm:mt-24 lg:mt-32">
            <div className="relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary-200 rounded-full blur-3xl opacity-30" />
              <div className="relative rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:rounded-2xl">
                <img
                  src="https://placehold.co/1200x600/2563eb/ffffff?text=FinViz+Pro+Dashboard"
                  alt="FinViz Pro Dashboard Preview"
                  className="rounded-lg shadow-2xl ring-1 ring-gray-900/10"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32">
        <dl className="grid grid-cols-2 gap-x-8 gap-y-16 text-center lg:grid-cols-6">
          {stats.map((stat) => (
            <div key={stat.name} className="mx-auto flex max-w-xs flex-col gap-y-4">
              <dt className="text-base leading-7 text-gray-600 flex items-center justify-center">
                <stat.icon className="h-5 w-5 mr-2 text-primary-500" />
                {stat.name}
              </dt>
              <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* How It Works Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32 bg-gray-50">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-primary-600">Simple Process</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Get started in 4 easy steps
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            We've made it incredibly simple to start managing your finances effectively.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
            {steps.map((step) => (
              <div key={step.number} className="flex flex-col items-start">
                <dt className="text-4xl font-bold text-primary-200 mb-4">{step.number}</dt>
                <dd className="text-lg font-semibold text-gray-900 mb-2">{step.title}</dd>
                <dd className="text-base leading-7 text-gray-600">{step.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Features Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32">
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
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-3 lg:gap-y-16">
            {features.map((feature) => (
              <div key={feature.name} className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div
                    className={`absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg ${feature.color}`}
                  >
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
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32 bg-gray-50">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-primary-600">Testimonials</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Loved by users worldwide
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Don't just take our word for it - hear from some of our satisfied users.
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-2">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.author}
              className="flex flex-col bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <StarIconSolid key={i} className="h-5 w-5 text-yellow-400" />
                ))}
              </div>
              <div className="flex-1">
                <p className="text-gray-600 text-lg italic">"{testimonial.content}"</p>
              </div>
              <div className="mt-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-lg">
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
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to take control of your finances?
            <br />
            Start your free trial today.
          </h2>
          <p className="mt-6 text-lg leading-8 text-primary-100">
            Join thousands of satisfied users who are already managing their finances with FinViz
            Pro.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              to="/register"
              className="rounded-md bg-white px-8 py-4 text-base font-semibold text-primary-600 shadow-lg hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              to="/contact"
              className="text-base font-semibold leading-6 text-white hover:text-primary-100 transition-colors"
            >
              Contact Sales <span aria-hidden="true">→</span>
            </Link>
          </div>
          <p className="mt-6 text-sm text-primary-200">
            No credit card required. 14-day free trial. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
