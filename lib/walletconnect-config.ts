export const walletConnectConfig = {
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'dac575710eb8362c0d28c55d2dcf73dc',
  metadata: {
    name: 'MiraKYC',
    description: 'KYC Verification Platform',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://mirakyc.com',
    icons: [`${typeof window !== 'undefined' ? window.location.origin : 'https://mirakyc.com'}/favicon.ico`]
  },
  chains: [
    {
      id: 97, 
      name: 'Binance Smart Chain Testnet',
      network: 'bsc-testnet',
      nativeCurrency: {
        decimals: 18,
        name: 'BNB',
        symbol: 'BNB',
      },
      rpcUrls: {
        default: {
          http: ['https://data-seed-prebsc-1-s1.binance.org:8545'],
        },
        public: {
          http: ['https://data-seed-prebsc-1-s1.binance.org:8545'],
        },
      },
      blockExplorers: {
        default: {
          name: 'BscScan',
          url: 'https://testnet.bscscan.com',
        },
      },
      testnet: true,
    },
  ],
}

