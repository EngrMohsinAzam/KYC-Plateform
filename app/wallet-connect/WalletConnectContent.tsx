'use client'

import { WalletConnectButton } from '@/components/wallet/WalletConnectButton'

export default function WalletConnectPageContent() {
  return (
    <div className="min-h-screen bg-white md:bg-gray-50 flex flex-col">
      <main className="flex-1 px-4 md:px-0 pt-8 pb-24 md:flex md:items-center md:justify-center">
        <div className="w-full max-w-md md:bg-white md:rounded-2xl md:shadow-lg p-6 md:p-8 md:my-8">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Connect Your Wallet
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Connect your mobile wallet by scanning the QR code. Supports MetaMask Mobile, Trust Wallet, and more.
            </p>
          </div>

          <div className="mb-6">
            <WalletConnectButton
              onConnect={(address) => {
                console.log('Wallet connected:', address)
              }}
              onJWTReceived={(token) => {
                console.log('JWT received:', token)
              }}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">How it works:</h3>
            <ol className="text-xs md:text-sm text-blue-800 space-y-1.5 list-decimal list-inside">
              <li>Click &quot;Connect Wallet&quot; to open QR code</li>
              <li>Scan QR code with your mobile wallet app</li>
              <li>Approve connection in your wallet</li>
              <li>Sign the message to verify ownership</li>
              <li>Receive JWT token for authentication</li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  )
}

