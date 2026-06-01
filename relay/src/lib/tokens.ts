import { getNetwork, getNativeSacId } from './stellar';

export interface TrackedToken {
  code: string;
  sacId: string;
}

const MAINNET_TOKENS: TrackedToken[] = [
  { code: 'USDC', sacId: 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75' },
  { code: 'EURC', sacId: 'CAZAQB3D7KSLSNOSSCMNOURNQMX6OPAS2YSHRZNK2BQHB2MNSB5AJBLZ' },
  { code: 'AQUA', sacId: 'CBXCLNUDRPNTQHSQ5AA4E3XBXMYCQZMFXWB2H4KZCTM7JB4CBYNPXLW' },
  { code: 'yXLM', sacId: 'CBLGBM7PNYLPUDBLPHZUZQGWGUBFQTQMQXWXMIXGDOCQXV7YSRGKBWB' },
];

export function getTrackedTokens(): TrackedToken[] {
  const native: TrackedToken = { code: 'XLM', sacId: getNativeSacId() };
  return getNetwork() === 'mainnet' ? [native, ...MAINNET_TOKENS] : [native];
}

export function getSacToCodeMap(): Map<string, string> {
  return new Map(getTrackedTokens().map(t => [t.sacId, t.code]));
}
