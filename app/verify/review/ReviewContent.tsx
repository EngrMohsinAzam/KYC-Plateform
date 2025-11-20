'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Header } from '@/components/layout/Header'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useAppContext } from '@/context/useAppContext'
import { LoadingDots } from '@/components/ui/LoadingDots'
import { useAccount, useConnect } from 'wagmi'
import { getNetworkInfo, submitKYCVerification, checkUSDTBalance } from '@/lib/web3'
import { submitKYCData } from '@/lib/api'
import { formatWalletAddress } from '@/lib/utils'
import { ethers } from 'ethers'
import '@/lib/wagmi-config'

export default function ReviewContent() {
  const router = useRouter()
  const { state, dispatch } = useAppContext()
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  
  const [connecting, setConnecting] = useState(false)
  const [networkError, setNetworkError] = useState<string | null>(null)
  const [kycSubmitted, setKycSubmitted] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [submittingToBackend, setSubmittingToBackend] = useState(false)
  const [transactionHash, setTransactionHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [usdtBalance, setUsdtBalance] = useState<string | null>(null)
  const [estimatedGasFee, setEstimatedGasFee] = useState<string>('0.0012 BNB')
  const [blockchainName, setBlockchainName] = useState<string>('Binance Chain')
  const [loadingTransactionData, setLoadingTransactionData] = useState(false)

  // Check if already submitted - but only if we have transaction hash
  // Also check if user just came from OTP (should always show wallet connection first)
  useEffect(() => {
    // Check if user just completed OTP verification (they should connect wallet now)
    const justFromOTP = sessionStorage.getItem('justCompletedOTP') === 'true'
    if (justFromOTP) {
      // Clear the OTP flag
      sessionStorage.removeItem('justCompletedOTP')
      // Clear any old submission flags to ensure fresh start
      localStorage.removeItem('kycSubmitted')
      localStorage.removeItem('kycTransactionHash')
      return // Always show wallet connection screen
    }

    // Only show under review if we have both the flag AND a transaction hash
    const kycJustSubmitted = localStorage.getItem('kycSubmitted') === 'true'
    const storedTxHash = localStorage.getItem('kycTransactionHash')
    if (kycJustSubmitted && storedTxHash) {
      setKycSubmitted(true)
      setTransactionHash(storedTxHash)
      return
    }
    // Clear the flag if there's no transaction hash (incomplete submission)
    if (kycJustSubmitted && !storedTxHash) {
      localStorage.removeItem('kycSubmitted')
    }
  }, [])

  // Check network and balance when wallet is connected
  useEffect(() => {
    console.log('🔍 Wallet connection status changed:', { isConnected, address })
    if (isConnected && address) {
      console.log('✅ Wallet connected, checking network and balance...')
      checkNetworkAndBalance()
    } else {
      console.log('⚠️ Wallet not connected yet')
      // Reset data when wallet disconnects
      setUsdtBalance(null)
      setEstimatedGasFee('0.0012 BNB')
      setBlockchainName('Binance Chain')
      setLoadingTransactionData(false)
    }
  }, [isConnected, address])

  const checkNetworkAndBalance = async () => {
    try {
      console.log('🌐 checkNetworkAndBalance called')
      setNetworkError(null)
      setLoadingTransactionData(true)
      
      console.log('🌐 Getting network info...')
      const networkInfo = await getNetworkInfo()
      console.log('🌐 Network info:', networkInfo)
      
      if (!networkInfo) {
        console.error('❌ Network not detected')
        setNetworkError('Unable to detect network. Please ensure your wallet is connected.')
        setLoadingTransactionData(false)
        return
      }
      if (!networkInfo.isCorrectNetwork) {
        console.error('❌ Wrong network:', networkInfo.name)
        setNetworkError(`Please switch to ${networkInfo.requiredNetworkName}`)
        setLoadingTransactionData(false)
        return
      }
      
      // Set blockchain name
      const blockchainNameValue = networkInfo.name || 'Binance Smart Chain Testnet'
      setBlockchainName(blockchainNameValue)
      console.log('✅ Blockchain name set to:', blockchainNameValue)
      
      // Check USDT balance
      if (address) {
        console.log('💰 Checking USDT balance for address:', address)
        try {
          const balance = await checkUSDTBalance(address)
          setUsdtBalance(balance)
          console.log('✅ USDT Balance:', balance)
        } catch (balanceError: any) {
          console.error('❌ Error checking balance:', balanceError)
          // Don't fail the whole process if balance check fails
        }
      }
      
      // Estimate gas fee for the transaction
      console.log('⛽ Estimating gas fee...')
      try {
        await estimateTransactionGas()
        console.log('✅ Gas fee estimated')
      } catch (gasError) {
        console.warn('⚠️ Could not estimate gas, using default:', gasError)
        // Keep default value
      }
      
      setLoadingTransactionData(false)
      console.log('✅ Network and balance check completed')
    } catch (err: any) {
      console.error('❌ Error checking network/balance:', err)
      setNetworkError(err.message || 'Error checking network')
      setLoadingTransactionData(false)
    }
  }

  const estimateTransactionGas = async () => {
    try {
      console.log('⛽ estimateTransactionGas called')
      if (!address || typeof window === 'undefined' || !(window as any).ethereum) {
        console.warn('⚠️ Cannot estimate gas - missing address or ethereum provider')
        return
      }
      
      console.log('⛽ Creating provider and getting fee data...')
      // Create provider from window.ethereum
      const provider = new ethers.BrowserProvider((window as any).ethereum)
      
      // Get current gas price
      const feeData = await provider.getFeeData()
      const gasPrice = feeData.gasPrice || BigInt(3000000000) // 3 gwei default
      console.log('⛽ Gas price:', gasPrice.toString())
      
      // Estimate gas limit for submitKYC transaction (approximate: 150000-200000)
      // This includes: approve (if needed) + submitKYC
      const estimatedGasLimit = BigInt(200000) // Conservative estimate
      console.log('⛽ Estimated gas limit:', estimatedGasLimit.toString())
      
      // Calculate total gas cost in BNB
      const gasCostWei = gasPrice * estimatedGasLimit
      const gasCostBNB = parseFloat(ethers.formatEther(gasCostWei))
      
      // Format to 4 decimal places
      const formattedGas = gasCostBNB.toFixed(4)
      const gasFeeString = `${formattedGas} BNB`
      setEstimatedGasFee(gasFeeString)
      console.log('✅ Gas fee estimated and set to:', gasFeeString)
    } catch (err) {
      console.error('❌ Error estimating gas:', err)
      // Keep default value
    }
  }

  const handleConnectWallet = async () => {
    try {
      console.log('🔗 handleConnectWallet called')
      setConnecting(true)
      setError(null)
      setNetworkError(null)
      
      // Check if MetaMask is available
      const isMetaMaskAvailable = typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined'
      console.log('🔍 MetaMask available:', isMetaMaskAvailable)
      
      // Try MetaMask first if available
      const metaMaskConnector = connectors.find(c => c.id === 'metaMask' || c.id === 'injected')
      if (metaMaskConnector && isMetaMaskAvailable) {
        console.log('🔗 Attempting to connect via MetaMask...')
        try {
          await connect({ connector: metaMaskConnector })
          console.log('✅ MetaMask connection successful')
          // The useEffect will trigger checkNetworkAndBalance when address becomes available
          return
        } catch (err: any) {
          console.error('❌ MetaMask connection error:', err)
          if (err.message?.includes('rejected') || err.message?.includes('denied')) {
            setError('Wallet connection was rejected. Please try again.')
            return
          }
          // Continue to WalletConnect fallback
          console.log('⚠️ MetaMask connection failed, trying WalletConnect...')
        }
      }
      
      // Fallback to WalletConnect
      const walletConnectConnector = connectors.find(c => c.id === 'walletConnect')
      if (walletConnectConnector) {
        console.log('🔗 Attempting to connect via WalletConnect...')
        try {
          await connect({ connector: walletConnectConnector })
          console.log('✅ WalletConnect connection successful')
          return
        } catch (err: any) {
          console.error('❌ WalletConnect connection error:', err)
          if (err.message?.includes('rejected') || err.message?.includes('denied')) {
            setError('Wallet connection was rejected. Please try again.')
            return
          }
          throw new Error('Failed to connect wallet. Please try again.')
        }
      } else {
        throw new Error('No wallet connectors available. Please install MetaMask or use WalletConnect.')
      }
    } catch (err: any) {
      console.error('❌ Error connecting wallet:', err)
      setError(err.message || 'Failed to connect wallet. Please try again.')
    } finally {
      setConnecting(false)
    }
  }

  const handleSubmitKYC = async () => {
    console.log('🚀 handleSubmitKYC called')
    console.log('📊 Current state:', {
      isConnected,
      address,
      hasPersonalInfo: !!state.personalInfo,
      hasEmail: !!state.personalInfo?.email,
      idNumber: state.personalInfo?.idNumber || state.idNumber,
      estimatedGasFee,
      blockchainName
    })
    
    if (!isConnected || !address) {
      console.error('❌ Wallet not connected')
      setError('Please connect your wallet first')
      return
    }

    try {
      console.log('✅ Starting KYC submission process...')
      setError(null)
      setNetworkError(null)
      setProcessingPayment(true)
      console.log('⏳ Processing payment state set to true')

      // Check network
      const networkInfo = await getNetworkInfo()
      if (!networkInfo) {
        setError('Unable to detect network. Please ensure your wallet is connected.')
        setProcessingPayment(false)
        return
      }
      if (!networkInfo.isCorrectNetwork) {
        setError(`Please switch to ${networkInfo.requiredNetworkName}`)
        setProcessingPayment(false)
        return
      }

      // Check balance with timeout
      console.log('💰 Checking USDT balance...')
      let balance: string
      try {
        const balancePromise = checkUSDTBalance(address)
        const timeoutPromise = new Promise<string>((_, reject) => {
          setTimeout(() => reject(new Error('Balance check timeout. Please check your network connection.')), 30000)
        })
        balance = await Promise.race([balancePromise, timeoutPromise])
        console.log('💰 USDT Balance:', balance)
      } catch (balanceError: any) {
        console.error('❌ Error checking balance:', balanceError)
        // If balance check fails, we'll still try to proceed (the contract will reject if insufficient)
        console.warn('⚠️ Continuing despite balance check error - contract will validate balance')
        balance = '0' // Set default, contract will check actual balance
      }
      
      if (parseFloat(balance) < 2) {
        console.error('❌ Insufficient balance:', balance)
        setError('Insufficient USDT balance. You need at least $2 USDT to proceed.')
        setProcessingPayment(false)
        return
      }
      console.log('✅ Balance check passed')

      // Generate anonymous ID from user data
      const personalInfo = state.personalInfo
      if (!personalInfo?.email) {
        setError('Personal information is missing. Please go back and complete the form.')
        setProcessingPayment(false)
        return
      }

      const anonymousId = `${personalInfo.email}-${Date.now()}`
      
      // Submit to smart contract (this will handle the $2 payment)
      console.log('========================================')
      console.log('🔗 STEP 1: Submitting KYC to smart contract...')
      console.log('========================================')
      console.log('Anonymous ID:', anonymousId)
      console.log('Wallet Address:', address)
      
      let txHash: string
      try {
        console.log('⏳ Calling submitKYCVerification...')
        console.log('⏳ IMPORTANT: Check your MetaMask wallet!')
        console.log('⏳ You will need to:')
        console.log('   1. Approve USDT spending (if not already approved)')
        console.log('   2. Confirm the KYC submission transaction')
        console.log('⏳ This may take a moment. Please wait...')
        
        // Add timeout protection (5 minutes max)
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Transaction timeout: The transaction is taking too long. Please check your wallet and try again.')), 300000)
        })
        
        const txPromise = submitKYCVerification(anonymousId)
        console.log('⏳ Waiting for transaction...')
        console.log('⏳ If MetaMask popup doesn\'t appear, check if it\'s blocked by your browser')
        txHash = await Promise.race([txPromise, timeoutPromise]) as string
        
        setTransactionHash(txHash)
        console.log('✅ Transaction successful!')
        console.log('Transaction Hash:', txHash)
        console.log('========================================\n')
      } catch (txError: any) {
        console.error('❌ Transaction failed:', txError)
        
        // Provide more specific error messages
        let errorMessage = 'Transaction failed'
        if (txError.message?.includes('timeout')) {
          errorMessage = txError.message
        } else if (txError.message?.includes('user rejected') || txError.code === 4001) {
          errorMessage = 'Transaction was rejected. Please try again.'
        } else if (txError.message?.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for transaction. Please ensure you have enough BNB for gas fees.'
        } else if (txError.message) {
          errorMessage = `Transaction failed: ${txError.message}`
        }
        
        throw new Error(errorMessage)
      }

      // Now submit to backend
      console.log('========================================')
      console.log('📤 STEP 2: Submitting to backend API...')
      console.log('========================================')
      setProcessingPayment(false)
      setSubmittingToBackend(true)

      // Map frontend ID type to backend expected format
      const mapIdTypeToBackend = (frontendIdType: string): string => {
        const idTypeMap: Record<string, string> = {
          'national-id': 'CNIC',
          'passport': 'Passport',
          'drivers-license': 'License'
        }
        return idTypeMap[frontendIdType] || frontendIdType
      }

      // Prepare submission data
      const submissionData = {
        userId: personalInfo.email,
        blockchainAddressId: address,
        fullName: `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim() || '',
        firstName: personalInfo.firstName,
        lastName: personalInfo.lastName,
        fatherName: personalInfo.fatherName,
        email: personalInfo.email,
        phone: personalInfo.phone || '',
        countryName: state.selectedCountry || '',
        cityName: state.selectedCity || '',
        idType: mapIdTypeToBackend(state.selectedIdType || ''),
        usaResidence: state.isResidentUSA ? 'yes' : 'no',
        identityDocumentFront: state.documentImageFront || '',
        identityDocumentBack: state.documentImageBack || '',
        liveInImage: state.selfieImage || '',
        cnic: personalInfo.idNumber || '',
        transactionHash: txHash,
        feeUnit: 2,
      }

      // Validate required data before submitting
      console.log('📋 Preparing backend submission...')
      console.log('📋 Submission Data Check:', {
        hasEmail: !!submissionData.email,
        hasAddress: !!submissionData.blockchainAddressId,
        hasFullName: !!submissionData.fullName,
        hasFrontImage: !!submissionData.identityDocumentFront,
        hasBackImage: !!submissionData.identityDocumentBack,
        hasSelfie: !!submissionData.liveInImage,
        hasCountry: !!submissionData.countryName,
        hasCity: !!submissionData.cityName,
        hasIdType: !!submissionData.idType,
        hasTxHash: !!submissionData.transactionHash,
      })

      if (!submissionData.identityDocumentFront) {
        throw new Error('Front document image is missing')
      }
      if (!submissionData.liveInImage) {
        throw new Error('Selfie image is missing')
      }
      if (!submissionData.email) {
        throw new Error('Email is missing')
      }

      console.log('🚀 Calling submitKYCData API function...')
      console.log('📤 Submission data summary:', {
        userId: submissionData.userId,
        email: submissionData.email,
        blockchainAddressId: submissionData.blockchainAddressId,
        transactionHash: submissionData.transactionHash,
        frontImageLength: submissionData.identityDocumentFront?.length || 0,
        backImageLength: submissionData.identityDocumentBack?.length || 0,
        selfieImageLength: submissionData.liveInImage?.length || 0,
        country: submissionData.countryName,
        city: submissionData.cityName,
        idType: submissionData.idType,
      })

      // Call the API function
      let result
      try {
        console.log('📞 Making API call to submitKYCData...')
        result = await submitKYCData(submissionData)
        console.log('✅ submitKYCData function completed')
        console.log('📥 Backend API Response:', result)
      } catch (apiError: any) {
        console.error('❌ Error calling submitKYCData:', apiError)
        console.error('Error details:', {
          message: apiError.message,
          stack: apiError.stack,
          name: apiError.name,
        })
        throw new Error(`Backend API call failed: ${apiError.message || 'Unknown error'}`)
      }

      if (result.success) {
        // Store ID details in context
        const currentIdNumber = state.personalInfo?.idNumber || state.idNumber || '6278881828373231'
        dispatch({ 
          type: 'SET_ID_DETAILS', 
          payload: {
            idNumber: currentIdNumber,
            gasFee: state.estimatedGasFee || '0.0012 BNB',
            blockchain: state.blockchain || 'Binance Chain',
          }
        })
        
        // Mark as submitted and store transaction hash
        localStorage.setItem('kycSubmitted', 'true')
        localStorage.setItem('kycTransactionHash', txHash)
        setKycSubmitted(true)
        setSubmittingToBackend(false)
      } else {
        setError(result.message || 'Failed to submit KYC data')
        setSubmittingToBackend(false)
      }
    } catch (err: any) {
      console.error('Error submitting KYC:', err)
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        stack: err.stack,
        name: err.name
      })
      
      // Show user-friendly error message
      const errorMessage = err.message || 'Failed to submit KYC. Please try again.'
      setError(errorMessage)
      setProcessingPayment(false)
      setSubmittingToBackend(false)
      
      // If it's a timeout or rejection, don't show as critical error
      if (err.message?.includes('timeout') || err.message?.includes('rejected')) {
        console.log('⚠️ Transaction was cancelled or timed out - user can retry')
      }
    }
  }

  // Show under review screen if submitted
  if (kycSubmitted) {
    return (
      <div className="min-h-screen h-screen bg-white flex flex-col overflow-hidden">
        <Header showClose />
        <ProgressBar currentStep={5} totalSteps={5} />
        <main className="flex-1 overflow-y-auto">
          <div className="min-h-full md:flex md:items-center md:justify-center md:py-8">
            <div className="md:hidden h-full flex flex-col px-4 pt-12 pb-32">
              <div className="flex-1 flex flex-col justify-center items-center text-center">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  Under Review
                </h1>
                <p className="text-gray-600 mb-2">
                  Your KYC verification has been submitted successfully!
                </p>
                <p className="text-sm text-gray-500">
                  Your application is now under review. You will be notified once the verification is complete.
                </p>
                {transactionHash && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Transaction Hash:</p>
                    <p className="text-xs font-mono text-gray-800 break-all">{transactionHash}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="hidden md:block w-full max-w-md px-4">
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 text-center">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Under Review
                </h1>
                <p className="text-gray-600 mb-4">
                  Your KYC verification has been submitted successfully!
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Your application is now under review. You will be notified once the verification is complete.
                </p>
                {transactionHash && (
                  <div className="p-4 bg-gray-50 rounded-lg mb-4">
                    <p className="text-xs text-gray-600 mb-1">Transaction Hash:</p>
                    <p className="text-xs font-mono text-gray-800 break-all">{transactionHash}</p>
                  </div>
                )}
                <p className="text-xs text-gray-500">Powered by Mira</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Get ID details from state
  const idNumber = state.personalInfo?.idNumber || state.idNumber || '6278881828373231'
  const displayGasFee = isConnected && !loadingTransactionData ? estimatedGasFee : (state.estimatedGasFee || '0.0012 BNB')
  const displayBlockchain = isConnected && !loadingTransactionData ? blockchainName : (state.blockchain || 'Binance Chain')
  const displayWalletAddress = isConnected && address ? address : ''

  return (
    <div className="min-h-screen h-screen bg-white md:bg-gray-50 flex flex-col overflow-hidden">
      <Header showBack showClose />
      <ProgressBar currentStep={5} totalSteps={5} />
      
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full md:flex md:items-center md:justify-center md:py-8">
          {/* Mobile Design */}
          <div className="md:hidden h-full flex flex-col px-4 pt-8 pb-32">
            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Get your decentralised ID
            </h1>
            
            {/* Subtitle */}
            <p className="text-sm text-gray-500 mb-6">
              Verified on the Mira-20 Blockchain
            </p>

            {/* Error Messages */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {networkError && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-600">{networkError}</p>
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
                    {isConnected && loadingTransactionData ? 'Calculating...' : displayGasFee}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Blockchain</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {displayBlockchain}
                  </span>
                </div>
              </div>

              {/* Help Link */}
              <div className="mb-6 text-center">
                <a href="#" className="text-sm text-blue-600 hover:underline">
                  Need help? Click here
                </a>
              </div>

              {/* Wallet Connection Section */}
              <div className="bg-gray-100 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Connected wallet</span>
                  <span className={`text-sm font-mono ${isConnected ? 'text-gray-900 break-all' : 'text-gray-500'}`}>
                    {isConnected ? displayWalletAddress : 'None'}
                  </span>
                </div>
                {isConnected && usdtBalance && (
                  <p className="text-xs text-gray-600 mt-2">Balance: {usdtBalance} USDT</p>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Fixed Button */}
          {!isConnected ? (
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
              <Button
                onClick={handleConnectWallet}
                disabled={connecting}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-lg py-3 font-medium"
              >
                {connecting ? 'Connecting...' : 'Connect wallet'}
              </Button>
            </div>
          ) : (
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
              <Button
                onClick={handleSubmitKYC}
                disabled={processingPayment || submittingToBackend || !!networkError}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-lg py-3 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processingPayment ? (
                  <>
                    <LoadingDots size="sm" color="#ffffff" />
                    <span>Processing transaction...</span>
                  </>
                ) : submittingToBackend ? (
                  <>
                    <LoadingDots size="sm" color="#ffffff" />
                    <span>Submitting to Backend...</span>
                  </>
                ) : (
                  'Confirm blockstamp'
                )}
              </Button>
            </div>
          )}

          {/* Desktop Design */}
          <div className="hidden md:block w-full max-w-md px-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
              {/* Title */}
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Get your decentralised ID
              </h1>
              
              {/* Subtitle */}
              <p className="text-sm text-gray-500 mb-6">
                Verified on the Mira-20 Blockchain
              </p>

              {/* Error Messages */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {networkError && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-600">{networkError}</p>
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
                    <span className="text-sm text-gray-700">ID Number</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {idNumber}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Estimated gas fee</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {isConnected && loadingTransactionData ? 'Calculating...' : displayGasFee}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Blockchain</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {displayBlockchain}
                    </span>
                  </div>
                </div>

                {/* Help Link */}
                <div className="mb-6 text-center">
                  <a href="#" className="text-sm text-blue-600 hover:underline">
                    Need help? Click here
                  </a>
                </div>

                {/* Wallet Connection Section */}
                <div className="bg-gray-100 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Connected wallet</span>
                    <span className={`text-sm font-mono ${isConnected ? 'text-gray-900 break-all' : 'text-gray-500'}`}>
                      {isConnected ? displayWalletAddress : 'None'}
                    </span>
                  </div>
                  {isConnected && usdtBalance && (
                    <p className="text-xs text-gray-600 mt-2">Balance: {usdtBalance} USDT</p>
                  )}
                </div>
              </div>

              {/* Action Button */}
              {!isConnected ? (
                <Button
                  onClick={handleConnectWallet}
                  disabled={connecting}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-lg py-3 font-medium"
                >
                  {connecting ? 'Connecting...' : 'Connect wallet'}
                </Button>
              ) : (
                <Button
                  onClick={handleSubmitKYC}
                  disabled={processingPayment || submittingToBackend || !!networkError}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-lg py-3 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processingPayment ? (
                    <>
                      <LoadingDots size="sm" color="#ffffff" />
                      <span>Processing transaction...</span>
                    </>
                  ) : submittingToBackend ? (
                    <>
                      <LoadingDots size="sm" color="#ffffff" />
                      <span>Submitting to Backend...</span>
                    </>
                  ) : (
                    'Confirm blockstamp'
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
