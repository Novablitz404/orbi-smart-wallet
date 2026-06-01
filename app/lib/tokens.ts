/**
 * Known Stellar tokens with their SAC contract IDs and metadata.
 * Icons from CoinGecko CDN — reliable and covers all major tokens.
 */

export interface StellarToken {
  code: string;
  name: string;
  issuer: string;
  sacId: string;
  decimals: number;
  icon?: string;
  network: 'mainnet' | 'testnet' | 'both';
}

export const XLM_ICON = 'https://s2.coinmarketcap.com/static/img/coins/64x64/512.png';

export const STELLAR_TOKENS: StellarToken[] = [
  {
    code: 'USDC',
    name: 'USD Coin',
    issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVV',
    sacId: 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75',
    decimals: 7,
    icon: 'https://assets.coingecko.com/coins/images/6319/large/usdc.png',
    network: 'mainnet',
  },
  {
    code: 'EURC',
    name: 'Euro Coin',
    issuer: 'GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP',
    sacId: 'CAZAQB3D7KSLSNOSSCMNOURNQMX6OPAS2YSHRZNK2BQHB2MNSB5AJBLZ',
    decimals: 7,
    icon: 'https://assets.coingecko.com/coins/images/26045/large/euro-coin.png',
    network: 'mainnet',
  },
  {
    code: 'AQUA',
    name: 'Aquarius',
    issuer: 'GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA',
    sacId: 'CBXCLNUDRPNTQHSQ5AA4E3XBXMYCQZMFXWB2H4KZCTM7JB4CBYNPXLW',
    decimals: 7,
    icon: 'https://stellar.expert/img/assets/AQUA-GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA.png',
    network: 'mainnet',
  },
  {
    code: 'yXLM',
    name: 'Yield XLM',
    issuer: 'GARDNV3Q7YGT4AKSDF25LT32YSCCW4EV22Y2TV3I2PU2MMXJTEDL5T55',
    sacId: 'CBLGBM7PNYLPUDBLPHZUZQGWGUBFQTQMQXWXMIXGDOCQXV7YSRGKBWB',
    decimals: 7,
    icon: 'https://stellar.expert/img/assets/yXLM-GARDNV3Q7YGT4AKSDF25LT32YSCCW4EV22Y2TV3I2PU2MMXJTEDL5T55.png',
    network: 'mainnet',
  },
];

/** Generate a colored first-letter SVG avatar for tokens without a working icon. */
export function tokenLetterAvatar(code: string): string {
  const colors = [
    '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
    '#ef4444', '#06b6d4', '#84cc16', '#f97316',
  ];
  const color = colors[code.charCodeAt(0) % colors.length];
  const letter = code.charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"><circle cx="18" cy="18" r="18" fill="${color}"/><text x="18" y="23" text-anchor="middle" font-family="system-ui,sans-serif" font-size="16" font-weight="700" fill="white">${letter}</text></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
