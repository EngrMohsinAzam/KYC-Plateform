'use client'

import { createConfig, http } from 'wagmi'
import { bscTestnet } from 'wagmi/chains'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'dac575710eb8362c0d28c55d2dcf73dc'

const chains = [bscTestnet] as const

export const wagmiConfig = createConfig({
  chains,
  connectors: [
    injected(), // Auto-detects injected wallets (MetaMask, etc.)
    metaMask(), // Explicit MetaMask connector
    walletConnect({
      projectId,
      metadata: {
        name: 'MiraKYC',
        description: 'KYC Verification Platform',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://mirakyc.com',
        icons: [`${typeof window !== 'undefined' ? window.location.origin : 'https://mirakyc.com'}/favicon.ico`]
      },
    }),
  ],
  transports: {
    [bscTestnet.id]: http('https://data-seed-prebsc-1-s1.binance.org:8545/'),
  },
})

