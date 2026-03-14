import React from 'react';

import {
  CodeBracketIcon,
  GlobeAltIcon,
  HeartIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

import { Link } from 'react-router-dom';

const About: React.FC = () => {
  const team = [
    {
      name: 'Alex Morgan',
      role: 'Founder & CEO',
      bio: 'Former financial analyst with 10+ years of experience in fintech.',
      avatar: 'AM',
    },
    {
      name: 'Jessica Lee',
      role: 'Head of Product',
      bio: 'Product strategist who loves creating intuitive user experiences.',
      avatar: 'JL',
    },
    {
      name: 'David Kim',
      role: 'Lead Engineer',
      bio: 'Full-stack developer passionate about building scalable applications.',
      avatar: 'DK',
    },
    {
      name: 'Sarah Chen',
      role: 'Data Scientist',
      bio: 'AI and machine learning expert focused on financial predictions.',
      avatar: 'SC',
    },
  ];

  const values = [
    {
      name: 'Transparency',
      description:
        'We believe in complete transparency with our users. No hidden fees, no surprises.',
      icon: GlobeAltIcon,
    },
    {
      name: 'Security First',
      description: 'Your data security is our top priority. We use enterprise-grade encryption.',
      icon: ShieldCheckIcon,
    },
    {
      name: 'Innovation',
      description: "We constantly push the boundaries of what's possible in financial technology.",
      icon: CodeBracketIcon,
    },
    {
      name: 'User-Centric',
      description: "Every feature we build starts with understanding our users' needs.",
      icon: HeartIcon,
    },
    {
      name: 'Community',
      description: "We're building a community of financially empowered individuals.",
      icon: UsersIcon,
    },
    {
      name: 'Excellence',
      description: 'We strive for excellence in everything we do, from code to customer support.',
      icon: RocketLaunchIcon,
    },
  ];

  const milestones = [
    { year: '2022', event: 'FinViz Pro founded' },
    { year: '2023', event: 'Launched first version with 1,000+ users' },
    { year: '2024', event: 'Reached 10,000 users and expanded team' },
    { year: '2025', event: 'Launched AI-powered insights feature' },
    { year: '2026', event: 'Now serving 50,000+ users worldwide' },
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative isolate overflow-hidden bg-gradient-to-b from-primary-100 to-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              About <span className="text-primary-600">FinViz Pro</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              We're on a mission to democratize financial intelligence and help everyone make better
              financial decisions through powerful analytics and insights.
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Our Mission
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            To empower individuals and businesses with the tools and insights they need to achieve
            financial freedom. We believe that everyone deserves access to sophisticated financial
            analytics, regardless of their background or expertise.
          </p>
        </div>
      </div>

      {/* Values Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32 bg-gray-50">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-primary-600">Our Values</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            What drives us forward
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {values.map((value) => (
              <div key={value.name} className="flex flex-col">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                    <value.icon className="h-6 w-6 text-white" aria-hidden="true" />
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
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32">
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
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-4">
          {team.map((member) => (
            <div key={member.name} className="flex flex-col items-center text-center">
              <div className="h-32 w-32 rounded-full bg-primary-100 flex items-center justify-center text-3xl font-bold text-primary-700 mb-4">
                {member.avatar}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
              <p className="text-sm text-primary-600">{member.role}</p>
              <p className="mt-2 text-sm text-gray-500">{member.bio}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Milestones Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32 bg-gray-50">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-primary-600">Our Journey</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Key milestones
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 h-full w-0.5 bg-primary-200"></div>

            {/* Timeline items */}
            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <div key={index} className="relative flex items-start gap-6">
                  <div className="relative flex h-16 w-16 flex-none items-center justify-center rounded-full bg-primary-600 text-white font-bold">
                    {milestone.year}
                  </div>
                  <div className="flex-auto pt-3">
                    <p className="text-lg text-gray-900">{milestone.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-600">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Join us on this journey.
            <br />
            Start using FinViz Pro today.
          </h2>
          <div className="mt-10 flex items-center gap-x-6">
            <Link
              to="/register"
              className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-primary-600 shadow-sm hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors"
            >
              Get Started
            </Link>
            <Link
              to="/contact"
              className="text-sm font-semibold leading-6 text-white hover:text-primary-100 transition-colors"
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
