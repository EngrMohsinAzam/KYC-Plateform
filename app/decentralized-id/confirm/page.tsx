'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Header } from '@/components/layout/Header'
import { useAppContext } from '@/context/useAppContext'
import { LoadingDots } from '@/components/ui/LoadingDots'
import { checkUSDTBalance, submitKYCVerification, isMetaMaskInstalled, getNetworkInfo, connectWallet, checkKYCStatus } from '@/lib/web3'
import { submitKYCData } from '@/lib/api'
import { ethers } from 'ethers'

declare global {
  interface Window {
    ethereum?: any
  }
}

export default function ConfirmBlockstamp() {
  const router = useRouter()
  const { state, dispatch } = useAppContext()
  const [loading, setLoading] = useState(false)
  const [usdtBalance, setUsdtBalance] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [checkingBalance, setCheckingBalance] = useState(true)
  const [currentNetwork, setCurrentNetwork] = useState<string | null>(null)
  const [isCorrectNetwork, setIsCorrectNetwork] = useState<boolean>(true)
  const [kycStatus, setKycStatus] = useState<{ isVerified: boolean; hasSubmitted: boolean } | null>(null)
  const [checkingKYC, setCheckingKYC] = useState(true)
  const [estimatedGasFee, setEstimatedGasFee] = useState<string>('0.0012 BNB')
  const [blockchainName, setBlockchainName] = useState<string>('Binance Chain')
  const [loadingTransactionData, setLoadingTransactionData] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'processing' | 'success'>('idle')

  useEffect(() => {
    // Don't clear wallet - allow it to persist
    // If wallet is connected, check network and balance
    if (state.connectedWallet) {
      checkNetworkAndBalance()
    }
    
    // Listen for network and account changes
    if (window.ethereum) {
      window.ethereum.on('chainChanged', () => {
        window.location.reload()
      })
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          dispatch({ type: 'SET_WALLET', payload: accounts[0] })
        } else {
          dispatch({ type: 'SET_WALLET', payload: '' })
        }
      })
    }
  }, [state.connectedWallet, dispatch])

  const checkNetworkAndBalance = async () => {
    if (!state.connectedWallet || !isMetaMaskInstalled()) {
      setCheckingBalance(false)
      return
    }

    try {
      setLoadingTransactionData(true)
      setError(null)
      
      // First check the network
      const network = await getNetworkInfo()
      if (network) {
        setCurrentNetwork(network.name)
        // Binance Smart Chain Testnet chainId is 97
        const isBSCTestnet = network.chainId === '97'
        setIsCorrectNetwork(isBSCTestnet)
        
        // Set blockchain name
        setBlockchainName(network.name || 'Binance Smart Chain Testnet')
        
        if (!isBSCTestnet) {
          setError(`Wrong Network: You are connected to ${network.name}. Please switch to Binance Smart Chain Testnet (BSC Testnet) to continue.`)
          setCheckingBalance(false)
          setLoadingTransactionData(false)
          return
        }
      }

      // If on correct network, check balance and KYC status
      const [balance, kycStatusResult] = await Promise.all([
        checkUSDTBalance(state.connectedWallet),
        checkKYCStatus(state.connectedWallet)
      ])
      setUsdtBalance(balance)
      setKycStatus(kycStatusResult)
      setError(null)
      
      // Estimate gas fee
      try {
        await estimateTransactionGas()
      } catch (gasError) {
        console.warn('Could not estimate gas, using default:', gasError)
      }
    } catch (err: any) {
      console.error('Error checking balance:', err)
      if (err.message.includes('not found') || err.message.includes('BAD_DATA')) {
        setError(`Contract Error: The USDT contract was not found. This usually means you're on the wrong network. Please switch to Binance Smart Chain Testnet (BSC Testnet) in MetaMask.`)
      } else {
        setError(err.message || 'Failed to check balance. Please ensure you are on the correct network.')
      }
    } finally {
      setCheckingBalance(false)
      setCheckingKYC(false)
      setLoadingTransactionData(false)
    }
  }

  const estimateTransactionGas = async () => {
    try {
      if (!state.connectedWallet || typeof window === 'undefined' || !(window as any).ethereum) return
      
      // Create provider from window.ethereum
      const provider = new ethers.BrowserProvider((window as any).ethereum)
      
      // Get current gas price
      const feeData = await provider.getFeeData()
      const gasPrice = feeData.gasPrice || BigInt(3000000000) // 3 gwei default
      
      // Estimate gas limit for submitKYC transaction
      const estimatedGasLimit = BigInt(200000) // Conservative estimate
      
      // Calculate total gas cost in BNB
      const gasCostWei = gasPrice * estimatedGasLimit
      const gasCostBNB = parseFloat(ethers.formatEther(gasCostWei))
      
      // Format to 4 decimal places
      const formattedGas = gasCostBNB.toFixed(4)
      setEstimatedGasFee(`${formattedGas} BNB`)
    } catch (err) {
      console.error('Error estimating gas:', err)
    }
  }

  const handleConnectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask is not installed. Please install MetaMask to continue.')
      return
    }

    setConnecting(true)
    setError(null)

    try {
      const network = await getNetworkInfo()
      if (network && network.chainId !== '97') {
        const switchToBSC = confirm('You need to be on Binance Smart Chain Testnet. Would you like to switch now?')
        if (switchToBSC) {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x61' }],
            })
            await new Promise(resolve => setTimeout(resolve, 1000))
          } catch (switchError: any) {
            if (switchError.code === 4902) {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0x61',
                  chainName: 'Binance Smart Chain Testnet',
                  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
                  rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
                  blockExplorerUrls: ['https://testnet.bscscan.com/']
                }]
              })
              await new Promise(resolve => setTimeout(resolve, 1000))
            }
          }
        }
      }

      const walletAddress = await connectWallet()
      if (walletAddress) {
        dispatch({ type: 'SET_WALLET', payload: walletAddress })
      }
    } catch (error: any) {
      if (error.code !== 4001) {
        setError(error.message || 'Failed to connect wallet. Please try again.')
      }
    } finally {
      setConnecting(false)
    }
  }

  const handleConfirm = async () => {
    if (!state.connectedWallet) {
      setError('Please connect your wallet first')
      return
    }

    if (!isMetaMaskInstalled()) {
      setError('MetaMask is not installed. Please install MetaMask to continue.')
      return
    }

    // Check if already verified
    if (kycStatus?.isVerified || kycStatus?.hasSubmitted) {
      setError('You have already submitted KYC verification. Please check your transaction history.')
      return
    }

    setLoading(true)
    setError(null)
    setTransactionStatus('processing')

    try {
      // Generate anonymous ID from user's personal info
      const idNumber = state.personalInfo?.idNumber || state.idNumber || ''
      const anonymousId = idNumber 
        ? `AID-${idNumber.slice(0, 4)}-${idNumber.slice(4, 8)}-${idNumber.slice(8, 12)}-${idNumber.slice(12)}`
        : `AID-${Date.now()}`
      
      // Create metadata URL (optional, can be empty string)
      const metadataUrl = `https://kyx-platform.com/kyc/${state.connectedWallet}`

      // Submit KYC verification to smart contract (this will deduct $2 USDT)
      const transactionHash = await submitKYCVerification(anonymousId, metadataUrl)
      
      // Show success state
      setTransactionStatus('success')

      // Get transaction receipt for additional details
      const { getProviderAndSigner } = await import('@/lib/web3')
      const { provider: web3Provider } = await getProviderAndSigner()
      const receipt = await web3Provider.getTransactionReceipt(transactionHash)
      
      // Get block timestamp
      let blockTimestamp = new Date().toISOString()
      if (receipt?.blockNumber) {
        try {
          const block = await web3Provider.getBlock(receipt.blockNumber)
          if (block?.timestamp) {
            blockTimestamp = new Date(Number(block.timestamp) * 1000).toISOString()
          }
        } catch (err) {
          console.warn('Could not get block timestamp:', err)
        }
      }
      
      // Prepare KYC data for backend submission
      const personalInfo = state.personalInfo
      const needsBackSide = state.selectedIdType !== 'passport'
      
      // Validate required images
      if (!personalInfo || !state.documentImageFront || !state.selfieImage) {
        throw new Error('Missing required KYC data. Please complete all steps.')
      }
      
      // For non-passport documents, back image is required
      if (needsBackSide && !state.documentImageBack) {
        throw new Error('Missing back side of document. Please complete all steps.')
      }

      // Map ID type to backend format
      const idTypeMap: Record<string, string> = {
        'national-id': 'CNIC',
        'passport': 'Passport',
        'drivers-license': 'License'
      }
      const idType = idTypeMap[state.selectedIdType || ''] || 'CNIC'

      // Submit KYC data to backend - WAIT for response
      console.log('========================================')
      console.log('🚀 STARTING BACKEND API SUBMISSION')
      console.log('========================================')
      console.log('API URL:', process.env.NEXT_PUBLIC_API_URL || 'https://xzfjrnv9-3099.asse.devtunnels.ms')
      console.log('Submitting KYC data to backend API...')
      console.log('Data being submitted:', {
        userId: anonymousId,
        email: personalInfo.email,
        hasFrontImage: !!state.documentImageFront,
        hasBackImage: !!state.documentImageBack,
        hasSelfie: !!state.selfieImage,
        transactionHash: transactionHash
      })
      
      const kycSubmissionResult = await submitKYCData({
        userId: anonymousId,
        blockchainAddressId: state.connectedWallet || '',
        fullName: `${personalInfo.firstName} ${personalInfo.lastName}`,
        email: personalInfo.email,
        phone: personalInfo.phone,
        countryName: state.selectedCountry || '',
        cityName: state.selectedCity || '',
        idType: idType,
        usaResidence: state.isResidentUSA ? 'yes' : 'no',
        identityDocumentFront: state.documentImageFront,
        identityDocumentBack: state.documentImageBack || state.documentImageFront, // Use front if no back (for passport)
        liveInImage: state.selfieImage,
        transactionHash: transactionHash,
        blockNumber: receipt?.blockNumber?.toString() || '',
        fromAddress: receipt?.from || state.connectedWallet || '',
        toAddress: receipt?.to || '',
        amount: '2',
        timestamp: blockTimestamp,
        feeUnit: 2
      })

      console.log('========================================')
      console.log('📡 BACKEND API RESPONSE RECEIVED')
      console.log('========================================')
      console.log('Response success:', kycSubmissionResult.success)
      console.log('Response message:', kycSubmissionResult.message)
      console.log('Response data:', kycSubmissionResult.data)
      
      if (!kycSubmissionResult.success) {
        console.error('❌ Backend submission failed:', kycSubmissionResult.message)
        throw new Error(`Backend submission failed: ${kycSubmissionResult.message}. Please contact support.`)
      }

      console.log('✅ KYC data submitted successfully to backend!')
      console.log('Full response:', JSON.stringify(kycSubmissionResult, null, 2))
      console.log('========================================')

      // Store transaction hash in context
      dispatch({ 
        type: 'SET_ID_DETAILS', 
        payload: {
          idNumber: state.idNumber || '6278081828373231',
          gasFee: state.estimatedGasFee || '0.0012 BNB',
          blockchain: state.blockchain || 'Binance Chain',
        }
      })

      // Store transaction hash
      localStorage.setItem('kycTransactionHash', transactionHash)

      // Wait a moment to show success animation before navigating
      await new Promise(resolve => setTimeout(resolve, 1500))

      // ONLY navigate to review page AFTER backend confirms submission
      // The review page will show "Under review" status
      router.push('/verify/review')
    } catch (err: any) {
      console.error('Transaction error:', err)
      setError(err.message || 'Transaction failed. Please try again.')
      setTransactionStatus('idle')
    } finally {
      setLoading(false)
    }
  }

  // Get ID details
  const idNumber = state.personalInfo?.idNumber || state.idNumber || '6278881828373231'
  const displayGasFee = state.connectedWallet && !loadingTransactionData ? estimatedGasFee : (state.estimatedGasFee || '0.0012 BNB')
  const displayBlockchain = state.connectedWallet && !loadingTransactionData ? blockchainName : (state.blockchain || 'Binance Chain')
  const displayWalletAddress = state.connectedWallet || ''

  return (
    <div className="min-h-screen bg-white md:bg-gray-50 flex flex-col">
      <Header showBack showClose />
      <main className="flex-1 px-4 md:px-0 pt-2 pb-24 md:flex md:items-center md:justify-center">
        <div className="w-full max-w-md md:bg-white md:rounded-2xl md:shadow-lg md:p-8 md:border md:border-gray-200">
          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Get your decentralised ID
          </h1>
          
          {/* Subtitle */}
          <p className="text-sm text-gray-500 mb-6">
            Verified on the Mira-20 Blockchain
          </p>

          {/* Network Status Indicator - Only show if wrong network */}
          {currentNetwork && !isCorrectNetwork && (
            <div className="mb-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <p className="text-xs font-medium text-yellow-800">
                  Wrong Network: {currentNetwork}
                </p>
              </div>
              <p className="text-xs text-yellow-700 mt-1">
                Please switch to Binance Smart Chain Testnet
              </p>
            </div>
          )}

          {/* Error Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Main Content */}
          <div className="mb-6">
            {/* Instructional Text */}
            <h2 className="text-base font-bold text-gray-900 mb-3">
              To create your decentralised ID, you need to blockstamp it.
            </h2>
            <p className="text-sm text-gray-700 mb-6 leading-relaxed">
              In accordance with local laws and regulations, identity verification is required to access your Lumira Coins once the claim process starts. With this system, you will have a decentralised passport, in which you are recognised in the System.
            </p>

            {/* ID Details Section - Always show */}
            <div className="bg-gray-100 rounded-lg p-4 mb-6 space-y-3">
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Estimated gas fee</span>
                <span className="text-sm font-semibold text-gray-900">
                  {state.connectedWallet && loadingTransactionData ? 'Calculating...' : displayGasFee}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Blockchain</span>
                <span className="text-sm font-semibold text-gray-900">
                  {displayBlockchain}
                </span>
              </div>
            </div>

            {/* Help Link - Centered */}
            <div className="mb-6 text-center">
              <a href="#" className="text-sm text-blue-600 hover:underline">
                Need help? Click here
              </a>
            </div>

            {/* Connected Wallet - Grey Box */}
            <div className="bg-gray-100 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Connected wallet</span>
                <span className={`text-sm font-mono ${state.connectedWallet ? 'text-gray-900 break-all' : 'text-gray-500'}`}>
                  {state.connectedWallet ? displayWalletAddress : 'None'}
                </span>
              </div>
              {state.connectedWallet && usdtBalance && (
                <p className="text-xs text-gray-600 mt-2">Balance: {usdtBalance} USDT</p>
              )}
            </div>

            {/* KYC Status Check */}
            {!checkingKYC && kycStatus && (kycStatus.isVerified || kycStatus.hasSubmitted) && (
              <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-blue-800 mb-1">
                      {kycStatus.isVerified ? 'KYC Already Verified' : 'KYC Already Submitted'}
                    </p>
                    <p className="text-xs text-blue-700">
                      {kycStatus.isVerified 
                        ? 'Your KYC verification has already been completed. You can proceed to view your decentralized ID.'
                        : 'You have already submitted your KYC verification. Please wait for confirmation.'}
                    </p>
                    {kycStatus.isVerified && (
                      <Button
                        variant="secondary"
                        onClick={() => router.push('/decentralized-id/complete')}
                        className="mt-2 w-full text-sm"
                      >
                        View My Decentralized ID
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 font-medium mb-2">{error}</p>
            <div className="mt-3 space-y-2">
              <div className="bg-white p-3 rounded border border-red-200">
                <p className="text-xs text-red-700 mb-1">
                  <strong>Current Network:</strong> {currentNetwork || 'Unknown'}
                </p>
                <p className="text-xs text-red-700 mb-1">
                  <strong>Required Network:</strong> Binance Smart Chain Testnet (BSC Testnet)
                </p>
                <p className="text-xs text-red-600 mt-2">
                  <strong>How to fix:</strong>
                </p>
                <ol className="text-xs text-red-700 list-decimal list-inside mt-1 space-y-1">
                  <li>Open MetaMask extension</li>
                  <li>Click the network dropdown (top of MetaMask)</li>
                  <li>Select &quot;BSC Testnet&quot; or click &quot;Add Network&quot; below</li>
                  <li>If adding manually: Chain ID = 97, RPC = https://data-seed-prebsc-1-s1.binance.org:8545/</li>
                </ol>
              </div>
              <Button
                variant="secondary"
                onClick={async () => {
                  try {
                    // Try to switch to BSC Testnet (chainId: 97)
                    await window.ethereum.request({
                      method: 'wallet_switchEthereumChain',
                      params: [{ chainId: '0x61' }], // 97 in hex
                    })
                    // Reload after switching
                    setTimeout(() => window.location.reload(), 1000)
                  } catch (switchError: any) {
                    if (switchError.code === 4902) {
                      // Chain not added, add it
                      try {
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
                        // Reload after adding
                        setTimeout(() => window.location.reload(), 1000)
                      } catch (addError) {
                        alert('Failed to add network. Please add Binance Smart Chain Testnet manually in MetaMask.')
                      }
                    } else {
                      alert(`Failed to switch network: ${switchError.message}`)
                    }
                  }
                }}
                className="w-full text-sm"
              >
                Switch to BSC Testnet
              </Button>
            </div>
          </div>
        )}

          {/* Action Button */}
          {!state.connectedWallet ? (
            <div className="fixed md:relative bottom-0 left-0 right-0 p-4 md:p-0 bg-white md:bg-transparent border-t md:border-t-0">
              <Button 
                onClick={handleConnectWallet}
                disabled={connecting}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-lg py-3 font-medium flex items-center justify-center gap-2"
              >
                {connecting ? (
                  <>
                    <LoadingDots size="sm" color="#ffffff" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  'Connect wallet'
                )}
              </Button>
            </div>
          ) : (
            <div className="fixed md:relative bottom-0 left-0 right-0 p-4 md:p-0 bg-white md:bg-transparent border-t md:border-t-0">
              <Button 
                onClick={handleConfirm}
                disabled={loading || checkingBalance || checkingKYC || (usdtBalance !== null && parseFloat(usdtBalance) < 2) || (kycStatus?.isVerified || kycStatus?.hasSubmitted) || !isCorrectNetwork || transactionStatus === 'success'}
                className={`w-full rounded-lg py-3 font-medium transition-all duration-300 ${
                  transactionStatus === 'success' 
                    ? 'bg-green-600 hover:bg-green-600 text-white' 
                    : transactionStatus === 'processing'
                    ? 'bg-blue-600 hover:bg-blue-600 text-white'
                    : 'bg-gray-900 hover:bg-gray-800 text-white'
                } disabled:bg-gray-400 disabled:cursor-not-allowed relative overflow-hidden`}
              >
                {transactionStatus === 'success' ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg 
                      className="h-5 w-5 animate-checkmark" 
                      xmlns="http://www.w3.org/2000/svg" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        d="M5 13l4 4L19 7"
                        className="animate-draw-check"
                      />
                    </svg>
                    <span className="animate-fade-in">Transaction Confirmed!</span>
                  </span>
                ) : loading || transactionStatus === 'processing' ? (
                  <>
                    <LoadingDots size="sm" color="#ffffff" />
                    <span>Processing transaction...</span>
                  </>
                ) : (
                  'Confirm blockstamp'
                )}
                {/* Animated background effect during processing */}
                {transactionStatus === 'processing' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-blue-400/30 to-blue-500/20 animate-shimmer"></div>
                )}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}


