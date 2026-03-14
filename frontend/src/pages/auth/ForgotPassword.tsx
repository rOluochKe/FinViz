import React from 'react';

import ForgotPasswordForm from '../../components/auth/ForgotPasswordForm';
import Card from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';

const ForgotPassword: React.FC = () => {
  const { forgotPassword, isLoading } = useAuth();

  const handleSubmit = async (data: { email: string }) => {
    await forgotPassword(data.email);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <ForgotPasswordForm onSubmit={handleSubmit} isLoading={isLoading} />
      </Card>
    </div>
  );
};

export default ForgotPassword;
