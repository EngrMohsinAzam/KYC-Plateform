import kycContractJson from './SimpleKYCWithUpdates.json'

// Smart Contract Addresses
export const CONTRACT_ADDRESSES = {
  USDT: '0x08DB56aB63cB3ac8921bcb1e9bE57a0A0fD91F1a',
  KYC: '0x927f6773D3B777F1d04f22893cbf9Fe69F624EB9',
}

// USDT ABI (ERC20 standard functions we need)
export const USDT_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function decimals() external view returns (uint8)',
]

// KYC Smart Contract ABI - using actual ABI from JSON file
export const KYC_ABI = kycContractJson.abi as any[]

// Amount to charge: $2 USDT
export const CHARGE_AMOUNT = '2' // Will be converted to proper decimals

