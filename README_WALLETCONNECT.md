# WalletConnect v2 Integration Guide

This project uses WalletConnect v2 for mobile wallet connection via QR code scanning.

## Setup Instructions

### 1. Get WalletConnect Project ID

1. Go to https://cloud.walletconnect.com
2. Sign up or log in
3. Create a new project
4. Copy your Project ID

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_API_URL=https://xzfjrnv9-3099.asse.devtunnels.ms
```

### 3. Backend Endpoint

Your backend needs to implement the `/verify-signature` endpoint:

**Endpoint:** `POST /verify-signature`

**Request Body:**
```json
{
  "message": "Sign in to MiraKYC\n\nWallet: 0x...\nTimestamp: 1234567890",
  "signature": "0x...",
  "address": "0x..."
}
```

**Response (Success):**
```json
{
  "success": true,
  "token": "jwt_token_here"
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Invalid signature"
}
```

### 4. Backend Implementation Example (Node.js + Express + ethers)

```javascript
const express = require('express');
const { ethers } = require('ethers');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

app.post('/verify-signature', async (req, res) => {
  try {
    const { message, signature, address } = req.body;

    // Verify signature using ethers
    const recoveredAddress = ethers.verifyMessage(message, signature);

    // Check if recovered address matches provided address
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { address: address.toLowerCase() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token
    });
  } catch (error) {
    console.error('Signature verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});
```

## Usage

### Using the WalletConnectButton Component

```tsx
import { WalletConnectButton } from '@/components/wallet/WalletConnectButton'

function MyComponent() {
  return (
    <WalletConnectButton
      onConnect={(address) => {
        console.log('Wallet connected:', address)
      }}
      onJWTReceived={(token) => {
        console.log('JWT received:', token)
      }}
    />
  )
}
```

### Standalone Page

Visit `/wallet-connect` to see a standalone wallet connection page.

## Features

- ✅ QR-based wallet connection (mobile-friendly)
- ✅ Supports MetaMask Mobile, Trust Wallet, and other WalletConnect-compatible wallets
- ✅ Message signing for authentication
- ✅ Backend signature verification
- ✅ JWT token storage in localStorage
- ✅ Fully responsive (mobile & desktop)
- ✅ No injected providers (QR-only method)

## Mobile Flow

1. User clicks "Connect Wallet"
2. QR code modal appears
3. User scans QR with mobile wallet app
4. User approves connection in wallet
5. Wallet is connected
6. User signs message
7. Signature is verified by backend
8. JWT token is received and stored

## Files Created

- `lib/wagmi-config.tsx` - Wagmi and WalletConnect configuration
- `components/providers/WagmiProvider.tsx` - Wagmi provider wrapper
- `components/wallet/WalletConnectButton.tsx` - Wallet connection button component
- `app/wallet-connect/page.tsx` - Standalone wallet connection page
- `app/layout.tsx` - Updated to include WagmiProvider

## Notes

- The packages are deprecated but still functional
- For production, consider upgrading to Reown AppKit (the new version)
- Make sure to set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` in your environment variables

