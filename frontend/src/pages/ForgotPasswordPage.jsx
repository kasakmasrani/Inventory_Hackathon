import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1=email, 2=otp+new pw
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const requestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await authAPI.requestOTP({ email });
      setMessage(data.message);
      setStep(2);
    } catch {
      setError('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authAPI.verifyOTP({ email, otp, new_password: newPassword });
      setMessage('Password reset successful!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 bg-surface-light border border-primary-800/30 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all";

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 p-4">
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-100">Reset Password</h1>
          <p className="text-gray-400 mt-2">
            {step === 1 ? 'Enter your email to receive an OTP' : 'Enter the OTP and your new password'}
          </p>
        </div>
        <div className="bg-surface/80 backdrop-blur-xl border border-primary-800/30 rounded-2xl p-8 shadow-2xl">
          {error && <div className="mb-4 p-3 bg-danger-500/10 border border-danger-500/30 rounded-xl text-danger-400 text-sm">{error}</div>}
          {message && <div className="mb-4 p-3 bg-accent-500/10 border border-accent-500/30 rounded-xl text-accent-400 text-sm">{message}</div>}

          {step === 1 ? (
            <form onSubmit={requestOTP}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} placeholder="you@example.com" />
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50">
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyOTP}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">OTP Code</label>
                <input value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} className={inputClass} placeholder="123456" />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className={inputClass} placeholder="••••••••" />
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50">
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}
          <p className="mt-4 text-center text-sm text-gray-400">
            <Link to="/login" className="text-primary-400 hover:text-primary-300">Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
