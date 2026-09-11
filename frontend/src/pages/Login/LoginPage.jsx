import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { login, forgotPassword } from '../../features/auth/authSlice.js';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@schoolgroup.test');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [mode, setMode] = useState('login');
  const [forgotSent, setForgotSent] = useState(false);
  const { status, error } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'forgot') {
      await dispatch(forgotPassword({ email }));
      setForgotSent(true);
      return;
    }
    const result = await dispatch(login({ email, password, rememberMe }));
    if (login.fulfilled.match(result)) navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-brand-700">K-12 AI Journey Orchestrator</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to your operational dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {mode === 'forgot' ? (
            <>
              <h2 className="font-medium text-slate-800">Reset your password</h2>
              {forgotSent ? (
                <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
                  If that email exists, password reset instructions have been sent.
                </p>
              ) : (
                <div>
                  <label className="text-sm font-medium text-slate-700">Email</label>
                  <input className="input mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              )}
              <button className="btn-primary w-full" type="submit" disabled={status === 'loading'}>
                {status === 'loading' ? 'Sending...' : 'Send reset instructions'}
              </button>
              <button type="button" className="text-sm text-brand-600 w-full text-center" onClick={() => { setMode('login'); setForgotSent(false); }}>
                Back to login
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium text-slate-700">Email</label>
                <input className="input mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Password</label>
                <div className="relative mt-1">
                  <input
                    className="input pr-16"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-brand-600" onClick={() => setShowPassword((s) => !s)}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-600">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                  Remember me
                </label>
                <button type="button" className="text-brand-600" onClick={() => setMode('forgot')}>Forgot password?</button>
              </div>

              {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{error}</div>}

              <button className="btn-primary w-full" type="submit" disabled={status === 'loading'}>
                {status === 'loading' ? 'Signing in...' : 'Sign in'}
              </button>

              <p className="text-xs text-slate-400 text-center">
                Demo logins (password <code>Password123!</code>): admin / sales / marketing / agent / parent @schoolgroup.test
              </p>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
