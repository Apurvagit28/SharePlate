import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { UtensilsCrossed, Mail, Lock, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);

    if (mode === 'register') {
      const { error: signUpError } = await signUp(email.trim(), password);
      if (signUpError) {
        setError(signUpError);
        setSubmitting(false);
        return;
      }
      setInfo('Account created! You are now logged in.');
      setSubmitting(false);
      navigate(redirectTo, { replace: true });
      return;
    }

    const { error: signInError } = await signIn(email.trim(), password);
    if (signInError) {
      setError(signInError);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    navigate(redirectTo, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-stone-50 to-white flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <Link to="/" className="inline-flex items-center gap-2 text-stone-600 hover:text-green-700 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 text-green-700 rounded-2xl mb-4">
              <UtensilsCrossed className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-stone-800">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-stone-500 text-sm mt-1">
              {mode === 'login'
                ? 'Sign in to donate food and manage requests.'
                : 'Join SharePlate to start sharing surplus food.'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex items-start gap-3 mb-5">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {info && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 flex items-start gap-3 mb-5">
              <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{info}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-stone-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-colors text-stone-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-stone-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-colors text-stone-800"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-green-600 text-white py-3.5 rounded-xl font-semibold text-lg hover:bg-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-stone-500">
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  onClick={() => { setMode('register'); setError(null); setInfo(null); }}
                  className="text-green-700 font-semibold hover:underline"
                >
                  Register
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => { setMode('login'); setError(null); setInfo(null); }}
                  className="text-green-700 font-semibold hover:underline"
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
