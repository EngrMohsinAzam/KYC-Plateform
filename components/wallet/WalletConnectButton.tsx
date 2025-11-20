'use client'

import { useState, useEffect } from 'react'
import { useAccount, useDisconnect, useSignMessage } from 'wagmi'
import { useConnect } from 'wagmi'
import { Button } from '@/components/ui/Button'

const API_BASE_URL =  'https://xzfjrnv9-3099.asse.devtunnels.ms/'

interface WalletConnectButtonProps {
  onConnect?: (address: string) => void
  onJWTReceived?: (jwt: string) => void
  className?: string
}

export function WalletConnectButton({ onConnect, onJWTReceived, className }: WalletConnectButtonProps) {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { signMessageAsync, isPending: isSigning } = useSignMessage()
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasJWT, setHasJWT] = useState(false)

  // Check for existing JWT on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const storedAddress = localStorage.getItem('walletAddress')
    if (token && storedAddress && address && storedAddress.toLowerCase() === address.toLowerCase()) {
      setHasJWT(true)
    }
  }, [address])

  const handleConnect = async () => {
    try {
      setError(null)
      
      // Try MetaMask first if available
      const metaMaskConnector = connectors.find(
        (connector) => connector.id === 'metaMask' || connector.id === 'injected'
      )
      
      if (metaMaskConnector) {
        try {
          await connect({ connector: metaMaskConnector })
          return
        } catch (err: any) {
          const errorMessage = err?.message || err?.toString() || ''
          if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
            console.log('User rejected MetaMask connection')
            return
          }
          console.log('MetaMask connection failed, trying WalletConnect')
        }
      }
      
      // Fall back to WalletConnect
      const walletConnectConnector = connectors.find(
        (connector) => connector.id === 'walletConnect'
      )
      
      if (walletConnectConnector) {
        try {
          await connect({ connector: walletConnectConnector })
        } catch (err: any) {
          const errorMessage = err?.message || err?.toString() || 'Unknown error'
          if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
            console.log('User rejected wallet connection')
            return
          }
          throw err
        }
      } else {
        throw new Error('No wallet connectors available')
      }
    } catch (err: any) {
      console.error('Error connecting wallet:', err)
      setError(err.message || 'Failed to connect wallet')
    }
  }

  const handleSignMessage = async () => {
    if (!address) {
      setError('Wallet not connected')
      return
    }

    try {
      setError(null)
      setIsVerifying(true)

      // Create message to sign
      const message = `Sign in to MiraKYC\n\nWallet: ${address}\nTimestamp: ${Date.now()}`
      
      console.log('📝 Signing message:', message)
      
      // Sign message using wallet
      const signature = await signMessageAsync({ message })
      
      console.log('✅ Message signed:', signature)

      // Send to backend for verification
      const response = await fetch(`${API_BASE_URL}/verify-signature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          signature,
          address,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Verification failed' }))
        throw new Error(errorData.message || 'Signature verification failed')
      }

      const data = await response.json()
      
      if (data.success && data.token) {
        // Store JWT in localStorage
        localStorage.setItem('authToken', data.token)
        localStorage.setItem('walletAddress', address)
        setHasJWT(true)
        
        console.log('✅ JWT received and stored')
        
        // Call callbacks
        if (onConnect) onConnect(address)
        if (onJWTReceived) onJWTReceived(data.token)
      } else {
        throw new Error(data.message || 'No token received')
      }
    } catch (err: any) {
      console.error('Error signing/verifying:', err)
      setError(err.message || 'Failed to sign message or verify signature')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleDisconnect = () => {
    disconnect()
    localStorage.removeItem('authToken')
    localStorage.removeItem('walletAddress')
    setHasJWT(false)
  }

  if (isConnected && address) {
    return (
      <div className={`flex flex-col gap-2 ${className || ''}`}>
        {/* Connected Wallet Info - Mobile & Desktop Responsive */}
        <div className="flex items-center justify-between gap-2 px-3 md:px-4 py-2 bg-gray-50 md:bg-gray-100 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
            <span className="text-xs md:text-sm font-medium text-gray-700 truncate">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
          </div>
          <span className="text-xs text-green-600 font-medium flex-shrink-0">Connected</span>
        </div>
        
        {!hasJWT ? (
          <Button
            onClick={handleSignMessage}
            disabled={isSigning || isVerifying}
            className="w-full text-sm md:text-base py-2.5 md:py-3"
          >
            {isSigning || isVerifying ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span className="hidden md:inline">{isSigning ? 'Signing message...' : 'Verifying signature...'}</span>
                <span className="md:hidden">{isSigning ? 'Signing...' : 'Verifying...'}</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span>Sign Message & Verify</span>
              </span>
            )}
          </Button>
        ) : (
          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-xs md:text-sm text-green-600 font-medium">Verified & Authenticated</span>
          </div>
        )}
        
        <Button
          onClick={handleDisconnect}
          variant="secondary"
          className="w-full text-xs md:text-sm py-2 md:py-2.5"
        >
          Disconnect Wallet
        </Button>
        
        {error && (
          <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-600 text-center">{error}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-2 ${className || ''}`}>
      <Button
        onClick={handleConnect}
        className="w-full text-sm md:text-base py-2.5 md:py-3"
      >
        <span className="flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          <span>Connect Wallet</span>
        </span>
      </Button>
      <p className="text-xs text-gray-500 text-center px-2">
        Scan QR code with your mobile wallet
      </p>
      {error && (
        <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-600 text-center">{error}</p>
        </div>
      )}
    </div>
  )
}

