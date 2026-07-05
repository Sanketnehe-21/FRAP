import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { apiClient } from '../api/client';
import { Button, Card, Input } from '../components/ui';
import { useToast } from '../context/ToastContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);
      const res = await apiClient.post('/api/v1/admin/auth/login', {
        username: data.username.trim(),
        password: data.password
      });
      
      // Save session to localStorage
      localStorage.setItem('admin-session', JSON.stringify(res.data));
      showToast('Logged in successfully!', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.error || 'Login failed. Please check your credentials.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="max-w-md w-full flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3">
          <div className="bg-blue-600 p-3.5 rounded-xl text-white shadow-lg animate-bounce">
            <ShieldCheck className="h-10 w-10" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">FRAP Admin Portal</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 font-medium">Platform Management Administration</p>
          </div>
        </div>

        <Card className="p-8 shadow-xl border border-zinc-200 dark:border-zinc-800">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-1">
            <Input
              label="Username"
              type="text"
              placeholder="admin"
              error={errors.username?.message as string}
              {...register('username', { required: 'Username is required' })}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message as string}
              {...register('password', { required: 'Password is required' })}
            />
            <Button
              type="submit"
              label="Authenticate Admin"
              isLoading={loading}
              className="w-full mt-4 h-11"
            />
          </form>
        </Card>
        
        <p className="text-center text-xs text-zinc-400 font-semibold uppercase tracking-wider">
          Authorized personnel only
        </p>
      </div>
    </div>
  );
};
