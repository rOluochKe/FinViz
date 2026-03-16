import React, { useState } from 'react';

import {
  ClockIcon,
  DevicePhoneMobileIcon,
  ExclamationTriangleIcon,
  KeyIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

import toast from 'react-hot-toast';

import { SecuritySettings } from '../../types';
import Button from '../common/Button';
import Input from '../common/Input';

interface SecurityTabProps {
  settings: SecuritySettings;
  onSave: (data: Partial<SecuritySettings>) => Promise<void>;
  onChangePassword: (current: string, newPassword: string) => Promise<void>;
  onDeactivate: () => Promise<void>;
}

const SecurityTab: React.FC<SecurityTabProps> = ({
  settings,
  onSave,
  onChangePassword,
  onDeactivate,
}) => {
  const [formData, setFormData] = useState<SecuritySettings>(settings);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [devices, setDevices] = useState<any[]>([
    { id: '1', name: 'Chrome on Windows', lastActive: '2 hours ago', current: true },
    { id: '2', name: 'Safari on iPhone', lastActive: '2 days ago', current: false },
    { id: '3', name: 'Firefox on Mac', lastActive: '1 week ago', current: false },
  ]);

  // Password form state
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const handleToggle = (key: keyof SecuritySettings) => {
    if (typeof formData[key] === 'boolean') {
      setFormData((prev) => ({ ...prev, [key]: !prev[key] }));
    }
  };

  const handleSessionTimeoutChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, session_timeout: parseInt(e.target.value) }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new !== passwordData.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    setPasswordLoading(true);
    try {
      await onChangePassword(passwordData.current, passwordData.new);
      toast.success('Password changed successfully');
      setShowPasswordForm(false);
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleRevokeDevice = (deviceId: string) => {
    setDevices(devices.filter((d) => d.id !== deviceId));
    toast.success('Device access revoked');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      toast.success('Security settings updated');
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Password Change */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <KeyIcon className="h-5 w-5 text-gray-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Password</h3>
          </div>
          {!showPasswordForm && (
            <Button size="sm" onClick={() => setShowPasswordForm(true)}>
              Change Password
            </Button>
          )}
        </div>

        {showPasswordForm ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              name="current"
              value={passwordData.current}
              onChange={handlePasswordChange}
              required
            />
            <Input
              label="New Password"
              type="password"
              name="new"
              value={passwordData.new}
              onChange={handlePasswordChange}
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              name="confirm"
              value={passwordData.confirm}
              onChange={handlePasswordChange}
              required
            />
            <div className="flex space-x-3">
              <Button type="submit" isLoading={passwordLoading}>
                Update Password
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowPasswordForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-gray-500">••••••••</p>
        )}
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-5 w-5 text-gray-500 mr-2" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">Two-Factor Authentication</h3>
              <p className="text-sm text-gray-500">
                Add an extra layer of security to your account
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={formData.two_factor_enabled}
            onClick={() => handleToggle('two_factor_enabled')}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              ${formData.two_factor_enabled ? 'bg-primary-600' : 'bg-gray-300'}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${formData.two_factor_enabled ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
        </div>
      </div>

      {/* Session Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <ClockIcon className="h-5 w-5 text-gray-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Session Settings</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="session_timeout" className="text-sm font-medium text-gray-700">
                Session Timeout
              </label>
              <p className="text-xs text-gray-500">Automatically log out after inactivity</p>
            </div>
            <select
              id="session_timeout"
              value={formData.session_timeout}
              onChange={handleSessionTimeoutChange}
              className="input-field w-32"
            >
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="60">1 hour</option>
              <option value="120">2 hours</option>
              <option value="240">4 hours</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="login_notifications" className="text-sm font-medium text-gray-700">
                Login Notifications
              </label>
              <p className="text-xs text-gray-500">Get notified of new logins to your account</p>
            </div>
            <button
              type="button"
              role="switch"
              id="login_notifications"
              aria-checked={formData.login_notifications}
              onClick={() => handleToggle('login_notifications')}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${formData.login_notifications ? 'bg-primary-600' : 'bg-gray-300'}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${formData.login_notifications ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Connected Devices */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <DevicePhoneMobileIcon className="h-5 w-5 text-gray-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Connected Devices</h3>
        </div>

        <div className="space-y-3">
          {devices.map((device) => (
            <div
              key={device.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {device.name}
                  {device.current && <span className="ml-2 text-xs text-green-600">(Current)</span>}
                </p>
                <p className="text-xs text-gray-500">Last active: {device.lastActive}</p>
              </div>
              {!device.current && (
                <Button size="sm" variant="danger" onClick={() => handleRevokeDevice(device.id)}>
                  Revoke
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Deactivate Account */}
      <div className="bg-red-50 rounded-lg border border-red-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
            <div>
              <h3 className="text-lg font-medium text-red-900">Deactivate Account</h3>
              <p className="text-sm text-red-700 mt-1">
                Once you deactivate your account, all your data will be permanently deleted. This
                action cannot be undone.
              </p>
            </div>
          </div>
          {!showDeactivateConfirm ? (
            <Button variant="danger" onClick={() => setShowDeactivateConfirm(true)}>
              Deactivate
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button variant="danger" onClick={onDeactivate}>
                Confirm
              </Button>
              <Button variant="secondary" onClick={() => setShowDeactivateConfirm(false)}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Save Settings */}
      <form onSubmit={handleSubmit}>
        <div className="flex justify-end pt-4 border-t">
          <Button type="submit" isLoading={loading}>
            Save Security Settings
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SecurityTab;
