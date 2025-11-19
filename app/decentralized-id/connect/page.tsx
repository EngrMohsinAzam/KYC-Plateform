'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Header } from '@/components/layout/Header'
import { HelpModal } from '@/components/ui/HelpModal'
import { useAppContext } from '@/context/useAppContext'
import { getNetworkInfo, isMetaMaskInstalled, checkKYCStatus } from '@/lib/web3'
import { checkStatusByWallet } from '@/lib/api'

declare global {
  interface Window {
    ethereum?: any
  }
}

export default function ConnectWallet() {
  const router = useRouter()
  const { state, dispatch } = useAppContext()
  const idNumber = state.personalInfo?.idNumber || state.idNumber || '6278081828373231'
  const [gasFee] = useState('0.0012 BNB')
  const [blockchain] = useState('Binance Smart Chain Testnet')
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [networkError, setNetworkError] = useState<string | null>(null)
  const [currentNetwork, setCurrentNetwork] = useState<string | null>(null)

  useEffect(() => {
    dispatch({
      type: 'SET_ID_DETAILS',
      payload: {
        idNumber,
        gasFee,
        blockchain,
      },
    })
  }, [dispatch, idNumber, gasFee, blockchain, state.personalInfo?.idNumber])

  useEffect(() => {
    // Clear wallet connection on page load - require manual connection
    dispatch({ type: 'SET_WALLET', payload: '' })
    
    // Only check network when user explicitly connects wallet
    // Don't check network automatically to avoid any auto-connection
    
    // Listen for network changes
    if (window.ethereum) {
      window.ethereum.on('chainChanged', () => {
        window.location.reload()
      })
      // Don't auto-connect on account change - require manual connection
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        // Clear wallet if account changes - user must reconnect manually
        dispatch({ type: 'SET_WALLET', payload: '' })
      })
    }
  }, [dispatch])

  const [connecting, setConnecting] = useState(false)

  const handleConnectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      alert('MetaMask is not installed. Please install MetaMask to continue.')
      return
    }

    setConnecting(true)
    setNetworkError(null)

    try {
      // Connect wallet FIRST - this will ALWAYS prompt MetaMask
      // We do this first to ensure user explicitly approves connection
      const { connectWallet } = await import('@/lib/web3')
      let walletAddress: string
      
      try {
        // This will ALWAYS prompt MetaMask for permission
        walletAddress = await connectWallet()
      } catch (connectError: any) {
        setConnecting(false)
        if (connectError.code === 4001) {
          alert('Wallet connection was rejected. Please connect your wallet to continue.')
        } else {
          alert(connectError.message || 'Failed to connect wallet. Please try again.')
        }
        return
      }

      // Verify wallet is actually connected
      if (!walletAddress) {
        setConnecting(false)
        alert('Wallet connection failed. Please try again.')
        return
      }

      // Update state with connected wallet
      dispatch({ type: 'SET_WALLET', payload: walletAddress })
      
      // Now check network after wallet is connected
      const network = await getNetworkInfo()
      if (network) {
        setCurrentNetwork(network.name)
        if (network.chainId !== '97') {
          const switchToBSC = confirm('You need to be on Binance Smart Chain Testnet. Would you like to switch now?')
          if (switchToBSC) {
            try {
              await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x61' }], // 97 in hex
              })
              await new Promise(resolve => setTimeout(resolve, 1000))
            } catch (switchError: any) {
              if (switchError.code === 4902) {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [{
                    chainId: '0x61',
                    chainName: 'Binance Smart Chain Testnet',
                    nativeCurrency: {
                      name: 'BNB',
                      symbol: 'BNB',
                      decimals: 18
                    },
                    rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
                    blockExplorerUrls: ['https://testnet.bscscan.com/']
                  }]
                })
                await new Promise(resolve => setTimeout(resolve, 1000))
              } else {
                setNetworkError('Failed to switch network. Please switch manually to Binance Smart Chain Testnet.')
              }
            }
          } else {
            setNetworkError('Please switch to Binance Smart Chain Testnet to continue')
          }
        } else {
          setNetworkError(null)
        }
      }
      
      // Wait a moment for state to update
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Check if KYC already submitted - check both blockchain and backend
      let alreadySubmitted = false
      let isApproved = false
      let statusData: any = null
      
      try {
        // Check blockchain status
        const blockchainStatus = await checkKYCStatus(walletAddress)
        if (blockchainStatus.isVerified || blockchainStatus.hasSubmitted) {
          alreadySubmitted = true
          isApproved = blockchainStatus.isVerified
        }
        
        // Also check backend status
        try {
          const backendStatus = await checkStatusByWallet(walletAddress)
          if (backendStatus.success && backendStatus.data) {
            statusData = backendStatus.data
            if (statusData.verificationStatus === 'approved' || 
                statusData.verificationStatus === 'pending' || 
                statusData.verificationStatus === 'submitted') {
              alreadySubmitted = true
              if (statusData.verificationStatus === 'approved') {
                isApproved = true
              }
            }
          }
        } catch (backendErr) {
          console.warn('Could not check backend status:', backendErr)
        }
      } catch (err) {
        console.warn('Could not check KYC status:', err)
      }
      
      // If already submitted, show message and redirect to status check
      if (alreadySubmitted) {
        setConnecting(false)
        
        if (isApproved) {
          // If approved, show message about checking status by email/CNIC
          alert('Your KYC has already been submitted and approved. Please check your status using your CNIC number.')
          router.push('/verify/check-status')
        } else {
          // If pending/submitted, redirect to status check
          alert('Your KYC has already been submitted. Please check your status using your CNIC number.')
          router.push('/verify/check-status')
        }
        return
      }
      
      // Wallet is connected and no previous submission, proceed to confirm page
      setConnecting(false)
      router.push('/decentralized-id/confirm')
    } catch (error: any) {
      setConnecting(false)
      console.error('Connect wallet error:', error)
      alert(error.message || 'Failed to connect wallet. Please make sure MetaMask is installed and unlocked.')
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header showBack title="Get your decentralised ID" />
      <main className="flex-1 px-4 md:px-0 pt-6 pb-24 md:flex md:items-center md:justify-center md:py-16">
        <div className="w-full max-w-2xl md:bg-surface-gray md:rounded-2xl md:p-8 md:my-8 md:border-[2px] md:border-grey-400">
          {/* Subtitle - Mobile: below header, Web: in card */}
          <p className="text-sm text-text-secondary mb-6 md:mb-6 text-center md:text-left">
            Verified on the Mira ID Blockchain
          </p>

          {/* Intro Text */}
          <p className="text-base font-bold text-text-primary mb-3">
            To create your decentralised ID, you need to blockstamp it.
          </p>
          
          {/* Description Paragraph */}
          <p className="text-sm text-text-secondary mb-6 leading-relaxed">
            In accordance with local laws and regulations, identity verification is required to access your Lumira Coins once the claim process starts. With this system, you will have a decentralised passport, in which you are recognised in the System.
          </p>

          {/* Information Section - Key-Value Pairs */}
          <div className="space-y-4 mb-6 bg-white rounded-xl p-4 md:bg-white">
            <div className="flex justify-between items-start">
              <p className="text-base text-text-primary">ID Number</p>
              <p className="text-base text-text-secondary">{idNumber}</p>
            </div>
            <div className="flex justify-between items-start">
              <p className="text-base text-text-primary">Estimated gas fee</p>
              <p className="text-base text-text-secondary">{gasFee}</p>
            </div>
            <div className="flex justify-between items-start">
              <p className="text-base text-text-primary">Blockchain</p>
              <p className="text-base text-text-secondary">{blockchain}</p>
            </div>
          </div>

          {/* Help Link - Centered */}
          <div className="mb-6 text-center">
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault()
                setShowHelpModal(true)
              }}
              className="text-sm text-black underline hover:no-underline"
            >
              Need help? Click here
            </a>
          </div>

          {/* Network Error */}
          {networkError && (
            <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg ">
              <p className="text-sm text-yellow-800 mb-2">{networkError}</p>
              <p className="text-xs text-yellow-700 mb-2">
                Current network: {currentNetwork || 'Unknown'}
              </p>
              <p className="text-xs text-yellow-700">
                Required: Binance Smart Chain Testnet (Chain ID: 97)
              </p>
            </div>
          )}

          {/* Connected Wallet Status */}
          <div className="flex justify-between items-start mb-8 bg-white rounded-xl p-4">
            <p className="text-base text-text-primary">Connected wallet</p>
            <p className="text-base text-text-secondary">
              {state.connectedWallet || 'None'}
            </p>
          </div>

          {/* Connect Wallet Button - Full width, pill-shaped */}
          <div className="md:block fixed md:relative bottom-0 left-0 right-0 p-4 bg-white md:bg-transparent border-t md:border-t-0 border-surface-light">
            <Button 
              onClick={handleConnectWallet} 
              disabled={connecting}
              className="w-full bg-black hover:bg-black/80 text-white font-semibold rounded-full py-3 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {connecting ? 'Connecting...' : 'Connect wallet'}
            </Button>
            {connecting && (
              <p className="text-xs text-text-secondary text-center mt-2">
                Please approve the connection in MetaMask...
              </p>
            )}
          </div>
        </div>
      </main>
      <HelpModal 
        isOpen={showHelpModal} 
        onClose={() => setShowHelpModal(false)}
      />
    </div>
  )
}

