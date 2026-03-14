import React from 'react';

import { EnvelopeIcon, LockClosedIcon, UserIcon } from '@heroicons/react/24/outline';

import { yupResolver } from '@hookform/resolvers/yup';

import { useForm } from 'react-hook-form';

import * as yup from 'yup';

import { Link } from 'react-router-dom';

import Button from '../common/Button';
import Input from '../common/Input';

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  first_name?: string | undefined;
  last_name?: string | undefined;
}

// Define the schema with proper typing
const schema = yup.object().shape({
  username: yup
    .string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be at most 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: yup.string().required('Email is required').email('Invalid email format'),
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
  first_name: yup.string().optional().nullable(),
  last_name: yup.string().optional().nullable(),
});

interface RegisterFormProps {
  onSubmit: (data: RegisterFormData) => Promise<void>;
  isLoading: boolean;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSubmit, isLoading }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      first_name: '',
      last_name: '',
    },
  });

  const handleFormSubmit = async (data: RegisterFormData) => {
    await onSubmit(data);
  };

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <Input
          label="Username"
          type="text"
          placeholder="Choose a username"
          error={errors.username?.message}
          leftIcon={<UserIcon className="h-5 w-5" />}
          {...register('username')}
        />

        <Input
          label="Email"
          type="email"
          placeholder="Enter your email"
          error={errors.email?.message}
          leftIcon={<EnvelopeIcon className="h-5 w-5" />}
          {...register('email')}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            type="text"
            placeholder="First name"
            error={errors.first_name?.message}
            {...register('first_name')}
          />

          <Input
            label="Last Name"
            type="text"
            placeholder="Last name"
            error={errors.last_name?.message}
            {...register('last_name')}
          />
        </div>

        <Input
          label="Password"
          type="password"
          placeholder="Create a password"
          error={errors.password?.message}
          leftIcon={<LockClosedIcon className="h-5 w-5" />}
          {...register('password')}
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="Confirm your password"
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
          Create Account
        </Button>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-500 font-medium">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterForm;
