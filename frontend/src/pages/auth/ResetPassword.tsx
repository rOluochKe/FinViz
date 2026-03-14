import React from 'react';

import { useNavigate, useParams } from 'react-router-dom';

import ResetPasswordForm from '../../components/auth/ResetPasswordForm';
import Card from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';

const ResetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { resetPassword, isLoading } = useAuth();

  const handleSubmit = async (data: { password: string }) => {
    if (token) {
      await resetPassword(token, data.password);
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <ResetPasswordForm onSubmit={handleSubmit} isLoading={isLoading} />
      </Card>
    </div>
  );
};

export default ResetPassword;
