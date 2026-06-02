'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [backendError, setBackendError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const redirect = searchParams.get('redirect');

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setBackendError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: data.username, password: data.password }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const errorMsg = result.message || 'Incorrect username or password. Please try again.';
        setBackendError(errorMsg);
        toast.error(errorMsg);
      } else {
        toast.success(`Welcome back, ${data.username}!`);
        const dest = redirect || '/';
        router.push(dest);
        router.refresh();
      }
    } catch (err: unknown) {
      const error = err as Error;
      const msg = error?.message || 'Something went wrong. Please try again.';
      setBackendError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div suppressHydrationWarning className="min-h-screen bg-darkbg flex items-center justify-center px-4 py-12">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-indigo/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-violet/10 rounded-full blur-[150px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <img
              src="/images/avatar.png"
              alt="CuongHoang"
              className="w-16 h-16 mx-auto rounded-2xl object-cover mb-4"
            />
          </Link>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-heading font-bold text-text-primary"
          >
            Welcome Back
          </motion.h1>
          <p className="text-text-secondary mt-2">Sign in to continue with CuongHoang</p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-darkcard border border-darkborder rounded-2xl p-8"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {backendError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400"
              >
                {backendError}
              </motion.div>
            )}

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Username</label>
              <input
                {...register('username')}
                type="text"
                placeholder="Enter your username"
                autoComplete="username"
                className={`w-full px-4 py-3 rounded-xl bg-darkbg border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-violet/50 transition-colors ${
                  errors.username
                    ? 'border-red-500/60 focus:border-red-500'
                    : 'border-darkborder'
                }`}
              />
              {errors.username && (
                <p className="text-red-500 text-sm mt-1.5">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className={`w-full px-4 py-3 pr-12 rounded-xl bg-darkbg border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-violet/50 transition-colors ${
                    errors.password
                      ? 'border-red-500/60 focus:border-red-500'
                      : 'border-darkborder'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1.5">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-neon-violet hover:text-neon-indigo transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              className="w-full py-3.5 bg-gradient-to-r from-neon-indigo to-neon-violet text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </motion.button>
          </form>

          <p className="text-center text-text-muted text-sm mt-6">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="text-neon-violet hover:text-neon-indigo transition-colors font-medium"
            >
              Sign Up
            </Link>
          </p>
        </motion.div>

        <p className="text-center text-text-muted text-sm mt-6">
          <Link href="/" className="hover:text-text-primary transition-colors">
            ← Back to Home
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="min-h-screen bg-darkbg flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-neon-violet" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
