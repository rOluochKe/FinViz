import React from 'react';

import { useNavigate } from 'react-router-dom';

import LoginForm from '../../components/auth/LoginForm';
import Card from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import { LoginCredentials } from '../../types';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const handleSubmit = async (data: LoginCredentials) => {
    await login(data);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600">FinViz Pro</h1>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Sign In</h2>
          <p className="mt-2 text-sm text-gray-600">
            Welcome back! Please sign in to your account.
          </p>
        </div>

        <LoginForm onSubmit={handleSubmit} isLoading={isLoading} />
      </Card>
    </div>
  );
};

export default Login;
