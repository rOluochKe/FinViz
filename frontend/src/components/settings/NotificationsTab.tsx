import React, { useEffect, useState } from 'react';

import { BellIcon, DevicePhoneMobileIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

import toast from 'react-hot-toast';

import { NotificationSettings } from '../../types';
import Button from '../common/Button';

interface NotificationsTabProps {
  settings: NotificationSettings;
  onSave: (data: Partial<NotificationSettings>) => Promise<void>;
}

const NotificationsTab: React.FC<NotificationsTabProps> = ({ settings, onSave }) => {
  const [formData, setFormData] = useState<NotificationSettings>(settings);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleToggle = (key: keyof NotificationSettings) => {
    setFormData((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      toast.success('Notification settings updated');
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const notificationGroups = [
    {
      title: 'Email Notifications',
      icon: EnvelopeIcon,
      items: [
        {
          key: 'email',
          label: 'Email Notifications',
          description: 'Receive notifications via email',
        },
        {
          key: 'weekly_summary',
          label: 'Weekly Summary',
          description: 'Get a weekly summary of your finances',
        },
        {
          key: 'marketing_emails',
          label: 'Marketing Emails',
          description: 'Receive updates and offers',
        },
      ],
    },
    {
      title: 'Push Notifications',
      icon: DevicePhoneMobileIcon,
      items: [
        {
          key: 'push',
          label: 'Push Notifications',
          description: 'Receive push notifications on your devices',
        },
        {
          key: 'budget_alerts',
          label: 'Budget Alerts',
          description: 'Get notified when you approach budget limits',
        },
        {
          key: 'large_transaction_alerts',
          label: 'Large Transaction Alerts',
          description: 'Get notified of large transactions',
        },
      ],
    },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {notificationGroups.map((group) => (
        <div key={group.title} className="space-y-4">
          <div className="flex items-center space-x-2">
            <group.icon className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-medium text-gray-900">{group.title}</h3>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            {group.items.map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div className="flex-1">
                  <label
                    htmlFor={item.key}
                    className="text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    {item.label}
                  </label>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  id={item.key}
                  aria-checked={formData[item.key as keyof NotificationSettings] as boolean}
                  onClick={() => handleToggle(item.key as keyof NotificationSettings)}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    ${formData[item.key as keyof NotificationSettings] ? 'bg-primary-600' : 'bg-gray-300'}
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${formData[item.key as keyof NotificationSettings] ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Test Notification Button */}
      <div className="bg-blue-50 rounded-lg p-4 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-blue-900">Test Notifications</h4>
          <p className="text-xs text-blue-700">Send a test notification to verify your settings</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => toast.success('Test notification sent!')}
        >
          <BellIcon className="h-4 w-4 mr-1" />
          Send Test
        </Button>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4 border-t">
        <Button type="submit" isLoading={loading}>
          Save Preferences
        </Button>
      </div>
    </form>
  );
};

export default NotificationsTab;
