import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Mail, Lock, AlertCircle, Shield } from 'lucide-react';

export default function AdminAuth() {
  const navigate = useNavigate();
  const { signup, login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = isLogin
        ? await login(email, password)
        : await signup(email, password, 'admin');

      if (result.success) {
        navigate('/admin-dashboard');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-6 md:px-12 py-8">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-primary hover:text-primary/80 mb-8 font-medium text-lg"
          data-testid="back-button"
        >
          <ArrowLeft className="w-6 h-6" strokeWidth={2} />
          Back to Home
        </button>

        <div className="bg-surface border-2 border-border rounded-lg p-8 shadow-hard">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-10 h-10 text-primary" strokeWidth={2} />
            <h1 className="text-3xl md:text-4xl font-bold text-primary">
              Admin Access
            </h1>
          </div>
          <p className="text-base md:text-lg text-primary mb-8">
            {isLogin ? 'Login to manage vendors' : 'Register as an administrator'}
          </p>

          {error && (
            <div className="bg-error/10 border-2 border-error rounded-lg p-4 mb-6 flex items-start gap-3" data-testid="error-message">
              <AlertCircle className="w-6 h-6 text-error flex-shrink-0 mt-0.5" strokeWidth={2} />
              <p className="text-base text-error font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-lg font-bold mb-2 text-primary">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-primary/60" strokeWidth={2} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 border-2 border-border rounded-md pl-14 pr-4 text-lg focus:border-primary focus:ring-4 focus:ring-secondary/50 outline-none bg-white text-primary placeholder:text-gray-500"
                  placeholder="admin@example.com"
                  required
                  data-testid="email-input"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-lg font-bold mb-2 text-primary">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-primary/60" strokeWidth={2} />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 border-2 border-border rounded-md pl-14 pr-4 text-lg focus:border-primary focus:ring-4 focus:ring-secondary/50 outline-none bg-white text-primary placeholder:text-gray-500"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  data-testid="password-input"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 rounded-full font-bold text-lg transition-transform active:scale-95 focus:ring-4 focus:ring-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="submit-button"
            >
              {loading ? 'Please wait...' : isLogin ? 'Login' : 'Register'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-primary hover:text-primary/80 font-medium text-base underline"
              data-testid="toggle-auth-mode"
            >
              {isLogin ? 'Register new admin' : 'Already registered? Login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}