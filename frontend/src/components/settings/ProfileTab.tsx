import React, { useEffect, useState } from 'react';

import { CameraIcon } from '@heroicons/react/24/outline';

import toast from 'react-hot-toast';

import { ProfileSettings } from '../../types';
import Button from '../common/Button';
import Input from '../common/Input';

interface ProfileTabProps {
  settings: ProfileSettings;
  onSave: (data: Partial<ProfileSettings>) => Promise<void>;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ settings, onSave }) => {
  const [formData, setFormData] = useState<ProfileSettings>(settings);
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Common timezones list
  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Anchorage',
    'America/Honolulu',
    'America/Toronto',
    'America/Vancouver',
    'America/Mexico_City',
    'America/Sao_Paulo',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Rome',
    'Europe/Madrid',
    'Europe/Amsterdam',
    'Europe/Moscow',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Bangkok',
    'Asia/Singapore',
    'Asia/Hong_Kong',
    'Asia/Shanghai',
    'Asia/Tokyo',
    'Asia/Seoul',
    'Australia/Sydney',
    'Australia/Melbourne',
    'Australia/Perth',
    'Pacific/Auckland',
    'Pacific/Honolulu',
  ];

  const currencies = [
    { code: 'USD', name: 'US Dollar ($)' },
    { code: 'EUR', name: 'Euro (€)' },
    { code: 'GBP', name: 'British Pound (£)' },
    { code: 'JPY', name: 'Japanese Yen (¥)' },
    { code: 'CAD', name: 'Canadian Dollar (C$)' },
    { code: 'AUD', name: 'Australian Dollar (A$)' },
    { code: 'CHF', name: 'Swiss Franc (Fr)' },
    { code: 'CNY', name: 'Chinese Yuan (¥)' },
    { code: 'INR', name: 'Indian Rupee (₹)' },
    { code: 'BRL', name: 'Brazilian Real (R$)' },
    { code: 'MXN', name: 'Mexican Peso ($)' },
    { code: 'SGD', name: 'Singapore Dollar (S$)' },
    { code: 'NZD', name: 'New Zealand Dollar (NZ$)' },
    { code: 'HKD', name: 'Hong Kong Dollar (HK$)' },
    { code: 'KRW', name: 'South Korean Won (₩)' },
    { code: 'RUB', name: 'Russian Ruble (₽)' },
    { code: 'ZAR', name: 'South African Rand (R)' },
  ];

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' },
    { code: 'nl', name: 'Dutch' },
    { code: 'pl', name: 'Polish' },
    { code: 'tr', name: 'Turkish' },
    { code: 'vi', name: 'Vietnamese' },
    { code: 'th', name: 'Thai' },
    { code: 'sv', name: 'Swedish' },
    { code: 'da', name: 'Danish' },
    { code: 'fi', name: 'Finnish' },
    { code: 'no', name: 'Norwegian' },
  ];

  const dateFormats = [
    { value: 'YYYY-MM-DD', label: '2024-12-31 (ISO)' },
    { value: 'MM/DD/YYYY', label: '12/31/2024 (US)' },
    { value: 'DD/MM/YYYY', label: '31/12/2024 (UK/EU)' },
    { value: 'MMMM D, YYYY', label: 'December 31, 2024 (Long)' },
    { value: 'MMM D, YYYY', label: 'Dec 31, 2024 (Short)' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center space-x-6">
        <div className="relative">
          <div className="h-24 w-24 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-primary-600">
                {formData.first_name?.[0] || ''}
                {formData.last_name?.[0] || ''}
              </span>
            )}
          </div>
          <label
            htmlFor="avatar-upload"
            className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-lg cursor-pointer hover:bg-gray-50"
          >
            <CameraIcon className="h-4 w-4 text-gray-600" />
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </label>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">Profile Picture</p>
          <p className="text-xs text-gray-500 mt-1">JPG, GIF or PNG. Max size 2MB.</p>
        </div>
      </div>

      {/* Name Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="First Name"
          name="first_name"
          value={formData.first_name || ''}
          onChange={handleChange}
          placeholder="Enter first name"
        />
        <Input
          label="Last Name"
          name="last_name"
          value={formData.last_name || ''}
          onChange={handleChange}
          placeholder="Enter last name"
        />
      </div>

      {/* Contact Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter email"
          required
        />
        <Input
          label="Phone"
          name="phone"
          value={formData.phone || ''}
          onChange={handleChange}
          placeholder="Enter phone number"
        />
      </div>

      {/* Preferences */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="input-label">Timezone</label>
          <select
            name="timezone"
            value={formData.timezone}
            onChange={handleChange}
            className="input-field"
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz.replace(/_/g, ' ').replace('/', ' / ')}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="input-label">Language</label>
          <select
            name="language"
            value={formData.language}
            onChange={handleChange}
            className="input-field"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="input-label">Currency</label>
          <select
            name="currency"
            value={formData.currency}
            onChange={handleChange}
            className="input-field"
          >
            {currencies.map((curr) => (
              <option key={curr.code} value={curr.code}>
                {curr.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="input-label">Date Format</label>
          <select
            name="date_format"
            value={formData.date_format}
            onChange={handleChange}
            className="input-field"
          >
            {dateFormats.map((format) => (
              <option key={format.value} value={format.value}>
                {format.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4 border-t">
        <Button type="submit" isLoading={loading}>
          Save Changes
        </Button>
      </div>
    </form>
  );
};

export default ProfileTab;
