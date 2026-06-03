'use client';

const KEYS_URL = 'https://keys.orbiwallet.xyz';
const ACCOUNT_URL = 'https://account.orbiwallet.xyz';

export default function SignInButton({ className }: { className?: string }) {
  function handleSignIn() {
    const redirect = encodeURIComponent(`${ACCOUNT_URL}/auth-callback`);
    const origin = encodeURIComponent(window.location.origin);
    window.location.href = `${KEYS_URL}/connect?redirect=${redirect}&origin=${origin}`;
  }

  return (
    <button onClick={handleSignIn} className={className}>
      Sign in
    </button>
  );
}
