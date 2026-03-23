import React, { useEffect } from 'react';

import { yupResolver } from '@hookform/resolvers/yup';

import { useForm } from 'react-hook-form';

import * as yup from 'yup';

import { User } from '../../types';
import Button from '../common/Button';
import Input from '../common/Input';

interface UserFormProps {
  initialData?: User;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface UserFormData {
  first_name?: string;
  last_name?: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  preferences?: any;
}

const schema = yup.object().shape({
  first_name: yup.string().optional().max(50),
  last_name: yup.string().optional().max(50),
  email: yup.string().required('Email is required').email('Invalid email format'),
  role: yup.string().oneOf(['user', 'admin']).required('Role is required'),
  status: yup.string().oneOf(['active', 'inactive', 'suspended']).required('Status is required'),
});

const UserForm: React.FC<UserFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UserFormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: initialData
      ? {
          first_name: initialData.first_name || '',
          last_name: initialData.last_name || '',
          email: initialData.email,
          role: initialData.role,
          status: initialData.status,
        }
      : {
          role: 'user',
          status: 'active',
        },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        first_name: initialData.first_name || '',
        last_name: initialData.last_name || '',
        email: initialData.email,
        role: initialData.role,
        status: initialData.status,
      });
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="First Name"
          placeholder="Enter first name"
          error={errors.first_name?.message}
          {...register('first_name')}
        />
        <Input
          label="Last Name"
          placeholder="Enter last name"
          error={errors.last_name?.message}
          {...register('last_name')}
        />
      </div>

      {/* Email - Make read-only as admin shouldn't change email */}
      <Input
        label="Email"
        type="email"
        placeholder="Enter email"
        error={errors.email?.message}
        required
        disabled
        {...register('email')}
      />

      {/* Role Selection */}
      <div>
        <label className="input-label">Role</label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="user"
              {...register('role')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700">User</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="admin"
              {...register('role')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700">Admin</span>
          </label>
        </div>
        {errors.role && <p className="input-error">{errors.role.message}</p>}
      </div>

      {/* Status Selection */}
      <div>
        <label className="input-label">Status</label>
        <select {...register('status')} className="input-field">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
        {errors.status && <p className="input-error">{errors.status.message}</p>}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          Update User
        </Button>
      </div>
    </form>
  );
};

export default UserForm;
