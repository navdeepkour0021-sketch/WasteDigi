import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Mail, Check, X, Loader } from 'lucide-react';

const SecuritySettings: React.FC = () => {
  const { user, enableTwoFactor, disableTwoFactor } = useAuth();
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [pendingAction, setPendingAction] = useState<'enable' | 'disable' | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleToggle2FA = async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');

      const action = user?.twoFactorEnabled ? 'disable' : 'enable';
      setPendingAction(action);

      const response = user?.twoFactorEnabled 
        ? await disableTwoFactor()
        : await enableTwoFactor();

      setMessage(response.message);
      setShowCodeInput(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = pendingAction === 'enable'
        ? await enableTwoFactor(verificationCode)
        : await disableTwoFactor(verificationCode);

      setMessage(response.message);
      setShowCodeInput(false);
      setVerificationCode('');
      setPendingAction(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowCodeInput(false);
    setVerificationCode('');
    setPendingAction(null);
    setMessage('');
    setError('');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Security Settings</h2>
            <p className="text-sm text-gray-600">Manage your account security preferences</p>
          </div>
        </div>

        {message && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-green-500" />
              <p className="text-green-800">{message}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <X className="h-5 w-5 text-red-500" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Two-Factor Authentication */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <h3 className="font-medium text-gray-900">Email Two-Factor Authentication</h3>
                <p className="text-sm text-gray-600">
                  Receive verification codes via email for enhanced security
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user?.twoFactorEnabled 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </span>
              {!showCodeInput && (
                <button
                  onClick={handleToggle2FA}
                  disabled={loading}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
                    user?.twoFactorEnabled
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {loading ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    user?.twoFactorEnabled ? 'Disable' : 'Enable'
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Verification Code Input */}
          {showCodeInput && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Enter Verification Code</h4>
              <p className="text-sm text-blue-700 mb-4">
                We've sent a 6-digit verification code to your email address.
              </p>
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="000000"
                  className="w-32 px-3 py-2 border border-blue-300 rounded-lg text-center text-lg tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleVerifyCode}
                  disabled={loading || verificationCode.length !== 6}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {loading ? <Loader className="h-4 w-4 animate-spin" /> : 'Verify'}
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Account Information */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="font-medium text-gray-900 mb-4">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Role:</span>
              <span className="ml-2 font-medium capitalize">{user?.role}</span>
            </div>
            <div>
              <span className="text-gray-600">Email:</span>
              <span className="ml-2 font-medium">{user?.email}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;