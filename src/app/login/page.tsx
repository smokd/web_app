'use client';

import { useState } from 'react';
import { login } from './actions';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError('');

    try {
      const result = await login(formData);

      if (result?.error) {
        setError(result.error);
        setPending(false);
      }
    } catch (error) {
      console.error('Login error:', error);

      setError(
        'Unable to sign in. Please try again.'
      );

      setPending(false);
    }
  }

  return (
    <main
      className="bg-primary"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: 420,
          padding: '2rem',
          borderRadius: 12,
        }}
      >
        <h1
          style={{
            marginBottom: '1.5rem',
            textAlign: 'center',
          }}
        >
          Polaris QA Login
        </h1>

        <form
          action={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <div>
            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="form-input"
              style={{
                width: '100%',
                padding: '0.6rem',
                borderRadius: 6,
                border: '1px solid var(--border)',
                marginTop: 4,
              }}
            />
          </div>

          <div>
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="form-input"
              style={{
                width: '100%',
                padding: '0.6rem',
                borderRadius: 6,
                border: '1px solid var(--border)',
                marginTop: 4,
              }}
            />
          </div>

          {error && (
            <p
              style={{
                color: '#c62828',
                fontSize: '0.9rem',
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.7rem',
              opacity: pending ? 0.7 : 1,
            }}
          >
            {pending
              ? 'Signing in…'
              : 'Sign In'}
          </button>
        </form>
      </div>
    </main>
  );
}
