import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const [form, setForm] = useState({
    email: '', username: '', password: '', password2: '',
    first_name: '', last_name: '', role: 'staff', phone: ''
  });
  const [errors, setErrors] = useState({});       // field-level errors
  const [generalError, setGeneralError] = useState(''); // top-level error
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear the error for this field as the user types
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');

    // Client-side validation
    const newErrors = {};
    if (!form.email) newErrors.email = ['Email is required.'];
    if (!form.username) newErrors.username = ['Username is required.'];
    if (!form.password) newErrors.password = ['Password is required.'];
    if (form.password.length > 0 && form.password.length < 8) {
      newErrors.password = ['Password must be at least 8 characters.'];
    }
    if (form.password !== form.password2) {
      newErrors.password2 = ['Passwords do not match.'];
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        // Django REST Framework returns { field: [errors], ... }
        const fieldErrors = {};
        const nonFieldMessages = [];
        for (const [key, value] of Object.entries(data)) {
          const messages = Array.isArray(value) ? value : [String(value)];
          if (key === 'non_field_errors' || key === 'detail' || key === 'error') {
            nonFieldMessages.push(...messages);
          } else {
            fieldErrors[key] = messages;
          }
        }
        setErrors(fieldErrors);
        if (nonFieldMessages.length > 0) {
          setGeneralError(nonFieldMessages.join(' '));
        } else if (Object.keys(fieldErrors).length === 0) {
          setGeneralError('Registration failed. Please try again.');
        }
      } else if (typeof data === 'string') {
        setGeneralError(data);
      } else {
        setGeneralError('Registration failed. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full px-4 py-3 bg-surface-light border rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 transition-all ${
      errors[field]
        ? 'border-danger-500/60 focus:border-danger-400 focus:ring-danger-400'
        : 'border-primary-800/30 focus:border-primary-500 focus:ring-primary-500'
    }`;

  const FieldError = ({ field }) => {
    if (!errors[field]) return null;
    return (
      <div className="mt-1.5 space-y-0.5">
        {errors[field].map((msg, i) => (
          <p key={i} className="text-xs text-danger-400 flex items-center gap-1">
            <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {msg}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl" />
      </div>
      <div className="relative w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">Create Account</h1>
          <p className="text-gray-400 mt-2">Join CoreInventory to manage your warehouse</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-surface/80 backdrop-blur-xl border border-primary-800/30 rounded-2xl p-8 shadow-2xl">
          {generalError && (
            <div className="mb-4 p-3 bg-danger-500/10 border border-danger-500/30 rounded-xl text-danger-400 text-sm flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{generalError}</span>
            </div>
          )}

          {/* Password requirements hint */}
          {Object.keys(errors).length > 0 && (errors.password || errors.password2) && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-xs">
              <p className="font-medium mb-1">Password requirements:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>At least 8 characters long</li>
                <li>Can't be entirely numeric</li>
                <li>Can't be a commonly used password</li>
                <li>Can't be too similar to your username or email</li>
              </ul>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
              <input name="first_name" value={form.first_name} onChange={handleChange} className={inputClass('first_name')} placeholder="John" />
              <FieldError field="first_name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
              <input name="last_name" value={form.last_name} onChange={handleChange} className={inputClass('last_name')} placeholder="Doe" />
              <FieldError field="last_name" />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required className={inputClass('email')} placeholder="you@example.com" />
            <FieldError field="email" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Username *</label>
            <input name="username" value={form.username} onChange={handleChange} required className={inputClass('username')} placeholder="johndoe" />
            <FieldError field="username" />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
              <select name="role" value={form.role} onChange={handleChange} className={inputClass('role')}>
                <option value="staff">Warehouse Staff</option>
                <option value="manager">Inventory Manager</option>
              </select>
              <FieldError field="role" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} className={inputClass('phone')} placeholder="+91..." />
              <FieldError field="phone" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password *</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} required className={inputClass('password')} placeholder="••••••••" />
              <FieldError field="password" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirm *</label>
              <input type="password" name="password2" value={form.password2} onChange={handleChange} required className={inputClass('password2')} placeholder="••••••••" />
              <FieldError field="password2" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-primary-600 to-accent-500 hover:from-primary-500 hover:to-accent-400 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Account'}
          </button>
          <p className="mt-4 text-center text-sm text-gray-400">
            Already have an account? <Link to="/login" className="text-primary-400 hover:text-primary-300">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
