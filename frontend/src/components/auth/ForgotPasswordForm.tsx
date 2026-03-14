import React from 'react';

import { EnvelopeIcon } from '@heroicons/react/24/outline';

import { yupResolver } from '@hookform/resolvers/yup';

import { useForm } from 'react-hook-form';

import * as yup from 'yup';

import { Link } from 'react-router-dom';

import Button from '../common/Button';
import Input from '../common/Input';

interface ForgotPasswordFormData {
  email: string;
}

const schema = yup.object().shape({
  email: yup.string().required('Email is required').email('Invalid email format'),
});

interface ForgotPasswordFormProps {
  onSubmit: (data: ForgotPasswordFormData) => Promise<void>;
  isLoading: boolean;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onSubmit, isLoading }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: yupResolver(schema),
  });

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Forgot Password?</h2>
        <p className="mt-2 text-sm text-gray-600">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="Email Address"
          type="email"
          placeholder="Enter your email"
          error={errors.email?.message}
          leftIcon={<EnvelopeIcon className="h-5 w-5" />}
          {...register('email')}
        />

        <Button type="submit" isLoading={isLoading} fullWidth>
          Send Reset Link
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

export default ForgotPasswordForm;
