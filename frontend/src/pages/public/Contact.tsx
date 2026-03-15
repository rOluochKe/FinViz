import React, { useState } from 'react';

import {
  AcademicCapIcon,
  ArrowRightIcon,
  BuildingOfficeIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  LifebuoyIcon,
  MapPinIcon,
  PhoneIcon,
  QuestionMarkCircleIcon,
  ShieldCheckIcon,
  TicketIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

import { Link } from 'react-router-dom';

import toast from 'react-hot-toast';

import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      toast.success("Message sent successfully! We'll get back to you soon.");
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
      setFormSubmitted(true);
      setIsSubmitting(false);

      // Reset success message after 5 seconds
      setTimeout(() => setFormSubmitted(false), 5000);
    }, 1500);
  };

  const contactInfo = [
    {
      icon: EnvelopeIcon,
      title: 'Email Us',
      content: 'support@finvizpro.com',
      subContent: 'sales@finvizpro.com',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      action: 'mailto:support@finvizpro.com',
    },
    {
      icon: PhoneIcon,
      title: 'Call Us',
      content: '+1 (555) 123-4567',
      subContent: 'Mon-Fri, 9am-6pm EST',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      action: 'tel:+15551234567',
    },
    {
      icon: MapPinIcon,
      title: 'Visit Us',
      content: '123 Finance Street',
      subContent: 'San Francisco, CA 94105',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      action: 'https://maps.google.com/?q=123+Finance+Street+San+Francisco+CA',
    },
    {
      icon: ClockIcon,
      title: 'Business Hours',
      content: 'Monday - Friday',
      subContent: '9:00 AM - 6:00 PM EST',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      action: '#',
    },
  ];

  const quickQuestions = [
    {
      icon: QuestionMarkCircleIcon,
      question: 'How do I reset my password?',
      answer:
        'Click on "Forgot Password" on the login page and follow the instructions sent to your email.',
      link: '/forgot-password',
      linkText: 'Reset Password',
      color: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      icon: AcademicCapIcon,
      question: 'How do I get started?',
      answer:
        'Create a free account, add your first transaction, and start tracking your finances immediately.',
      link: '/register',
      linkText: 'Create Account',
      color: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      icon: CreditCardIcon,
      question: 'How do I add transactions?',
      answer:
        'Go to the Transactions page and click "Add Transaction". You can also import transactions from CSV files.',
      link: '/transactions',
      linkText: 'View Transactions',
      color: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      icon: ShieldCheckIcon,
      question: 'Is my data secure?',
      answer: 'Yes! We use enterprise-grade encryption to protect all your financial data.',
      link: '/security',
      linkText: 'Security Details',
      color: 'bg-pink-100',
      iconColor: 'text-pink-600',
    },
    {
      icon: DevicePhoneMobileIcon,
      question: 'Do you have a mobile app?',
      answer:
        'Our platform is fully responsive and works great on mobile devices. Native apps coming soon!',
      link: '/features',
      linkText: 'View Features',
      color: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
    },
    {
      icon: ChatBubbleLeftRightIcon,
      question: 'How do I contact support?',
      answer:
        'Use the contact form on this page, email us at support@finvizpro.com, or call us during business hours.',
      link: '#contact-form',
      linkText: 'Contact Us',
      color: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
  ];

  const faqs = [
    {
      question: 'What is FinViz Pro?',
      answer:
        'FinViz Pro is a comprehensive finance analytics dashboard that helps you track expenses, manage budgets, analyze trends, and make smarter financial decisions.',
      category: 'general',
    },
    {
      question: 'Is there a free trial?',
      answer:
        'Yes! We offer a 14-day free trial with full access to all features. No credit card required.',
      category: 'pricing',
    },
    {
      question: 'Can I export my data?',
      answer:
        'Absolutely! You can export your transactions and reports in CSV, Excel, or PDF formats.',
      category: 'features',
    },
    {
      question: 'Do you offer discounts for annual plans?',
      answer: 'Yes, annual plans come with a 20% discount compared to monthly billing.',
      category: 'pricing',
    },
    {
      question: 'How secure is my data?',
      answer:
        'We use bank-level 256-bit encryption to protect all your financial data. We never store your bank login credentials.',
      category: 'security',
    },
    {
      question: 'Can I connect multiple bank accounts?',
      answer:
        'Yes, you can connect unlimited bank accounts, credit cards, and investment accounts.',
      category: 'features',
    },
  ];

  const supportChannels = [
    {
      name: 'Live Chat',
      description: 'Chat with our support team in real-time',
      icon: ChatBubbleLeftRightIcon,
      availability: '24/7',
      color: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      name: 'Email Support',
      description: 'Get a response within 24 hours',
      icon: EnvelopeIcon,
      availability: 'Mon-Fri',
      color: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      name: 'Phone Support',
      description: 'Speak directly with a support specialist',
      icon: PhoneIcon,
      availability: '9am-6pm EST',
      color: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      name: 'Help Center',
      description: 'Browse our knowledge base',
      icon: DocumentTextIcon,
      availability: 'Self-service',
      color: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative isolate overflow-hidden bg-gradient-to-b from-primary-50 to-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="flex items-center justify-center gap-x-4 mb-6">
              <span className="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-800">
                <LifebuoyIcon className="h-4 w-4 mr-1" />
                We're Here to Help
              </span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Get in <span className="text-primary-600">Touch</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Have questions about FinViz Pro? We're here to help! Reach out to us anytime.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Information Cards */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {contactInfo.map((item) => (
            <a
              key={item.title}
              href={item.action}
              className={`${item.bgColor} rounded-2xl p-6 text-center hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer`}
              target={item.action.startsWith('http') ? '_blank' : undefined}
              rel={item.action.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              <div className={`inline-flex p-3 rounded-full bg-white shadow-sm mb-4`}>
                <item.icon className={`h-6 w-6 ${item.iconColor}`} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-600">{item.content}</p>
              <p className="text-sm text-gray-500 mt-1">{item.subContent}</p>
            </a>
          ))}
        </div>
      </div>

      {/* Support Channels */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16 bg-gray-50">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Support Channels</h2>
          <p className="mt-4 text-lg text-gray-600">Choose the way that works best for you</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {supportChannels.map((channel) => (
            <div
              key={channel.name}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow text-center"
            >
              <div
                className={`w-16 h-16 ${channel.color} rounded-full flex items-center justify-center mx-auto mb-4`}
              >
                <channel.icon className={`h-8 w-8 ${channel.iconColor}`} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{channel.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{channel.description}</p>
              <p className="text-xs font-medium text-primary-600">{channel.availability}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Questions Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Quick Questions</h2>
          <p className="mt-4 text-lg text-gray-600">
            Find answers to commonly asked questions instantly
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickQuestions.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 border border-gray-100"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div
                    className={`w-12 h-12 ${item.color} rounded-lg flex items-center justify-center`}
                  >
                    <item.icon className={`h-6 w-6 ${item.iconColor}`} />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.question}</h3>
                  <p className="text-sm text-gray-600 mb-4">{item.answer}</p>
                  <Link
                    to={item.link}
                    className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    {item.linkText}
                    <ArrowRightIcon className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Form and FAQs Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16 bg-gray-50">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div id="contact-form" className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Send us a Message</h2>
                <p className="text-sm text-gray-500">We'll respond within 24 hours</p>
              </div>
            </div>

            {formSubmitted && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                <CheckCircleSolid className="h-5 w-5 text-green-500 mr-2" />
                <p className="text-sm text-green-700">
                  Message sent successfully! We'll get back to you soon.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Your Name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                />

                <Input
                  label="Email Address"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div>
                <label className="input-label">Subject</label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="">Select a subject</option>
                  <option value="general">General Inquiry</option>
                  <option value="support">Technical Support</option>
                  <option value="billing">Billing Question</option>
                  <option value="feature">Feature Request</option>
                  <option value="partnership">Partnership Opportunity</option>
                </select>
              </div>

              <div>
                <label className="input-label">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  className="input-field"
                  placeholder="Tell us how we can help..."
                  required
                />
              </div>

              <Button type="submit" isLoading={isSubmitting} fullWidth>
                <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                Send Message
              </Button>
            </form>
          </div>

          {/* FAQ Section */}
          <div>
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                <QuestionMarkCircleIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>
                <p className="text-sm text-gray-500">Quick answers to common questions</p>
              </div>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                  <p className="text-gray-600">{faq.answer}</p>
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      {faq.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Additional Help Card */}
            <div className="mt-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl p-6 text-white">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <QuestionMarkCircleIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">Still have questions?</h3>
                  <p className="text-primary-100 mb-4">
                    Can't find what you're looking for? Our support team is here to help 24/7.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Link
                      to="/docs"
                      className="text-sm font-medium bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
                    >
                      Browse Documentation
                    </Link>
                    <a
                      href="#contact-form"
                      className="text-sm font-medium bg-white text-primary-600 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        document
                          .getElementById('contact-form')
                          ?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      Contact Support
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Location</h2>
            <p className="text-gray-600 mb-6">
              Visit our headquarters in the heart of San Francisco
            </p>
          </div>
          <div className="h-96 bg-gray-200">
            <iframe
              title="FinViz Pro Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.019405178473!2d-122.419415484681!3d37.774929279759!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8085808f6c0c9e0b%3A0x3b8b3b3b3b3b3b3b!2sSan%20Francisco%2C%20CA!5e0!3m2!1sen!2sus!4v1620000000000!5m2!1sen!2sus"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              className="w-full h-full"
            />
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-600">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to get started?
          </h2>
          <p className="mt-4 text-lg leading-8 text-primary-100">
            Join thousands of satisfied users who are already managing their finances with FinViz
            Pro.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              to="/register"
              className="rounded-md bg-white px-8 py-4 text-base font-semibold text-primary-600 shadow-lg hover:bg-primary-50 transition-colors"
            >
              Create Free Account
            </Link>
            <Link
              to="/login"
              className="text-base font-semibold leading-6 text-white hover:text-primary-100 transition-colors"
            >
              Sign In <span aria-hidden="true">→</span>
            </Link>
          </div>
          <p className="mt-4 text-sm text-primary-200">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
};

export default Contact;
