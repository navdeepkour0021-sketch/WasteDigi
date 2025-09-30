import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf, Mail, Lock, Eye, EyeOff } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error, user, clearError } = useAuth();
  const navigate = useNavigate();

useEffect(() => {
  if (user) {
    navigate('/');
  }
}, [user, navigate]);


useEffect(() => {
  clearError();
}, []); 


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await login(email, password, twoFactorCode);
      if (result.requiresTwoFactor) {
        setRequiresTwoFactor(true);
      }
    } catch (error) {
      // Error is handled by the auth context
    }
  };

  const fillDemoCredentials = () => {
    setEmail('demo@restaurant.com');
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="flex items-center justify-center w-16 h-16 bg-green-600 rounded-xl shadow-lg">
              <Leaf className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Welcome to WasteWise</h2>
          <p className="mt-2 text-sm text-gray-600">
            {requiresTwoFactor ? 'Enter the verification code sent to your email' : 'Sign in to your restaurant management account'}
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-xl">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {!requiresTwoFactor && (
              <>
                <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:z-10"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full pl-10 pr-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:z-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>
              </>
            )}

            {requiresTwoFactor && (
              <div>
                <label htmlFor="twoFactorCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Verification Code
                </label>
                <input
                  id="twoFactorCode"
                  name="twoFactorCode"
                  type="text"
                  required
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:z-10 text-center text-lg tracking-widest"
                  placeholder="000000"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Enter the 6-digit code sent to your email
                </p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Verifying...' : requiresTwoFactor ? 'Verify Code' : 'Sign in'}
              </button>
            </div>

            {!requiresTwoFactor && (
              <>
                <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or try demo</span>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                Use Demo Account
              </button>
            </div>
              </>
            )}

            {requiresTwoFactor && (
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setRequiresTwoFactor(false);
                    setTwoFactorCode('');
                    clearError();
                  }}
                  className="w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  Back to Login
                </button>
              </div>
            )}
          </form>

          {!requiresTwoFactor && (
            <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">New to WasteWise?</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                to="/register"
                className="font-medium text-green-600 hover:text-green-500 transition-colors"
              >
                Create your account
              </Link>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;