
import { useState } from 'react';
import { api } from '../api/client';

export function AuthPanel({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    const normalizedEmail = email.trim().toLowerCase();

    try {
      if (mode === 'register') {
        await api.register(fullName.trim(), normalizedEmail, password);
      }

      await api.login(normalizedEmail, password);
      const result = await api.me();
      onLogin(result.user);
    } catch (err) {
      setError(err.message || (mode === 'register' ? 'Unable to create account' : 'Unable to sign in'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-frame">
        <a className="auth-brand" href="/">CampusFix® <span aria-hidden="true">✳︎</span></a>
        <form className="auth-card" onSubmit={handleSubmit}>
          <p className="auth-eyebrow">Student access</p>
          <h1>
          {mode === 'login' ? 'Welcome back' : 'Create your student account'}
          </h1>

          <p className="auth-intro">
            Sign in to report issues and track their progress.
          </p>

          {mode === 'register' && (
            <label className="auth-field">
              Full name
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                minLength={2}
                maxLength={120}
                autoComplete="name"
              />
            </label>
          )}

          <label className="auth-field">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={254}
              autoComplete="email"
            />
          </label>

          <label className="auth-field">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={12}
              maxLength={72}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
            {mode === 'register' && (
              <small>Use at least 12 characters.</small>
            )}
          </label>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button disabled={busy} type="submit" className="auth-submit">
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Register'}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
            }}
            className="auth-switch"
          >
            {mode === 'login'
              ? 'New student? Create an account'
              : 'Already registered? Sign in'}
          </button>
        </form>
      </div>
    </main>
  );
}
