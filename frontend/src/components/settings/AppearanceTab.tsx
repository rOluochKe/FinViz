import React, { useEffect, useState } from 'react';

import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  BoltIcon,
  ComputerDesktopIcon,
  EyeIcon,
  MoonIcon,
  PaintBrushIcon,
  SunIcon,
} from '@heroicons/react/24/outline';

import toast from 'react-hot-toast';

import { AppearanceSettings } from '../../types';
import Button from '../common/Button';

interface AppearanceTabProps {
  settings: AppearanceSettings;
  onSave: (data: Partial<AppearanceSettings>) => Promise<void>;
}

const AppearanceTab: React.FC<AppearanceTabProps> = ({ settings, onSave }) => {
  const [formData, setFormData] = useState<AppearanceSettings>(settings);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleToggle = (key: keyof AppearanceSettings) => {
    if (typeof formData[key] === 'boolean') {
      setFormData((prev) => ({ ...prev, [key]: !prev[key] }));
    }
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    setFormData((prev) => ({ ...prev, theme }));
  };

  const handleDensityChange = (density: 'comfortable' | 'compact') => {
    setFormData((prev) => ({ ...prev, density }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      toast.success('Appearance settings updated');

      // Apply theme changes
      if (formData.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (formData.theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        // System preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Theme Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <PaintBrushIcon className="h-5 w-5 text-gray-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Theme</h3>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => handleThemeChange('light')}
            className={`p-4 rounded-lg border-2 transition-all ${
              formData.theme === 'light'
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <SunIcon
              className={`h-8 w-8 mx-auto mb-2 ${
                formData.theme === 'light' ? 'text-primary-600' : 'text-gray-500'
              }`}
            />
            <p
              className={`text-sm font-medium ${
                formData.theme === 'light' ? 'text-primary-600' : 'text-gray-700'
              }`}
            >
              Light
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleThemeChange('dark')}
            className={`p-4 rounded-lg border-2 transition-all ${
              formData.theme === 'dark'
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <MoonIcon
              className={`h-8 w-8 mx-auto mb-2 ${
                formData.theme === 'dark' ? 'text-primary-600' : 'text-gray-500'
              }`}
            />
            <p
              className={`text-sm font-medium ${
                formData.theme === 'dark' ? 'text-primary-600' : 'text-gray-700'
              }`}
            >
              Dark
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleThemeChange('system')}
            className={`p-4 rounded-lg border-2 transition-all ${
              formData.theme === 'system'
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <ComputerDesktopIcon
              className={`h-8 w-8 mx-auto mb-2 ${
                formData.theme === 'system' ? 'text-primary-600' : 'text-gray-500'
              }`}
            />
            <p
              className={`text-sm font-medium ${
                formData.theme === 'system' ? 'text-primary-600' : 'text-gray-700'
              }`}
            >
              System
            </p>
          </button>
        </div>
      </div>

      {/* Density */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          {formData.density === 'comfortable' ? (
            <ArrowsPointingOutIcon className="h-5 w-5 text-gray-500 mr-2" />
          ) : (
            <ArrowsPointingInIcon className="h-5 w-5 text-gray-500 mr-2" />
          )}
          <h3 className="text-lg font-medium text-gray-900">Density</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleDensityChange('comfortable')}
            className={`p-4 rounded-lg border-2 transition-all ${
              formData.density === 'comfortable'
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <ArrowsPointingOutIcon
              className={`h-8 w-8 mx-auto mb-2 ${
                formData.density === 'comfortable' ? 'text-primary-600' : 'text-gray-500'
              }`}
            />
            <p
              className={`text-sm font-medium ${
                formData.density === 'comfortable' ? 'text-primary-600' : 'text-gray-700'
              }`}
            >
              Comfortable
            </p>
            <p className="text-xs text-gray-500 mt-1">More spacing, easier to read</p>
          </button>

          <button
            type="button"
            onClick={() => handleDensityChange('compact')}
            className={`p-4 rounded-lg border-2 transition-all ${
              formData.density === 'compact'
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <ArrowsPointingInIcon
              className={`h-8 w-8 mx-auto mb-2 ${
                formData.density === 'compact' ? 'text-primary-600' : 'text-gray-500'
              }`}
            />
            <p
              className={`text-sm font-medium ${
                formData.density === 'compact' ? 'text-primary-600' : 'text-gray-700'
              }`}
            >
              Compact
            </p>
            <p className="text-xs text-gray-500 mt-1">Show more content, denser layout</p>
          </button>
        </div>
      </div>

      {/* Accessibility Options */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <EyeIcon className="h-5 w-5 text-gray-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Accessibility</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="animations" className="text-sm font-medium text-gray-700">
                Enable Animations
              </label>
              <p className="text-xs text-gray-500">Use animated transitions throughout the app</p>
            </div>
            <button
              type="button"
              role="switch"
              id="animations"
              aria-checked={formData.animations}
              onClick={() => handleToggle('animations')}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${formData.animations ? 'bg-primary-600' : 'bg-gray-300'}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${formData.animations ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="reduced_motion" className="text-sm font-medium text-gray-700">
                Reduced Motion
              </label>
              <p className="text-xs text-gray-500">Minimize animations and motion effects</p>
            </div>
            <button
              type="button"
              role="switch"
              id="reduced_motion"
              aria-checked={formData.reduced_motion}
              onClick={() => handleToggle('reduced_motion')}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${formData.reduced_motion ? 'bg-primary-600' : 'bg-gray-300'}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${formData.reduced_motion ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="high_contrast" className="text-sm font-medium text-gray-700">
                High Contrast
              </label>
              <p className="text-xs text-gray-500">Increase color contrast for better visibility</p>
            </div>
            <button
              type="button"
              role="switch"
              id="high_contrast"
              aria-checked={formData.high_contrast}
              onClick={() => handleToggle('high_contrast')}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${formData.high_contrast ? 'bg-primary-600' : 'bg-gray-300'}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${formData.high_contrast ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Performance */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <BoltIcon className="h-5 w-5 text-gray-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Performance</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Cache Data</p>
              <p className="text-xs text-gray-500">Store frequently accessed data locally</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                localStorage.clear();
                toast.success('Cache cleared');
              }}
            >
              Clear Cache
            </Button>
          </div>
        </div>
      </div>

      {/* Save Settings */}
      <div className="flex justify-end pt-4 border-t">
        <Button type="submit" isLoading={loading}>
          Save Appearance Settings
        </Button>
      </div>
    </form>
  );
};

export default AppearanceTab;
