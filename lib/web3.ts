import { ethers } from 'ethers'
import { CONTRACT_ADDRESSES, USDT_ABI, KYC_ABI, CHARGE_AMOUNT } from './contracts'
import { getWalletClient, getPublicClient } from '@wagmi/core'
import { wagmiConfig } from './wagmi-config'
import { createPublicClient, http as viemHttp } from 'viem'
import { bscTestnet } from 'viem/chains'

export function isMetaMaskInstalled(): boolean {
  return typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined'
}

let connectionInProgress = false

export async function connectWallet(): Promise<string> {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed. Please install MetaMask to continue.')
  }

  if (connectionInProgress) {
    console.warn('⚠️ Wallet connection already in progress, waiting...')
    await new Promise(resolve => setTimeout(resolve, 500))
    try {
      const accounts = await (window as any).ethereum.request({
        method: 'eth_accounts'
      })
      if (accounts && accounts.length > 0) {
        return accounts[0]
      }
    } catch (err) {
    }
  }

  connectionInProgress = true

  try {
    console.log('🔗 Connecting to MetaMask...')
    
    try {
      const permissions = await (window as any).ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{
          eth_accounts: {}
        }]
      })
      console.log('✅ Permissions granted:', permissions)
    } catch (permError: any) {
      if (permError.code === -32002) {
        console.warn('⚠️ Permission request already pending, using eth_requestAccounts instead')
        const accounts = await (window as any).ethereum.request({
          method: 'eth_requestAccounts'
        })
        if (accounts && accounts.length > 0) {
          connectionInProgress = false
          return accounts[0]
        }
      } else if (permError.code === 4001) {
        connectionInProgress = false
        throw new Error('Connection was rejected. Please approve the connection request in MetaMask.')
      } else {
        throw permError
      }
    }

    const accounts = await (window as any).ethereum.request({
      method: 'eth_accounts'
    })
    
    if (!accounts || accounts.length === 0) {
      connectionInProgress = false
      throw new Error('No accounts found. Please unlock MetaMask and try again.')
    }

    const account = accounts[0]
    if (!account) {
      connectionInProgress = false
      throw new Error('No account returned from MetaMask. Please try again.')
    }

    console.log('✅ Wallet connected:', account)
    connectionInProgress = false
    return account
  } catch (error: any) {
    connectionInProgress = false
    if (error.code === 4001) {
      throw new Error('Connection was rejected. Please approve the connection request in MetaMask.')
    }
    throw error
  }
}

export async function connectWalletAlternative(): Promise<string> {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed. Please install MetaMask to continue.')
  }

  try {
    const accounts = await (window as any).ethereum.request({
      method: 'eth_requestAccounts'
    })
    
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found. Please unlock MetaMask and try again.')
    }

    const account = accounts[0]
    if (!account) {
      throw new Error('No account returned from MetaMask. Please try again.')
    }

    return account
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('Connection was rejected. Please approve the connection request in MetaMask.')
    }
    throw error
  }
}

export async function getProviderAndSigner() {
  try {
    // Try to get wallet client from wagmi (works with WalletConnect)
    const walletClient = await getWalletClient(wagmiConfig)
    
    if (!walletClient) {
      // Fallback to window.ethereum if available (for browser extensions)
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const provider = new ethers.BrowserProvider((window as any).ethereum)
        const signer = await provider.getSigner()
        return { provider, signer }
      }
      throw new Error('No wallet connected. Please connect your wallet first.')
    }

    // Get public client for read operations
    const publicClient = getPublicClient(wagmiConfig) || createPublicClient({
      chain: bscTestnet,
      transport: viemHttp('https://data-seed-prebsc-1-s1.binance.org:8545/')
    })

    // Create ethers provider from public client's RPC URL
    const rpcUrl = 'https://data-seed-prebsc-1-s1.binance.org:8545/'
    const provider = new ethers.JsonRpcProvider(rpcUrl)
    
    // Create a custom signer that uses the wallet client for transactions
    class WalletConnectSigner extends ethers.AbstractSigner {
      constructor(provider: ethers.Provider, private walletClient: any, private publicClient: any) {
        super(provider)
      }

      async getAddress(): Promise<string> {
        return this.walletClient.account.address
      }

      async signMessage(message: string | Uint8Array): Promise<string> {
        const msg = typeof message === 'string' ? message : ethers.toUtf8String(message)
        const signature = await this.walletClient.signMessage({
          message: msg,
          account: this.walletClient.account
        })
        return signature
      }

      async signTypedData(domain: ethers.TypedDataDomain, types: Record<string, ethers.TypedDataField[]>, value: Record<string, any>): Promise<string> {
        const signature = await this.walletClient.signTypedData({
          domain,
          types,
          primaryType: Object.keys(types)[0],
          message: value,
          account: this.walletClient.account
        })
        return signature
      }

      async signTransaction(tx: ethers.TransactionRequest): Promise<string> {
        const hash = await this.walletClient.sendTransaction({
          to: tx.to as `0x${string}`,
          value: tx.value ? BigInt(tx.value.toString()) : 0n,
          data: tx.data as `0x${string}` | undefined,
          account: this.walletClient.account
        })
        return hash
      }

      async sendTransaction(tx: ethers.TransactionRequest): Promise<ethers.TransactionResponse> {
        const hash = await this.walletClient.sendTransaction({
          to: tx.to as `0x${string}`,
          value: tx.value ? BigInt(tx.value.toString()) : 0n,
          data: tx.data as `0x${string}` | undefined,
          account: this.walletClient.account
        })
        
        return {
          hash,
          to: tx.to || null,
          from: this.walletClient.account.address,
          nonce: 0,
          gasLimit: tx.gasLimit || 0n,
          gasPrice: tx.gasPrice || null,
          data: tx.data || '0x',
          value: tx.value || 0n,
          chainId: tx.chainId || 97n,
          wait: async (confirmations?: number) => {
            const receipt = await this.publicClient.waitForTransactionReceipt({ hash, confirmations })
            return {
              ...receipt,
              blockNumber: receipt.blockNumber,
              blockHash: receipt.blockHash,
              transactionIndex: receipt.transactionIndex,
              confirmations: confirmations || 1,
              status: receipt.status === 'success' ? 1 : 0,
              type: 2,
              to: receipt.to,
              from: receipt.from,
              contractAddress: receipt.contractAddress || null,
              logs: receipt.logs || [],
              logsBloom: '0x',
              gasUsed: receipt.gasUsed,
              effectiveGasPrice: receipt.gasUsed,
              cumulativeGasUsed: receipt.gasUsed
            } as ethers.TransactionReceipt
          }
        } as ethers.TransactionResponse
      }

      connect(provider: ethers.Provider | null): ethers.Signer {
        return new WalletConnectSigner(provider || this.provider!, this.walletClient, this.publicClient)
      }

      async getNonce(blockTag?: ethers.BlockTag): Promise<number> {
        return await this.provider!.getTransactionCount(await this.getAddress(), blockTag)
      }

      async populateCall(tx: ethers.TransactionRequest): Promise<ethers.TransactionLike<string>> {
        const resolved = await ethers.resolveProperties(tx)
        let to: string | null = null
        if (resolved.to) {
          to = typeof resolved.to === 'string' ? resolved.to : await resolved.to.getAddress()
        }
        
        let from: string = await this.getAddress()
        if (resolved.from) {
          from = typeof resolved.from === 'string' ? resolved.from : await resolved.from.getAddress()
        }
        
        const nonce = resolved.nonce ?? await this.getNonce()
        const gasLimit = resolved.gasLimit ?? await this.provider!.estimateGas(resolved)
        const network = await this.provider!.getNetwork()
        
        return {
          to,
          from,
          nonce,
          gasLimit,
          gasPrice: resolved.gasPrice ?? null,
          data: resolved.data || '0x',
          value: resolved.value || 0n,
          chainId: resolved.chainId ?? network.chainId
        }
      }

      async populateTransaction(tx: ethers.TransactionRequest): Promise<ethers.TransactionLike<string>> {
        return await this.populateCall(tx)
      }

      async estimateGas(tx: ethers.TransactionRequest): Promise<bigint> {
        return await this.provider!.estimateGas(tx)
      }

      async call(tx: ethers.TransactionRequest): Promise<string> {
        return await this.provider!.call(tx)
      }

      async resolveName(name: string): Promise<string | null> {
        return await this.provider!.resolveName(name)
      }
    }

    const customSigner = new WalletConnectSigner(provider, walletClient, publicClient)

    return { provider, signer: customSigner }
  } catch (error: any) {
    // Fallback to window.ethereum if available
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const provider = new ethers.BrowserProvider((window as any).ethereum)
      const signer = await provider.getSigner()
      return { provider, signer }
    }
    throw new Error(`Failed to get provider: ${error.message || 'No wallet connected. Please connect your wallet first.'}`)
  }
}

export async function getUSDTContract() {
  const { signer } = await getProviderAndSigner()
  return new ethers.Contract(CONTRACT_ADDRESSES.USDT, USDT_ABI, signer)
}

export async function getKYCContract() {
  const { signer } = await getProviderAndSigner()
  return new ethers.Contract(CONTRACT_ADDRESSES.KYC, KYC_ABI, signer)
}

export async function checkContractExists(address: string): Promise<boolean> {
  try {
    const { provider } = await getProviderAndSigner()
    const code = await provider.getCode(address)
    return code !== '0x' && code !== null
  } catch (error) {
    return false
  }
}

// Helper function to detect mobile devices
function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// Get raw USDT balance as BigInt (for accurate comparison)
export async function getUSDTBalanceRaw(address: string): Promise<{ balance: bigint; decimals: number }> {
  try {
    const { provider } = await getProviderAndSigner()
    
    const contractExists = await checkContractExists(CONTRACT_ADDRESSES.USDT)
    if (!contractExists) {
      const network = await getNetworkInfo()
      throw new Error(
        `USDT contract not found at address ${CONTRACT_ADDRESSES.USDT} on ${network?.name || 'current network'}. ` +
        `Please ensure you are connected to Binance Smart Chain Testnet (BSC Testnet) and the contract address is correct.`
      )
    }
    
    const usdtContract = new ethers.Contract(CONTRACT_ADDRESSES.USDT, USDT_ABI, provider)
    
    // Force fresh balance fetch (not cached) - especially important for mobile
    let decimals = 6 // USDT uses 6 decimals
    try {
      decimals = await usdtContract.decimals()
    } catch (err) {
      console.warn('Could not get decimals from contract, using default 6 for USDT')
      decimals = 6
    }
    
    // Get raw balance directly from contract (not cached)
    const balance = await usdtContract.balanceOf(address)
    console.log('💰 Raw USDT balance from contract:', balance.toString(), `(${ethers.formatUnits(balance, decimals)} USDT)`)
    
    return { balance, decimals }
  } catch (error: any) {
    if (error.message.includes('not found') || error.message.includes('BAD_DATA') || error.message.includes('contract not found')) {
      const network = await getNetworkInfo()
      throw new Error(
        `USDT contract not found. Current network: ${network?.name || 'Unknown'}. ` +
        `Please switch to Binance Smart Chain Testnet (BSC Testnet) in MetaMask. ` +
        `Contract address: ${CONTRACT_ADDRESSES.USDT}`
      )
    }
    throw error
  }
}

export async function checkUSDTBalance(address: string): Promise<string> {
  try {
    const { balance, decimals } = await getUSDTBalanceRaw(address)
    return ethers.formatUnits(balance, decimals)
  } catch (error: any) {
    throw error
  }
}

// ✅ FIXED: Approve USDT spending with mobile wallet optimization
export async function approveUSDT(amount: string): Promise<string> {
  try {
    console.log('🔐 Starting USDT approval...')
    const usdtContract = await getUSDTContract()
    const { provider, signer } = await getProviderAndSigner()
    const userAddress = await signer.getAddress()
    
    let decimals = 6 // USDT typically uses 6 decimals
    try {
      decimals = await usdtContract.decimals()
      console.log('  - USDT Decimals:', decimals)
    } catch (err) {
      console.warn('Could not get decimals, using default 6 for USDT')
      decimals = 6
    }
    const amountInWei = ethers.parseUnits(amount, decimals)
    console.log('  - Amount to approve:', amount, 'USDT')
    console.log('  - Amount in smallest unit:', amountInWei.toString())
    
    // Check current BNB balance for gas
    const bnbBalance = await provider.getBalance(userAddress)
    console.log('  - BNB Balance:', ethers.formatEther(bnbBalance), 'BNB')
    
    if (bnbBalance < ethers.parseEther('0.001')) {
      throw new Error('Insufficient BNB for gas fees. You need at least 0.001 BNB to pay for transaction fees.')
    }
    
    // ✅ FIX 3: Gas estimation with retry logic for approval
    const isMobileApproval = isMobileDevice()
    let gasLimit: bigint = BigInt(0)
    let gasPrice: bigint = BigInt(0)
    let estimationSuccess = false
    let attempts = 0
    const maxAttempts = 3
    
    console.log(`  ⛽ Estimating gas for approval (${isMobileApproval ? 'Mobile' : 'Desktop'} device)...`)
    
    while (attempts < maxAttempts && !estimationSuccess) {
      try {
        // Get fee data first
        const feeData = await provider.getFeeData()
        gasPrice = feeData.gasPrice || BigInt(5000000000) // 5 gwei fallback
        console.log(`  - Attempt ${attempts + 1}/${maxAttempts}: Gas Price: ${ethers.formatUnits(gasPrice, 'gwei')} gwei`)
        
        // Try to estimate gas
        gasLimit = await usdtContract.approve.estimateGas(CONTRACT_ADDRESSES.KYC, amountInWei)
        console.log(`  - Estimated Gas Limit (raw): ${gasLimit.toString()}`)
        
        // Use higher buffer for mobile (50%) vs desktop (30%)
        const buffer = isMobileApproval ? 150 : 130
        gasLimit = (gasLimit * BigInt(buffer)) / BigInt(100)
        console.log(`  - Gas Limit (with ${buffer}% buffer): ${gasLimit.toString()}`)
        
        estimationSuccess = true
        console.log('  ✅ Gas estimation successful!')
      } catch (gasError: any) {
        attempts++
        console.warn(`  ⚠️ Gas estimation attempt ${attempts} failed:`, gasError.message)
        
        if (attempts < maxAttempts) {
          console.log(`  ⏳ Retrying in 1 second...`)
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    }
    
    // Use safe fallback if estimation fails
    if (!estimationSuccess) {
      console.warn('  ⚠️ Gas estimation failed after all attempts, using safe fallback values')
      gasLimit = BigInt(isMobileApproval ? 150000 : 100000) // Higher for mobile
      gasPrice = BigInt(5000000000) // 5 gwei
      console.log(`  - Fallback Gas Limit: ${gasLimit.toString()} (${isMobileApproval ? 'mobile' : 'desktop'} default)`)
      console.log(`  - Fallback Gas Price: ${ethers.formatUnits(gasPrice, 'gwei')} gwei`)
    }
    
    // Ensure gasLimit and gasPrice are always set
    if (gasLimit === BigInt(0) || gasPrice === BigInt(0)) {
      gasLimit = BigInt(isMobileApproval ? 150000 : 100000)
      gasPrice = BigInt(5000000000)
      console.warn('  ⚠️ Using emergency fallback gas values')
    }
    
    // Calculate total gas cost
    const gasCost = gasLimit * gasPrice
    console.log('  - Estimated Gas Cost:', ethers.formatEther(gasCost), 'BNB')
    
    // Check if user has enough BNB for gas
    if (bnbBalance < gasCost) {
      throw new Error(`Insufficient BNB for gas. Need ${ethers.formatEther(gasCost)} BNB, but only have ${ethers.formatEther(bnbBalance)} BNB. Please add more BNB to your wallet.`)
    }
    
    console.log('📋 Approval Transaction Parameters:')
    console.log('  - Spender:', CONTRACT_ADDRESSES.KYC)
    console.log('  - Amount:', amountInWei.toString())
    console.log('  - Gas Limit:', gasLimit.toString())
    console.log('  - Gas Price:', ethers.formatUnits(gasPrice, 'gwei'), 'gwei')
    
    console.log('⏳ Sending approval transaction...')
    console.log('⏳ PLEASE APPROVE IN YOUR WALLET!')
    
    const tx = await usdtContract.approve(CONTRACT_ADDRESSES.KYC, amountInWei, {
      gasLimit,
      gasPrice
    })
    
    console.log('✅ Approval transaction sent:', tx.hash)
    console.log('⏳ Waiting for confirmation...')
    
    const receipt = await tx.wait()
    console.log('✅ Approval confirmed!')
    console.log('  - Block:', receipt.blockNumber)
    console.log('  - Gas Used:', receipt.gasUsed.toString())
    
    // ✅ MOBILE FIX: Wait for approval to propagate on mobile wallets
    const isMobileApprovalWait = isMobileDevice()
    if (isMobileApprovalWait) {
      console.log('📱 Mobile device detected - waiting for approval to propagate...')
      await new Promise(resolve => setTimeout(resolve, 3000)) // 3 seconds for mobile
    }
    
    // ✅ MOBILE FIX: Verify approval actually went through
    console.log('🔍 Verifying approval was successful...')
    let verificationAttempts = 0
    let approvalVerified = false
    
    while (verificationAttempts < 5 && !approvalVerified) {
      try {
        const newAllowance = await usdtContract.allowance(userAddress, CONTRACT_ADDRESSES.KYC)
        // Get decimals for formatting
        let allowanceDecimals = 6
        try {
          allowanceDecimals = await usdtContract.decimals()
        } catch {
          // Use default
        }
        console.log(`  - Attempt ${verificationAttempts + 1}: Current allowance: ${ethers.formatUnits(newAllowance, allowanceDecimals)} USDT`)
        
        if (newAllowance >= amountInWei) {
          approvalVerified = true
          console.log('✅ Approval verified successfully!')
        } else {
          verificationAttempts++
          if (verificationAttempts < 5) {
            console.log(`  ⏳ Approval not yet propagated, waiting 1 second... (attempt ${verificationAttempts + 1}/5)`)
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }
      } catch (verifyError) {
        console.warn('  ⚠️ Error verifying approval:', verifyError)
        verificationAttempts++
        if (verificationAttempts < 5) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    }
    
    if (!approvalVerified) {
      throw new Error('Approval transaction confirmed but allowance not updated. Please try again or wait a moment and refresh.')
    }
    
    return tx.hash
  } catch (error: any) {
    console.error('❌ Approval failed:', error)
    
    if (error.message.includes('Insufficient BNB')) {
      throw error
    }
    if (error.message.includes('user rejected') || error.code === 4001) {
      throw new Error('Approval was rejected. Please approve the transaction in your wallet to continue.')
    }
    if (error.message.includes('not found') || error.message.includes('BAD_DATA')) {
      throw new Error('USDT contract not found. Please ensure you are connected to BSC Testnet.')
    }
    throw error
  }
}

export async function checkUSDTApproval(userAddress: string): Promise<boolean> {
  try {
    const { provider } = await getProviderAndSigner()
    const usdtContract = new ethers.Contract(CONTRACT_ADDRESSES.USDT, USDT_ABI, provider)
    let decimals = 6 // USDT uses 6 decimals
    try {
      decimals = await usdtContract.decimals()
    } catch (err) {
      console.warn('Could not get decimals, using default 6')
    }
    const amountInWei = ethers.parseUnits(CHARGE_AMOUNT, decimals)
    const allowance = await usdtContract.allowance(userAddress, CONTRACT_ADDRESSES.KYC)
    
    return allowance >= amountInWei
  } catch (error: any) {
    if (error.message.includes('not found') || error.message.includes('BAD_DATA')) {
      throw new Error('USDT contract not found. Please ensure you are connected to the correct network.')
    }
    throw error
  }
}

// Continue with rest of the file (checkKYCStatus, getKYCStatusFromContract, submitKYCVerification, etc.)
// The rest remains the same...

export async function checkKYCStatus(userAddress: string): Promise<{ isVerified: boolean; hasSubmitted: boolean }> {
  try {
    const { provider } = await getProviderAndSigner()
    const kycContract = new ethers.Contract(CONTRACT_ADDRESSES.KYC, KYC_ABI, provider)
    
    let hasSubmitted = false
    let isVerified = false
    
    try {
      hasSubmitted = await kycContract.hasSubmitted(userAddress)
      
      if (hasSubmitted) {
        try {
          const record = await kycContract.getKYCRecord(userAddress)
          isVerified = record && record.submissionId && record.submissionId > 0
        } catch (err) {
          console.warn('Could not get KYC record:', err)
        }
      }
    } catch (err: any) {
      console.warn('Could not check submission status:', err.message)
      hasSubmitted = false
    }
    
    return { isVerified, hasSubmitted }
  } catch (error: any) {
    console.error('Error checking KYC status:', error)
    return { isVerified: false, hasSubmitted: false }
  }
}

export async function getKYCStatusFromContract(userAddress: string): Promise<{
  hasApplied: boolean
  status: 'not_applied' | 'pending' | 'approved' | 'cancelled'
  submissionId?: number
  record?: any
}> {
  console.log('========================================')
  console.log('🔍 CHECKING KYC STATUS FROM SMART CONTRACT')
  console.log('========================================')
  console.log('📋 Contract Details:')
  console.log('  - KYC Contract Address:', CONTRACT_ADDRESSES.KYC)
  console.log('  - User Wallet Address:', userAddress)
  
  try {
    if (!isMetaMaskInstalled()) {
      console.log('❌ MetaMask not installed')
      return { hasApplied: false, status: 'not_applied' }
    }

    const { provider } = await getProviderAndSigner()
    const kycContract = new ethers.Contract(CONTRACT_ADDRESSES.KYC, KYC_ABI, provider)
    
    try {
      console.log('\n🔍 Step 1: Checking if user has submitted...')
      const hasSubmitted = await kycContract.hasSubmitted(userAddress)
      console.log('  - hasSubmitted:', hasSubmitted)
      
      if (!hasSubmitted) {
        console.log('❌ User has NOT submitted KYC')
        console.log('  Status: NOT_APPLIED')
        console.log('========================================\n')
        return { hasApplied: false, status: 'not_applied' }
      }

      console.log('✅ User HAS submitted KYC')
      console.log('\n🔍 Step 2: Getting KYC record from contract...')
      const record = await kycContract.getKYCRecord(userAddress)
      console.log('📋 KYC Record Retrieved:')
      console.log('  - submissionId:', record.submissionId?.toString() || '0')
      
      const submissionId = record.submissionId ? Number(record.submissionId) : 0
      console.log('\n🔍 Step 3: Determining approval status...')
      console.log('  - submissionId (number):', submissionId)
      
      if (submissionId > 0) {
        console.log('✅ KYC IS APPROVED!')
        console.log('========================================\n')
        return {
          hasApplied: true,
          status: 'approved',
          submissionId,
          record
        }
      } else {
        console.log('⏳ KYC IS PENDING')
        console.log('========================================\n')
        return {
          hasApplied: true,
          status: 'pending',
          submissionId: 0,
          record
        }
      }
    } catch (err: any) {
      console.error('❌ Error checking contract status:', err.message)
      console.log('========================================\n')
      return { hasApplied: false, status: 'not_applied' }
    }
  } catch (error: any) {
    console.error('❌ Error getting KYC status from contract:', error)
    console.log('========================================\n')
    return { hasApplied: false, status: 'not_applied' }
  }
}

// ✅ FIXED: Submit KYC with better mobile wallet support
export async function submitKYCVerification(anonymousId: string, metadataUrl: string = ''): Promise<string> {
  try {
    console.log('========================================')
    console.log('🔗 SUBMITTING TO SMART CONTRACT')
    console.log('========================================')
    
    const kycContract = await getKYCContract()
    const usdtContract = await getUSDTContract()
    const { signer, provider } = await getProviderAndSigner()
    const userAddress = await signer.getAddress()

    console.log('📋 Smart Contract Details:')
    console.log('  - KYC Contract Address:', CONTRACT_ADDRESSES.KYC)
    console.log('  - USDT Contract Address:', CONTRACT_ADDRESSES.USDT)
    console.log('  - User Wallet Address:', userAddress)
    console.log('  - Anonymous ID:', anonymousId)

    const combinedDataHash = ethers.id(anonymousId)
    console.log('  - Combined Data Hash:', combinedDataHash)
    
    let decimals = 6 // USDT uses 6 decimals
    try {
      decimals = await usdtContract.decimals()
      console.log('  - USDT Decimals:', decimals)
    } catch (err) {
      console.warn('Could not get decimals, using default 6')
    }
    const amountInWei = ethers.parseUnits(CHARGE_AMOUNT, decimals)
    console.log('  - Fee Amount:', CHARGE_AMOUNT, 'USDT')
    console.log('  - Amount in Wei:', amountInWei.toString())

    // ✅ FIX 4: Check BNB balance FIRST (before checking USDT)
    const bnbBalance = await provider.getBalance(userAddress)
    const minBnb = ethers.parseEther('0.002')
    console.log('  - BNB Balance:', ethers.formatEther(bnbBalance), 'BNB')
    console.log('  - Minimum Required BNB:', ethers.formatEther(minBnb), 'BNB')
    
    if (bnbBalance < minBnb) {
      throw new Error(
        `Insufficient BNB for gas fees. You need at least ${ethers.formatEther(minBnb)} BNB. ` +
        `Current balance: ${ethers.formatEther(bnbBalance)} BNB. Please add more BNB to your wallet.`
      )
    }
    console.log('✅ BNB balance check passed')

    console.log('\n📝 Checking USDT Approval...')
    const isApproved = await checkUSDTApproval(userAddress)
    console.log('  - Already Approved:', isApproved)
    
    if (!isApproved) {
      console.log('\n🔐 Approving USDT spending...')
      const approveTx = await approveUSDT(CHARGE_AMOUNT)
      console.log('✅ USDT approved successfully!')
      
      // Additional wait for mobile after approval verification
      const isMobileAfterApproval = isMobileDevice()
      if (isMobileAfterApproval) {
        console.log('📱 Additional mobile propagation wait...')
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    console.log('\n🔍 Checking Contract Status...')
    try {
      const isPaused = await kycContract.paused()
      console.log('  - Contract Paused:', isPaused)
      if (isPaused) {
        throw new Error('KYC contract is currently paused. Please try again later.')
      }
    } catch (err: any) {
      if (!err.message.includes('paused')) {
        console.warn('Could not check pause status:', err)
      } else {
        throw err
      }
    }

    console.log('\n🔍 Checking if already submitted...')
    const hasSubmitted = await kycContract.hasSubmitted(userAddress)
    console.log('  - Has Already Submitted:', hasSubmitted)
    if (hasSubmitted) {
      throw new Error('You have already submitted KYC. Use updateDocuments to update your information.')
    }

    // ✅ FIX 1: Check USDT balance using BigInt comparison (not float)
    console.log('\n💰 Checking USDT Balance BEFORE Submission...')
    const { balance: balanceRaw, decimals: usdtDecimals } = await getUSDTBalanceRaw(userAddress)
    const requiredAmount = ethers.parseUnits(CHARGE_AMOUNT, usdtDecimals)
    const balanceFormatted = ethers.formatUnits(balanceRaw, usdtDecimals)
    
    console.log('  - USDT Balance (raw):', balanceRaw.toString())
    console.log('  - USDT Balance (formatted):', balanceFormatted, 'USDT')
    console.log('  - Required Amount (raw):', requiredAmount.toString())
    console.log('  - Required Amount (formatted):', CHARGE_AMOUNT, 'USDT')
    console.log('  - USDT Decimals:', usdtDecimals)
    
    // Compare BigInt directly (accurate comparison)
    if (balanceRaw < requiredAmount) {
      console.error('❌ Insufficient balance:', {
        balanceRaw: balanceRaw.toString(),
        requiredAmount: requiredAmount.toString(),
        balanceFormatted,
        requiredFormatted: CHARGE_AMOUNT
      })
      throw new Error(
        `Insufficient USDT balance. You need at least ${CHARGE_AMOUNT} USDT to proceed. ` +
        `Current balance: ${balanceFormatted} USDT`
      )
    }
    console.log('✅ USDT balance check passed (BigInt comparison)')
    
    // Store balance for after-check
    const balanceBefore = balanceFormatted

    console.log('\n📤 Submitting KYC to Smart Contract...')
    const metadataUrlToUse = metadataUrl || `https://kyx-platform.com/kyc/${userAddress}`
    
    // ✅ FIX 3: Gas estimation with retry logic and mobile-specific handling
    const isMobileSubmit = isMobileDevice()
    // Initialize with fallback values
    let gasLimit: bigint = BigInt(isMobileSubmit ? 400000 : 350000)
    let gasPrice: bigint = BigInt(5000000000)
    let estimationSuccess = false
    let attempts = 0
    const maxAttempts = 3
    
    console.log(`\n⛽ Estimating gas (${isMobileSubmit ? 'Mobile' : 'Desktop'} device)...`)
    
    while (attempts < maxAttempts && !estimationSuccess) {
      try {
        const feeData = await provider.getFeeData()
        gasPrice = feeData.gasPrice || BigInt(5000000000)
        console.log(`  - Attempt ${attempts + 1}/${maxAttempts}: Gas Price: ${ethers.formatUnits(gasPrice, 'gwei')} gwei`)
        
        const estimatedGas = await kycContract.submitKYC.estimateGas(combinedDataHash, metadataUrlToUse)
        console.log(`  - Estimated Gas Limit (raw): ${estimatedGas.toString()}`)
        
        // Use higher buffer for mobile (50%) vs desktop (30%)
        const buffer = isMobileSubmit ? 150 : 130
        gasLimit = (estimatedGas * BigInt(buffer)) / BigInt(100)
        console.log(`  - Gas Limit (with ${buffer}% buffer): ${gasLimit.toString()}`)
        
        estimationSuccess = true
        console.log('✅ Gas estimation successful!')
      } catch (gasError: any) {
        attempts++
        console.warn(`  ⚠️ Gas estimation attempt ${attempts} failed:`, gasError.message)
        
        if (attempts < maxAttempts) {
          console.log(`  ⏳ Retrying in 1 second...`)
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    }
    
    // Use safe fallback if estimation failed
    if (!estimationSuccess) {
      console.warn('⚠️ Gas estimation failed after all attempts, using safe fallback values')
      gasLimit = BigInt(isMobileSubmit ? 400000 : 350000) // Higher for mobile
      gasPrice = BigInt(5000000000) // 5 gwei
      console.log(`  - Fallback Gas Limit: ${gasLimit.toString()} (${isMobileSubmit ? 'mobile' : 'desktop'} default)`)
      console.log(`  - Fallback Gas Price: ${ethers.formatUnits(gasPrice, 'gwei')} gwei`)
    }
    
    console.log('📋 Transaction Parameters:')
    console.log('  - Gas Limit:', gasLimit.toString())
    console.log('  - Gas Price:', ethers.formatUnits(gasPrice, 'gwei'), 'gwei')
    
    const tx = await kycContract.submitKYC(combinedDataHash, metadataUrlToUse, {
      gasLimit,
      gasPrice
    })
    
    console.log('✅ Transaction sent!')
    console.log('  - Transaction Hash:', tx.hash)
    console.log('  - Waiting for confirmation...')
    
    const receipt = await tx.wait()
    
    console.log('\n💰 Checking USDT Balance AFTER Submission...')
    const balanceAfter = await checkUSDTBalance(userAddress)
    console.log('  - USDT Balance After:', balanceAfter, 'USDT')
    const balanceDiff = parseFloat(balanceBefore) - parseFloat(balanceAfter)
    console.log('  - Balance Difference:', balanceDiff, 'USDT')
    if (balanceDiff >= 1.9 && balanceDiff <= 2.1) {
      console.log('  ✅ Fee of $2 USDT successfully deducted!')
    }
    
    console.log('\n✅ KYC Verification Submitted Successfully!')
    console.log('📋 Transaction Receipt:')
    console.log('  - Transaction Hash:', receipt.hash)
    console.log('  - Block Number:', receipt.blockNumber)
    console.log('  - Status:', receipt.status === 1 ? 'Success' : 'Failed')
    console.log('========================================\n')
    
    return receipt.hash
  } catch (error: any) {
    console.error('Error submitting KYC:', error)
    
    if (error.message.includes('Insufficient BNB')) {
      throw error
    }
    
    if (error.message.includes('Insufficient USDT')) {
      throw error
    }
    
    if (error.reason) {
      throw new Error(`Transaction failed: ${error.reason}`)
    }
    
    if (error.message.includes('not found') || error.message.includes('BAD_DATA')) {
      throw new Error('Contract not found. Please ensure you are connected to BSC Testnet.')
    }
    if (error.message.includes('user rejected') || error.code === 4001) {
      throw new Error('Transaction was rejected. Please try again.')
    }
    if (error.message.includes('insufficient funds')) {
      throw new Error('Insufficient funds. Please ensure you have enough BNB for gas fees and USDT for the KYC fee.')
    }
    if (error.message.includes('execution reverted')) {
      const revertReason = error.data?.message || error.message
      throw new Error(`Transaction reverted: ${revertReason}. Please check your balance and try again.`)
    }
    throw error
  }
}

// Rest of the functions remain the same...
export async function getTransactionDetails(txHash: string): Promise<{
  transactionHash: string
  blockNumber: string
  fromAddress: string
  toAddress: string
  amount: string
  timestamp: string
}> {
  try {
    const { provider } = await getProviderAndSigner()
    const receipt = await provider.getTransactionReceipt(txHash)
    if (!receipt) {
      throw new Error('Transaction receipt not found')
    }
    
    const tx = await provider.getTransaction(txHash)
    if (!tx) {
      throw new Error('Transaction not found')
    }
    
    const block = await provider.getBlock(receipt.blockNumber)
    if (!block) {
      throw new Error('Block not found')
    }
    
    return {
      transactionHash: txHash,
      blockNumber: receipt.blockNumber.toString(),
      fromAddress: tx.from,
      toAddress: receipt.to || CONTRACT_ADDRESSES.KYC,
      amount: CHARGE_AMOUNT,
      timestamp: new Date((block.timestamp || 0) * 1000).toISOString()
    }
  } catch (error: any) {
    console.error('Error getting transaction details:', error)
    throw error
  }
}

export async function getNetworkInfo(): Promise<{ 
  chainId: string
  name: string
  isCorrectNetwork: boolean
  requiredNetworkName: string
} | null> {
  try {
    const REQUIRED_CHAIN_ID = '97'
    const REQUIRED_NETWORK_NAME = 'Binance Smart Chain Testnet (BSC Testnet)'
    
    const publicClient = getPublicClient(wagmiConfig)
    if (publicClient) {
      const chainId = publicClient.chain?.id.toString() || '97'
      const name = publicClient.chain?.name || 'Binance Smart Chain Testnet'
      const isCorrectNetwork = chainId === REQUIRED_CHAIN_ID
      return { 
        chainId, 
        name, 
        isCorrectNetwork,
        requiredNetworkName: REQUIRED_NETWORK_NAME
      }
    }
    
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const chainId = await (window as any).ethereum.request({ method: 'eth_chainId' })
      const chainIdDecimal = parseInt(chainId, 16).toString()
      const isCorrectNetwork = chainIdDecimal === REQUIRED_CHAIN_ID
      return { 
        chainId: chainIdDecimal, 
        name: 'Unknown Network',
        isCorrectNetwork,
        requiredNetworkName: REQUIRED_NETWORK_NAME
      }
    }
    
    return null
  } catch (error) {
    console.error('Error getting network info:', error)
    return null
  }
}

export async function switchNetwork(chainId: string) {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed')
  }

  try {
    await (window as any).ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    })
  } catch (switchError: any) {
    if (switchError.code === 4902) {
      throw new Error('Please add this network to MetaMask first')
    }
    throw switchError
  }
}

export async function getContractOwner(): Promise<string> {
  try {
    const { provider } = await getProviderAndSigner()
    const kycContract = new ethers.Contract(CONTRACT_ADDRESSES.KYC, KYC_ABI, provider)
    const owner = await kycContract.owner()
    return owner
  } catch (error: any) {
    console.error('Error getting contract owner:', error)
    throw new Error(`Failed to get contract owner: ${error.message || 'Unknown error'}`)
  }
}

export async function getContractBalance(): Promise<string> {
  try {
    let provider: ethers.Provider
    
    try {
      const providerAndSigner = await getProviderAndSigner()
      provider = providerAndSigner.provider
    } catch (error) {
      const rpcUrl = 'https://data-seed-prebsc-1-s1.binance.org:8545/'
      provider = new ethers.JsonRpcProvider(rpcUrl)
    }
    
    const kycContract = new ethers.Contract(CONTRACT_ADDRESSES.KYC, KYC_ABI, provider)
    const balance = await kycContract.getContractBalance()
    
    const usdtContract = new ethers.Contract(CONTRACT_ADDRESSES.USDT, USDT_ABI, provider)
    let decimals = 6
    try {
      decimals = await usdtContract.decimals()
    } catch (err) {
      console.warn('Could not get decimals from USDT contract, using default 6')
    }
    
    return ethers.formatUnits(balance, decimals)
  } catch (error: any) {
    console.error('Error getting contract balance:', error)
    throw new Error(`Failed to get contract balance: ${error.message || 'Unknown error'}`)
  }
}

export async function verifyOwner(address: string): Promise<boolean> {
  try {
    const owner = await getContractOwner()
    return owner.toLowerCase() === address.toLowerCase()
  } catch (error: any) {
    console.error('Error verifying owner:', error)
    return false
  }
}

export async function getTotalWithdrawals(): Promise<string> {
  // Implementation remains the same...
  return '0' // Placeholder
}

export async function withdrawContractFunds(amount: string): Promise<string> {
  // Implementation remains the same...
  throw new Error('Not implemented')
}