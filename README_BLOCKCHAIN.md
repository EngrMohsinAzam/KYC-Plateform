# Blockchain Integration Guide

## Smart Contract Addresses

- **USDT Contract**: `0x08DB56aB63cB3ac8921bcb1e9bE57a0A0fD91F1a`
- **KYC Contract**: `0x927f6773D3B777F1d04f22893cbf9Fe69F624EB9`

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Update Contract ABIs**
   - The contract ABIs in `lib/contracts.ts` are basic templates
   - Update them with your actual deployed contract ABIs
   - You can get the ABI from your contract deployment or from Etherscan

3. **Network Configuration**
   - The app currently defaults to Ethereum mainnet
   - Update `getExplorerUrl()` in `app/decentralized-id/complete/page.tsx` to match your network
   - For testnets, update the explorer URL (e.g., `https://sepolia.etherscan.io`)

## How It Works

1. **User connects wallet** - MetaMask integration
2. **Balance check** - Verifies user has at least 2 USDT
3. **USDT Approval** - Approves KYC contract to spend 2 USDT
4. **KYC Submission** - Calls KYC contract with anonymous ID
5. **Transaction Hash** - Displays the blockchain transaction ID

## Important Notes

- The KYC contract function `submitKYCVerification` may need adjustment based on your actual contract
- Make sure the contract addresses match your deployed contracts
- Update the ABI if your contract functions differ
- Test on a testnet first before deploying to mainnet

## Contract Function Requirements

Your KYC contract should have a function that:
- Accepts the anonymous ID (bytes32)
- Accepts the USDT amount (uint256)
- Transfers USDT from user to contract
- Records the verification on-chain

Example function signature:
```solidity
function submitKYCVerification(bytes32 anonymousId, uint256 amount) external returns (uint256)
```

