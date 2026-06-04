const RELAY_URL = process.env.NEXT_PUBLIC_RELAY_URL ?? 'https://api.orbiwallet.xyz';

export interface DevAccount {
  developerName: string;
  email: string;
  deployerPublicKey: string | null;
  sponsorshipEnabled: boolean;
  apiKeyHint: string;
}

export interface DeployerBalance {
  address: string;
  balanceXlm: string;
  balanceStroops: string;
}

async function devFetch(path: string, sessionToken: string, options?: RequestInit) {
  const res = await fetch(`${RELAY_URL}/v1/dev${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionToken}`,
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function getMe(sessionToken: string): Promise<DevAccount> {
  return devFetch('/me', sessionToken);
}

export async function getBalance(sessionToken: string): Promise<DeployerBalance> {
  return devFetch('/balance', sessionToken);
}

export async function setDeployer(sessionToken: string, deployerPublicKey: string): Promise<void> {
  await devFetch('/deployer', sessionToken, {
    method: 'PATCH',
    body: JSON.stringify({ deployerPublicKey }),
  });
}

export async function rotateKey(sessionToken: string): Promise<{ apiKey: string }> {
  return devFetch('/rotate-key', sessionToken, { method: 'POST' });
}

export async function setSponsorship(sessionToken: string, enabled: boolean): Promise<void> {
  await devFetch('/sponsorship', sessionToken, {
    method: 'PATCH',
    body: JSON.stringify({ enabled }),
  });
}
