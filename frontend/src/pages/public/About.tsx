import React from 'react';

import {
  AcademicCapIcon,
  BuildingOfficeIcon,
  CheckBadgeIcon,
  CodeBracketIcon,
  FlagIcon,
  GlobeAltIcon,
  HandRaisedIcon,
  HeartIcon,
  LightBulbIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrophyIcon,
  UserGroupIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

import { Link } from 'react-router-dom';

const About: React.FC = () => {
  const team = [
    {
      name: 'Alex Morgan',
      role: 'Founder & CEO',
      bio: 'Former financial analyst with 10+ years of experience in fintech. Passionate about democratizing financial intelligence.',
      avatar: 'AM',
      color: 'bg-blue-100',
      textColor: 'text-blue-700',
    },
    {
      name: 'Jessica Lee',
      role: 'Head of Product',
      bio: 'Product strategist who loves creating intuitive user experiences. Previously led product at several successful fintech startups.',
      avatar: 'JL',
      color: 'bg-green-100',
      textColor: 'text-green-700',
    },
    {
      name: 'David Kim',
      role: 'Lead Engineer',
      bio: 'Full-stack developer passionate about building scalable applications. 8+ years of experience in financial software.',
      avatar: 'DK',
      color: 'bg-purple-100',
      textColor: 'text-purple-700',
    },
    {
      name: 'Sarah Chen',
      role: 'Data Scientist',
      bio: 'AI and machine learning expert focused on financial predictions. PhD in Computer Science from Stanford.',
      avatar: 'SC',
      color: 'bg-pink-100',
      textColor: 'text-pink-700',
    },
    {
      name: 'Michael Brown',
      role: 'Head of Security',
      bio: 'Cybersecurity expert with experience at major financial institutions. Ensures your data is always protected.',
      avatar: 'MB',
      color: 'bg-orange-100',
      textColor: 'text-orange-700',
    },
    {
      name: 'Emily Watson',
      role: 'Customer Success',
      bio: 'Dedicated to helping users get the most out of FinViz Pro. Former financial advisor.',
      avatar: 'EW',
      color: 'bg-indigo-100',
      textColor: 'text-indigo-700',
    },
  ];

  const values = [
    {
      name: 'Transparency',
      description:
        'We believe in complete transparency with our users. No hidden fees, no surprises.',
      icon: GlobeAltIcon,
      color: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      name: 'Security First',
      description: 'Your data security is our top priority. We use enterprise-grade encryption.',
      icon: ShieldCheckIcon,
      color: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      name: 'Innovation',
      description: "We constantly push the boundaries of what's possible in financial technology.",
      icon: LightBulbIcon,
      color: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      name: 'User-Centric',
      description: "Every feature we build starts with understanding our users' needs.",
      icon: HeartIcon,
      color: 'bg-pink-50',
      iconColor: 'text-pink-600',
    },
    {
      name: 'Community',
      description: "We're building a community of financially empowered individuals.",
      icon: UsersIcon,
      color: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
    },
    {
      name: 'Excellence',
      description: 'We strive for excellence in everything we do, from code to customer support.',
      icon: TrophyIcon,
      color: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
    },
  ];

  const milestones = [
    {
      year: '2022',
      event: 'FinViz Pro founded',
      icon: FlagIcon,
      description: 'Started with a mission to democratize financial intelligence',
    },
    {
      year: '2023',
      event: 'Launched first version',
      icon: RocketLaunchIcon,
      description: 'Released MVP with 1,000+ beta users in first month',
    },
    {
      year: '2024',
      event: 'Reached 10,000 users',
      icon: UsersIcon,
      description: 'Expanded team and added AI-powered insights',
    },
    {
      year: '2025',
      event: 'Launched AI insights',
      icon: SparklesIcon,
      description: 'Introduced machine learning predictions and recommendations',
    },
    {
      year: '2026',
      event: '50,000+ users worldwide',
      icon: GlobeAltIcon,
      description: 'Now serving users in over 50 countries',
    },
  ];

  const stats = [
    { label: 'Users', value: '50,000+', icon: UsersIcon },
    { label: 'Transactions', value: '1M+', icon: CodeBracketIcon },
    { label: 'Countries', value: '50+', icon: GlobeAltIcon },
    { label: 'Uptime', value: '99.9%', icon: CheckBadgeIcon },
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative isolate overflow-hidden bg-gradient-to-b from-primary-50 to-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl">
            <div className="flex items-center gap-x-4 mb-6">
              <span className="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-800">
                <HeartIcon className="h-4 w-4 mr-1" />
                Our Story
              </span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              About <span className="text-primary-600">FinViz Pro</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              We're on a mission to democratize financial intelligence and help everyone make better
              financial decisions through powerful analytics and insights.
            </p>
            <div className="mt-10 flex items-center gap-x-6">
              <Link
                to="/register"
                className="rounded-md bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors"
              >
                Join Our Community
              </Link>
              <Link
                to="/contact"
                className="text-sm font-semibold leading-6 text-gray-900 hover:text-primary-600 transition-colors"
              >
                Get in touch <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16">
        <dl className="grid grid-cols-2 gap-x-8 gap-y-10 text-center lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="mx-auto flex max-w-xs flex-col gap-y-3">
              <dt className="text-base leading-7 text-gray-600 flex items-center justify-center">
                <stat.icon className="h-5 w-5 mr-2 text-primary-500" />
                {stat.label}
              </dt>
              <dd className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Mission Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32 bg-gray-50">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-base font-semibold leading-7 text-primary-600">Our Mission</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Empowering financial freedom for everyone
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            To empower individuals and businesses with the tools and insights they need to achieve
            financial freedom. We believe that everyone deserves access to sophisticated financial
            analytics, regardless of their background or expertise.
          </p>
        </div>
      </div>

      {/* Values Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-primary-600">Our Values</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            What drives us forward
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            These core principles guide every decision we make and feature we build.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-12 lg:max-w-none lg:grid-cols-3">
            {values.map((value) => (
              <div key={value.name} className="flex flex-col items-start">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div
                    className={`mb-6 flex h-12 w-12 items-center justify-center rounded-xl ${value.color}`}
                  >
                    <value.icon className={`h-6 w-6 ${value.iconColor}`} aria-hidden="true" />
                  </div>
                  {value.name}
                </dt>
                <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">{value.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Team Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32 bg-gray-50">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-primary-600">Our Team</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Meet the people behind FinViz Pro
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            We're a diverse team of financial experts, engineers, and designers passionate about
            creating the best financial analytics platform.
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {team.map((member) => (
            <div
              key={member.name}
              className="flex flex-col items-center text-center bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow"
            >
              <div
                className={`h-24 w-24 rounded-full ${member.color} flex items-center justify-center text-3xl font-bold ${member.textColor} mb-6`}
              >
                {member.avatar}
              </div>
              <h3 className="text-xl font-semibold text-gray-900">{member.name}</h3>
              <p className="text-sm text-primary-600 font-medium mt-1">{member.role}</p>
              <p className="mt-4 text-sm text-gray-500 leading-relaxed">{member.bio}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Milestones Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-primary-600">Our Journey</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Key milestones
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Follow our journey as we continue to grow and improve.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-3xl">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 h-full w-0.5 bg-primary-200"></div>

            {/* Timeline items */}
            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <div key={index} className="relative flex items-start gap-6">
                  <div className="relative flex h-16 w-16 flex-none items-center justify-center rounded-full bg-primary-600 text-white font-bold">
                    <milestone.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-auto pt-2">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-sm font-semibold text-primary-600">
                        {milestone.year}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{milestone.event}</h3>
                    <p className="text-gray-600">{milestone.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-600">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Join us on this journey.
            <br />
            Start using FinViz Pro today.
          </h2>
          <p className="mt-6 text-lg leading-8 text-primary-100">
            Be part of our growing community of financially empowered individuals.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              to="/register"
              className="rounded-md bg-white px-8 py-4 text-base font-semibold text-primary-600 shadow-lg hover:bg-primary-50 transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              to="/contact"
              className="text-base font-semibold leading-6 text-white hover:text-primary-100 transition-colors"
            >
              Contact us <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
