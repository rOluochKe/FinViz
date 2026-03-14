import React from 'react';

import { LockClosedIcon } from '@heroicons/react/24/outline';

import { yupResolver } from '@hookform/resolvers/yup';

import { useForm } from 'react-hook-form';

import * as yup from 'yup';

import { Link } from 'react-router-dom';

import Button from '../common/Button';
import Input from '../common/Input';

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

const schema = yup.object().shape({
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
});

interface ResetPasswordFormProps {
  onSubmit: (data: ResetPasswordFormData) => Promise<void>;
  isLoading: boolean;
}

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ onSubmit, isLoading }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: yupResolver(schema),
  });

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Reset Password</h2>
        <p className="mt-2 text-sm text-gray-600">Enter your new password below.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="New Password"
          type="password"
          placeholder="Enter new password"
          error={errors.password?.message}
          leftIcon={<LockClosedIcon className="h-5 w-5" />}
          {...register('password')}
        />

        <Input
          label="Confirm New Password"
          type="password"
          placeholder="Confirm new password"
          error={errors.confirmPassword?.message}
          leftIcon={<LockClosedIcon className="h-5 w-5" />}
          {...register('confirmPassword')}
        />

        <div className="text-xs text-gray-500">
          <p>Password must contain:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>At least 8 characters</li>
            <li>At least one uppercase letter</li>
            <li>At least one lowercase letter</li>
            <li>At least one number</li>
            <li>At least one special character</li>
          </ul>
        </div>

        <Button type="submit" isLoading={isLoading} fullWidth>
          Reset Password
        </Button>

        <p className="text-center text-sm text-gray-600">
          Remember your password?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-500 font-medium">
            Back to login
          </Link>
        </p>
      </form>
    </div>
  );
};

export default ResetPasswordForm;
