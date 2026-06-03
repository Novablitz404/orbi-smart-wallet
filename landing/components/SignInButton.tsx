'use client';

const KEYS_URL = 'https://keys.orbiwallet.xyz';
const ACCOUNT_URL = 'https://account.orbiwallet.xyz';

export default function SignInButton({ className, label = 'Sign in', action = 'sign-in' }: { className?: string; label?: string; action?: 'sign-in' | 'create' }) {
  function handleClick() {
    if (action === 'create') {
      const redirect = encodeURIComponent(`${ACCOUNT_URL}/auth-callback`);
      window.location.href = `${ACCOUNT_URL}/create?redirect=${redirect}`;
    } else {
      const redirect = encodeURIComponent(`${ACCOUNT_URL}/auth-callback`);
      const origin = encodeURIComponent(window.location.origin);
      window.location.href = `${KEYS_URL}/connect?redirect=${redirect}&origin=${origin}`;
    }
  }

  return (
    <button onClick={handleClick} className={className}>
      {label}
    </button>
  );
}
