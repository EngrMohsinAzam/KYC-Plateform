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
    // We need to implement all required methods from ethers.Signer interface
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
        // For signing, we'll use sendTransaction which will prompt the user
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
        
        // Return a transaction response-like object
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

      // Implement additional required methods from AbstractSigner
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

// Check if contract exists at address
export async function checkContractExists(address: string): Promise<boolean> {
  try {
    const { provider } = await getProviderAndSigner()
    const code = await provider.getCode(address)
    return code !== '0x' && code !== null
  } catch (error) {
    return false
  }
}

// Check USDT balance
export async function checkUSDTBalance(address: string): Promise<string> {
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
    
    let decimals = 18
    try {
      decimals = await usdtContract.decimals()
    } catch (err) {
      console.warn('Could not get decimals from contract, using default 18')
      decimals = 18
    }
    
    const balance = await usdtContract.balanceOf(address)
    return ethers.formatUnits(balance, decimals)
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

// Approve USDT spending
export async function approveUSDT(amount: string): Promise<string> {
  try {
    const usdtContract = await getUSDTContract()
    let decimals = 18
    try {
      decimals = await usdtContract.decimals()
    } catch (err) {
      console.warn('Could not get decimals, using default 18')
    }
    const amountInWei = ethers.parseUnits(amount, decimals)
    
    const tx = await usdtContract.approve(CONTRACT_ADDRESSES.KYC, amountInWei)
    await tx.wait()
    return tx.hash
  } catch (error: any) {
    if (error.message.includes('not found') || error.message.includes('BAD_DATA')) {
      throw new Error('USDT contract not found. Please ensure you are connected to the correct network.')
    }
    throw error
  }
}

// Check if USDT is already approved
export async function checkUSDTApproval(userAddress: string): Promise<boolean> {
  try {
    const { provider } = await getProviderAndSigner()
    const usdtContract = new ethers.Contract(CONTRACT_ADDRESSES.USDT, USDT_ABI, provider)
    let decimals = 18
    try {
      decimals = await usdtContract.decimals()
    } catch (err) {
      console.warn('Could not get decimals, using default 18')
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

// Check if user has already submitted KYC
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

// Get comprehensive KYC status from smart contract
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
      // Check if user has submitted
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
      // Get the KYC record
      const record = await kycContract.getKYCRecord(userAddress)
      console.log('📋 KYC Record Retrieved:')
      console.log('  - submissionId:', record.submissionId?.toString() || '0')
      console.log('  - initialSubmitTime:', record.initialSubmitTime?.toString() || 'N/A')
      console.log('  - lastUpdateTime:', record.lastUpdateTime?.toString() || 'N/A')
      console.log('  - paidFee:', record.paidFee?.toString() || 'N/A')
      console.log('  - submitter:', record.submitter || 'N/A')
      console.log('  - combinedDataHash:', record.combinedDataHash || 'N/A')
      console.log('  - metadataUrl:', record.metadataUrl || 'N/A')
      console.log('  - updateCount:', record.updateCount?.toString() || '0')
      
      // Determine status based on submissionId
      // If submissionId > 0, it's approved/verified
      // If submissionId == 0, it's pending (submitted but not approved yet)
      const submissionId = record.submissionId ? Number(record.submissionId) : 0
      console.log('\n🔍 Step 3: Determining approval status...')
      console.log('  - submissionId (number):', submissionId)
      console.log('  - submissionId > 0?', submissionId > 0)
      
      if (submissionId > 0) {
        console.log('✅ KYC IS APPROVED!')
        console.log('  - submissionId > 0 means the KYC has been verified/approved')
        console.log('  - Status: APPROVED')
        console.log('========================================\n')
        return {
          hasApplied: true,
          status: 'approved',
          submissionId,
          record
        }
      } else {
        console.log('⏳ KYC IS PENDING')
        console.log('  - submissionId = 0 means submitted but not yet approved')
        console.log('  - Status: PENDING (waiting for approval)')
        console.log('========================================\n')
        // Submitted but not yet approved - check backend for more details
        return {
          hasApplied: true,
          status: 'pending',
          submissionId: 0,
          record
        }
      }
    } catch (err: any) {
      console.error('❌ Error checking contract status:', err.message)
      console.error('  Error details:', err)
      console.log('========================================\n')
      return { hasApplied: false, status: 'not_applied' }
    }
  } catch (error: any) {
    console.error('❌ Error getting KYC status from contract:', error)
    console.log('========================================\n')
    return { hasApplied: false, status: 'not_applied' }
  }
}

// Submit KYC verification to smart contract
export async function submitKYCVerification(anonymousId: string, metadataUrl: string = ''): Promise<string> {
  try {
    console.log('========================================')
    console.log('🔗 SUBMITTING TO SMART CONTRACT')
    console.log('========================================')
    
    const kycContract = await getKYCContract()
    const usdtContract = await getUSDTContract()
    const signer = await (await getProviderAndSigner()).signer
    const userAddress = await signer.getAddress()

    console.log('📋 Smart Contract Details:')
    console.log('  - KYC Contract Address:', CONTRACT_ADDRESSES.KYC)
    console.log('  - USDT Contract Address:', CONTRACT_ADDRESSES.USDT)
    console.log('  - User Wallet Address:', userAddress)
    console.log('  - Anonymous ID:', anonymousId)

    const combinedDataHash = ethers.id(anonymousId)
    console.log('  - Combined Data Hash:', combinedDataHash)
    
    let decimals = 18
    try {
      decimals = await usdtContract.decimals()
      console.log('  - USDT Decimals:', decimals)
    } catch (err) {
      console.warn('Could not get decimals, using default 18')
    }
    const amountInWei = ethers.parseUnits(CHARGE_AMOUNT, decimals)
    console.log('  - Fee Amount:', CHARGE_AMOUNT, 'USDT')
    console.log('  - Amount in Wei:', amountInWei.toString())

    console.log('\n📝 Checking USDT Approval...')
    const isApproved = await checkUSDTApproval(userAddress)
    console.log('  - Already Approved:', isApproved)
    
    if (!isApproved) {
      console.log('\n🔐 Approving USDT spending...')
      console.log('  - Spender (KYC Contract):', CONTRACT_ADDRESSES.KYC)
      console.log('  - Amount:', amountInWei.toString())
      const approveTx = await usdtContract.approve(CONTRACT_ADDRESSES.KYC, amountInWei)
      console.log('  - Approval Transaction Hash:', approveTx.hash)
      console.log('  - Waiting for confirmation...')
      const approveReceipt = await approveTx.wait()
      console.log('✅ USDT approved successfully!')
      console.log('  - Approval Receipt Hash:', approveReceipt.hash)
      console.log('  - Block Number:', approveReceipt.blockNumber)
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

    // Check USDT balance BEFORE submission
    console.log('\n💰 Checking USDT Balance BEFORE Submission...')
    const balanceBefore = await checkUSDTBalance(userAddress)
    console.log('  - USDT Balance Before:', balanceBefore, 'USDT')
    
    console.log('\n📤 Submitting KYC to Smart Contract...')
    const metadataUrlToUse = metadataUrl || `https://kyx-platform.com/kyc/${userAddress}`
    console.log('📋 Transaction Parameters:')
    console.log('  - Function: submitKYC')
    console.log('  - combinedDataHash:', combinedDataHash)
    console.log('  - metadataUrl:', metadataUrlToUse)
    console.log('  - Contract Address:', CONTRACT_ADDRESSES.KYC)
    console.log('  - Expected Fee Deduction: $2 USDT')
    
    const tx = await kycContract.submitKYC(combinedDataHash, metadataUrlToUse)
    console.log('✅ Transaction sent!')
    console.log('  - Transaction Hash:', tx.hash)
    console.log('  - Waiting for confirmation...')
    
    const receipt = await tx.wait()
    
    // Check USDT balance AFTER submission to verify fee deduction
    console.log('\n💰 Checking USDT Balance AFTER Submission...')
    const balanceAfter = await checkUSDTBalance(userAddress)
    console.log('  - USDT Balance After:', balanceAfter, 'USDT')
    const balanceDiff = parseFloat(balanceBefore) - parseFloat(balanceAfter)
    console.log('  - Balance Difference:', balanceDiff, 'USDT')
    if (balanceDiff >= 1.9 && balanceDiff <= 2.1) {
      console.log('  ✅ Fee of $2 USDT successfully deducted!')
    } else {
      console.warn('  ⚠️ Fee deduction verification: Balance difference is', balanceDiff, 'USDT (expected ~2 USDT)')
    }
    
    console.log('\n✅ KYC Verification Submitted Successfully!')
    console.log('📋 Transaction Receipt:')
    console.log('  - Transaction Hash:', receipt.hash)
    console.log('  - Block Number:', receipt.blockNumber)
    console.log('  - Gas Used:', receipt.gasUsed?.toString())
    console.log('  - Status:', receipt.status === 1 ? 'Success' : 'Failed')
    console.log('  - From:', receipt.from)
    console.log('  - To:', receipt.to)
    console.log('  - Fee Deducted: $2 USDT')
    console.log('========================================\n')
    
    return receipt.hash
  } catch (error: any) {
    console.error('Error submitting KYC:', error)
    
    if (error.reason) {
      throw new Error(`Transaction failed: ${error.reason}`)
    }
    
    if (error.message.includes('not found') || error.message.includes('BAD_DATA')) {
      throw new Error('Contract not found. Please ensure you are connected to the correct network (Binance Smart Chain Testnet).')
    }
    if (error.message.includes('user rejected') || error.code === 4001) {
      throw new Error('Transaction was rejected. Please try again.')
    }
    if (error.message.includes('execution reverted')) {
      const revertReason = error.data?.message || error.message
      throw new Error(`Transaction reverted: ${revertReason}. Please check your balance and try again.`)
    }
    throw error
  }
}

// Get transaction details from receipt
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

// Get network info
export async function getNetworkInfo(): Promise<{ 
  chainId: string
  name: string
  isCorrectNetwork: boolean
  requiredNetworkName: string
} | null> {
  try {
    const REQUIRED_CHAIN_ID = '97' // Binance Smart Chain Testnet
    const REQUIRED_NETWORK_NAME = 'Binance Smart Chain Testnet (BSC Testnet)'
    
    // Try to get network info from wagmi
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
    
    // Fallback to window.ethereum
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


// Switch to a specific network (if needed)
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

// Get contract owner address
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

// Get contract balance (USDT balance in the contract)
export async function getContractBalance(): Promise<string> {
  try {
    let provider: ethers.Provider
    
    // Try to get provider from wallet, fallback to public RPC
    try {
      const providerAndSigner = await getProviderAndSigner()
      provider = providerAndSigner.provider
    } catch (error) {
      // Fallback to public RPC provider if wallet is not connected
      const rpcUrl = 'https://data-seed-prebsc-1-s1.binance.org:8545/'
      provider = new ethers.JsonRpcProvider(rpcUrl)
    }
    
    const kycContract = new ethers.Contract(CONTRACT_ADDRESSES.KYC, KYC_ABI, provider)
    const balance = await kycContract.getContractBalance()
    
    // Get USDT decimals to format the balance
    const usdtContract = new ethers.Contract(CONTRACT_ADDRESSES.USDT, USDT_ABI, provider)
    let decimals = 18
    try {
      decimals = await usdtContract.decimals()
    } catch (err) {
      console.warn('Could not get decimals from USDT contract, using default 18')
    }
    
    return ethers.formatUnits(balance, decimals)
  } catch (error: any) {
    console.error('Error getting contract balance:', error)
    throw new Error(`Failed to get contract balance: ${error.message || 'Unknown error'}`)
  }
}

// Verify if address is the contract owner
export async function verifyOwner(address: string): Promise<boolean> {
  try {
    const owner = await getContractOwner()
    return owner.toLowerCase() === address.toLowerCase()
  } catch (error: any) {
    console.error('Error verifying owner:', error)
    return false
  }
}

// Get total withdrawals by querying FundsWithdrawn events
export async function getTotalWithdrawals(): Promise<string> {
  try {
    console.log('🔍 Fetching total withdrawals from contract events...')
    console.log('📋 Contract Address:', CONTRACT_ADDRESSES.KYC)
    
    let provider: ethers.Provider
    
    // Try to get provider from wallet, fallback to public RPC
    try {
      const providerAndSigner = await getProviderAndSigner()
      provider = providerAndSigner.provider
    } catch (error) {
      // Fallback to public RPC provider if wallet is not connected
      const rpcUrl = 'https://data-seed-prebsc-1-s1.binance.org:8545/'
      provider = new ethers.JsonRpcProvider(rpcUrl)
    }
    
    const kycContract = new ethers.Contract(CONTRACT_ADDRESSES.KYC, KYC_ABI, provider)
    const eventInterface = kycContract.interface
    
    // Get current block number
    let currentBlock = 0
    try {
      currentBlock = await provider.getBlockNumber()
      console.log(`📊 Current block number: ${currentBlock}`)
    } catch (err) {
      console.warn('Could not get current block number, using latest')
      currentBlock = 0
    }
    
    // Get the event fragment and compute topic hash
    // In ethers v6, we compute the topic hash from the event signature
    const eventFragment = eventInterface.getEvent('FundsWithdrawn')
    // Event signature: FundsWithdrawn(address,uint256,uint256)
    // Compute topic hash using ethers.id
    const eventSignature = 'FundsWithdrawn(address,uint256,uint256)'
    const eventTopic = ethers.id(eventSignature)
    console.log('📋 Event signature:', eventSignature)
    console.log('📋 Event topic:', eventTopic)
    
    // RPC nodes have a limit of 50,000 blocks per query
    // Query in chunks to avoid "exceed maximum block range" error
    const MAX_BLOCK_RANGE = 50000
    let allLogs: any[] = []
    
    // Determine starting block - start from recent blocks to avoid pruned history
    // Use a safe range: query last 2 * MAX_BLOCK_RANGE blocks (100,000 blocks)
    // This ensures we get recent withdrawals while avoiding pruned historical data and rate limits
    let fromBlock = 0
    let toBlock = currentBlock || 'latest'
    
    if (typeof toBlock === 'number' && toBlock > 0) {
      // Start with a smaller, more efficient range
      // Query last 100k blocks first (about 1-2 weeks on BSC Testnet)
      // This should capture most recent withdrawals quickly
      // Only expand if no events found
      const INITIAL_BLOCK_RANGE = 100000 // Start with 100k blocks
      fromBlock = Math.max(0, toBlock - INITIAL_BLOCK_RANGE)
      const blockRange = toBlock - fromBlock
      console.log(`📊 Querying events from block ${fromBlock} to ${toBlock} (${blockRange.toLocaleString()} blocks)...`)
      console.log(`📊 Starting with recent blocks for faster results`)
    } else {
      // If we can't get current block, try from block 0
      fromBlock = 0
      console.log(`📊 Querying events from block 0 to latest...`)
    }
    
    // Helper function to query logs with retry logic
    const queryLogsWithRetry = async (
      fromBlock: number,
      toBlock: number,
      maxRetries: number = 3
    ): Promise<any[]> => {
      let lastError: any = null
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          // Add delay before retry (exponential backoff with longer delays)
          if (attempt > 0) {
            const delayMs = Math.min(2000 * Math.pow(2, attempt - 1), 20000) // Max 20 seconds, start with 2s
            console.log(`  ⏳ Retrying after ${delayMs}ms delay (attempt ${attempt + 1}/${maxRetries})...`)
            await new Promise(resolve => setTimeout(resolve, delayMs))
          }
          
          const logs = await provider.getLogs({
            address: CONTRACT_ADDRESSES.KYC,
            topics: [eventTopic],
            fromBlock: fromBlock,
            toBlock: toBlock
          })
          
          return logs
        } catch (error: any) {
          lastError = error
          const errorMessage = error.message || String(error)
          
          // Check if it's a rate limit error
          if (errorMessage.includes('rate limit') || 
              errorMessage.includes('rate_limit') ||
              error.code === -32005 ||
              (error.data?.error?.code === -32005)) {
            // Rate limit - will retry with backoff
            if (attempt < maxRetries - 1) {
              console.warn(`  ⚠️ Rate limit hit, will retry...`)
              continue
            } else {
              console.error(`  ❌ Rate limit error after ${maxRetries} attempts`)
              throw error
            }
          }
          
          // Check if it's a "History has been pruned" error
          if (errorMessage.includes('History has been pruned') || 
              errorMessage.includes('pruned')) {
            // Don't retry for pruned history
            throw error
          }
          
          // Check if it's a "exceed maximum block range" error
          if (errorMessage.includes('exceed maximum block range')) {
            // Don't retry - need to use smaller chunks
            throw error
          }
          
          // For other errors, retry once
          if (attempt < maxRetries - 1) {
            continue
          }
          
          throw error
        }
      }
      
      throw lastError || new Error('Failed to query logs after retries')
    }
    
    // If current block is known and range is large, query in chunks
    // Query backwards from most recent to oldest to prioritize recent withdrawals
    // Since we're only querying 1 chunk (50k blocks), this should rarely be needed
    if (typeof toBlock === 'number' && (toBlock - fromBlock) > MAX_BLOCK_RANGE) {
      console.log(`📊 Querying events in chunks of ${MAX_BLOCK_RANGE} blocks (starting from most recent)...`)
      
      let prunedChunksSkipped = 0
      let rateLimitedChunks = 0
      
      // Calculate number of chunks needed
      const totalBlocks = toBlock - fromBlock
      const numChunks = Math.ceil(totalBlocks / MAX_BLOCK_RANGE)
      
      // Query backwards from most recent to oldest
      // This ensures we get recent withdrawals first even if rate limiting occurs
      // Stop early if we find events in recent chunks (optimization)
      for (let chunkIndex = numChunks - 1; chunkIndex >= 0; chunkIndex--) {
        // Calculate chunk boundaries: start from most recent and work backwards
        // Most recent chunk (chunkIndex = numChunks - 1): from (toBlock - MAX_BLOCK_RANGE + 1) to toBlock
        // Next chunk: from (toBlock - 2*MAX_BLOCK_RANGE + 1) to (toBlock - MAX_BLOCK_RANGE)
        // Oldest chunk (chunkIndex = 0): from fromBlock to (fromBlock + MAX_BLOCK_RANGE - 1)
        const blocksFromEnd = (numChunks - 1 - chunkIndex) * MAX_BLOCK_RANGE
        const chunkEnd = chunkIndex === 0 
          ? Math.min(toBlock, fromBlock + MAX_BLOCK_RANGE - 1)
          : Math.min(toBlock, toBlock - blocksFromEnd)
        const chunkStart = chunkIndex === 0
          ? fromBlock
          : Math.max(fromBlock, chunkEnd - MAX_BLOCK_RANGE + 1)
        
        // Skip if chunk is invalid
        if (chunkStart > chunkEnd || chunkStart < fromBlock) {
          continue
        }
        
        try {
          // Only add delay between chunks if not skipping pruned history
          // Reduced delay for better performance (1 second instead of 5)
          if (chunkIndex < numChunks - 1) {
            const delayMs = 1000 // 1 second delay between chunks (reduced from 5s)
            console.log(`  ⏳ Waiting ${delayMs}ms before next chunk...`)
            await new Promise(resolve => setTimeout(resolve, delayMs))
          }
          
          console.log(`  🔍 Querying chunk ${chunkIndex + 1}/${numChunks}: block ${chunkStart} to ${chunkEnd}...`)
          const chunkLogs = await queryLogsWithRetry(chunkStart, chunkEnd)
          
          if (chunkLogs.length > 0) {
            console.log(`  ✅ Found ${chunkLogs.length} event(s) in chunk ${chunkStart}-${chunkEnd}`)
            allLogs = allLogs.concat(chunkLogs)
            
            // Optimization: If we found events in recent chunks and we've checked at least 2 chunks,
            // we can stop early since withdrawals are typically recent
            // Only continue if we're in the first few chunks (most recent)
            if (chunkIndex >= numChunks - 3 && allLogs.length > 0) {
              console.log(`  ⚡ Found events in recent chunks - stopping early for performance`)
              break
            }
          } else {
            allLogs = allLogs.concat(chunkLogs)
          }
          
        } catch (chunkError: any) {
          const errorMessage = chunkError.message || String(chunkError)
          
          // Check if it's a "History has been pruned" error
          if (errorMessage.includes('History has been pruned') || 
              errorMessage.includes('pruned')) {
            prunedChunksSkipped++
            console.warn(`  ⚠️ Chunk ${chunkStart}-${chunkEnd} has pruned history, skipping...`)
            // No delay when skipping pruned chunks - continue immediately
            continue
          }
          
          // Check if it's a rate limit error
          if (errorMessage.includes('rate limit') || 
              errorMessage.includes('rate_limit') ||
              chunkError.code === -32005 ||
              (chunkError.data?.error?.code === -32005)) {
            rateLimitedChunks++
            console.warn(`  ⚠️ Rate limit for chunk ${chunkStart}-${chunkEnd}, skipping...`)
            // If this is the most recent chunk and we already have some logs, continue
            // Otherwise, we might want to stop here to avoid more rate limits
            if (chunkIndex === numChunks - 1 && allLogs.length === 0) {
              // Most recent chunk failed and we have no data - try one more time with longer delay
              console.log(`  ⏳ Most recent chunk failed, waiting 5 seconds before retry...`)
              await new Promise(resolve => setTimeout(resolve, 5000))
              try {
                const retryLogs = await queryLogsWithRetry(chunkStart, chunkEnd)
                allLogs = allLogs.concat(retryLogs)
                if (retryLogs.length > 0) {
                  console.log(`  ✅ Retry successful: Found ${retryLogs.length} event(s)`)
                }
                continue
              } catch (retryError) {
                console.warn(`  ❌ Retry also failed, skipping this chunk`)
              }
            }
            continue
          }
          
          // Check if it's a "exceed maximum block range" error
          if (errorMessage.includes('exceed maximum block range')) {
            // Try smaller chunks
            const smallerChunk = Math.floor(MAX_BLOCK_RANGE / 2)
            const smallerEnd = Math.min(chunkStart + smallerChunk - 1, chunkEnd)
            try {
              // Add delay before smaller chunk query
              await new Promise(resolve => setTimeout(resolve, 3000))
              
              const smallerLogs = await queryLogsWithRetry(chunkStart, smallerEnd)
              allLogs = allLogs.concat(smallerLogs)
            } catch (e) {
              // If smaller chunk also fails, skip it
              console.warn(`  ⚠️ Failed to query smaller chunk, skipping...`)
            }
          } else {
            // Other errors - log and skip
            console.warn(`  ⚠️ Error querying chunk ${chunkStart}-${chunkEnd}:`, errorMessage)
          }
        }
      }
      
      if (prunedChunksSkipped > 0) {
        console.log(`ℹ️ Skipped ${prunedChunksSkipped} chunk(s) with pruned history (not accessible from this RPC node)`)
      }
      if (rateLimitedChunks > 0) {
        console.warn(`⚠️ Skipped ${rateLimitedChunks} chunk(s) due to rate limiting. Recent withdrawals may still be captured.`)
      }
      
      // If we found events, we're done. If not, try expanding the range
      // But only if we didn't find any events at all
      if (allLogs.length === 0 && prunedChunksSkipped === numChunks) {
        // All chunks were pruned - try querying only the most recent 10k blocks
        console.log(`⚠️ All chunks were pruned. Trying most recent 10,000 blocks only...`)
        try {
          const recentFromBlock = Math.max(0, toBlock - 10000)
          const recentLogs = await queryLogsWithRetry(recentFromBlock, toBlock)
          if (recentLogs.length > 0) {
            console.log(`✅ Found ${recentLogs.length} event(s) in most recent blocks`)
            allLogs = recentLogs
          }
        } catch (recentError) {
          console.warn(`⚠️ Could not query recent blocks:`, recentError)
        }
      }
    } else {
      // Query all at once if range is small enough (single chunk)
      console.log(`🔍 Querying FundsWithdrawn events using getLogs (single chunk)...`)
      // Reduced delay for better performance (500ms instead of 2000ms)
      await new Promise(resolve => setTimeout(resolve, 500))
      try {
        if (typeof fromBlock === 'number' && typeof toBlock === 'number') {
          allLogs = await queryLogsWithRetry(fromBlock, toBlock)
        } else {
          // Fallback to direct query if types don't match
          allLogs = await provider.getLogs({
            address: CONTRACT_ADDRESSES.KYC,
            topics: [eventTopic],
            fromBlock: fromBlock,
            toBlock: toBlock
          })
        }
      } catch (error: any) {
        const errorMessage = error.message || String(error)
        
        // Check for rate limit errors
        if (errorMessage.includes('rate limit') || 
            errorMessage.includes('rate_limit') ||
            error.code === -32005 ||
            (error.data?.error?.code === -32005)) {
          // If rate limited, try multiple strategies:
          // 1. Try querying only the last 5,000 blocks (very recent)
          // 2. If that fails, try even smaller ranges
          // 3. Use multiple RPC endpoints as fallback
          console.warn('⚠️ Rate limited, trying alternative query strategies...')
          if (typeof toBlock === 'number') {
            // Strategy 1: Try last 5,000 blocks
            try {
              await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
              const veryRecentFromBlock = Math.max(0, toBlock - 5000)
              console.log('  🔄 Strategy 1: Querying last 5,000 blocks...')
              allLogs = await queryLogsWithRetry(veryRecentFromBlock, toBlock)
              console.log('✅ Successfully queried last 5,000 blocks')
            } catch (retryError1) {
              console.warn('  ⚠️ Strategy 1 failed, trying Strategy 2...')
              // Strategy 2: Try even smaller range - last 1,000 blocks
              try {
                await new Promise(resolve => setTimeout(resolve, 3000))
                const tinyFromBlock = Math.max(0, toBlock - 1000)
                console.log('  🔄 Strategy 2: Querying last 1,000 blocks...')
                allLogs = await queryLogsWithRetry(tinyFromBlock, toBlock)
                console.log('✅ Successfully queried last 1,000 blocks')
              } catch (retryError2) {
                console.warn('  ⚠️ Strategy 2 failed, trying alternative RPC endpoint...')
                // Strategy 3: Try alternative RPC endpoint
                try {
                  const altRpcUrl = 'https://bsc-testnet.publicnode.com'
                  const altProvider = new ethers.JsonRpcProvider(altRpcUrl)
                  await new Promise(resolve => setTimeout(resolve, 3000))
                  const recentFromBlock = Math.max(0, toBlock - 10000)
                  console.log('  🔄 Strategy 3: Using alternative RPC endpoint...')
                  allLogs = await altProvider.getLogs({
                    address: CONTRACT_ADDRESSES.KYC,
                    topics: [eventTopic],
                    fromBlock: recentFromBlock,
                    toBlock: toBlock
                  })
                  console.log('✅ Successfully queried using alternative RPC')
                } catch (retryError3) {
                  console.warn('⚠️ All query strategies failed due to rate limiting')
                  // Don't return empty - throw error so caller knows it failed
                  throw new Error('Rate limited on all RPC endpoints. Please try again later.')
                }
              }
            }
          } else {
            throw new Error('Rate limited and cannot determine block range')
          }
        } else if (errorMessage.includes('exceed maximum block range')) {
          // Fallback: query only last 10,000 blocks
          console.warn('⚠️ Block range too large, querying only last 10,000 blocks...')
          const recentFromBlock = typeof toBlock === 'number' ? Math.max(0, toBlock - 10000) : 0
          allLogs = await provider.getLogs({
            address: CONTRACT_ADDRESSES.KYC,
            topics: [eventTopic],
            fromBlock: recentFromBlock,
            toBlock: toBlock
          })
        } else if (errorMessage.includes('History has been pruned') || 
                   errorMessage.includes('pruned')) {
          // If even recent blocks are pruned, try querying from an even more recent block
          console.warn('⚠️ History pruned, querying only very recent blocks...')
          const veryRecentFromBlock = typeof toBlock === 'number' ? Math.max(0, toBlock - 10000) : 0
          try {
            allLogs = await provider.getLogs({
              address: CONTRACT_ADDRESSES.KYC,
              topics: [eventTopic],
              fromBlock: veryRecentFromBlock,
              toBlock: toBlock
            })
          } catch (e) {
            // If this also fails, return empty result
            console.warn('⚠️ Could not query any events due to pruned history')
            allLogs = []
          }
        } else {
          throw error
        }
      }
    }
    
    console.log(`✅ Found ${allLogs.length} FundsWithdrawn event log(s) total`)
    
    // Get USDT decimals to format the balance
    const usdtContract = new ethers.Contract(CONTRACT_ADDRESSES.USDT, USDT_ABI, provider)
    let decimals = 18
    try {
      decimals = await usdtContract.decimals()
      console.log(`💰 USDT decimals: ${decimals}`)
    } catch (err) {
      console.warn('Could not get decimals from USDT contract, using default 18')
    }
    
    // Parse each log and extract the amount
    let totalWithdrawals = BigInt(0)
    for (let i = 0; i < allLogs.length; i++) {
      const log = allLogs[i]
      try {
        console.log(`\n📝 Processing log ${i + 1}/${allLogs.length}:`)
        console.log('  - Block:', log.blockNumber)
        console.log('  - Tx Hash:', log.transactionHash)
        console.log('  - Topics:', log.topics.length)
        console.log('  - Data length:', log.data.length)
        
        // Parse the log using the event interface
        const parsedLog = eventInterface.parseLog({
          topics: log.topics as string[],
          data: log.data
        })
        
        if (parsedLog && parsedLog.args) {
          console.log('  ✅ Successfully parsed log')
          
          // Extract amount - in ethers v6, args can be accessed as array or object
          let amount: bigint | null = null
          
          // Method 1: Try as array index (args[1] is amount, args[0] is owner, args[2] is timestamp)
          try {
            if (Array.isArray(parsedLog.args)) {
              amount = parsedLog.args[1] as bigint
              console.log('  - Amount (array access):', amount.toString())
            } else {
              // Method 2: Try as object property
              const argsObj = parsedLog.args as any
              if ('amount' in argsObj) {
                amount = argsObj.amount as bigint
                console.log('  - Amount (object access):', amount.toString())
              } else {
                // Method 3: Try accessing by index on Result type
                amount = (parsedLog.args as any)[1] as bigint
                console.log('  - Amount (index access):', amount?.toString())
              }
            }
          } catch (e) {
            console.warn('  ⚠️ Error accessing amount:', e)
          }
          
          if (amount) {
            totalWithdrawals += amount
            const formattedAmount = ethers.formatUnits(amount, decimals)
            console.log(`  ✅ Withdrawal: ${formattedAmount} USDT`)
          } else {
            console.warn('  ❌ Could not extract amount from parsed log')
            console.warn('  - Parsed args:', parsedLog.args)
            console.warn('  - Args type:', typeof parsedLog.args)
            console.warn('  - Args keys:', Object.keys(parsedLog.args as any))
          }
        } else {
          console.warn('  ❌ Could not parse log')
        }
      } catch (parseError: any) {
        console.error(`  ❌ Error processing log ${i + 1}:`, parseError)
        console.error('  - Error message:', parseError.message)
        console.error('  - Log data:', {
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
          topics: log.topics,
          data: log.data
        })
      }
    }
    
    const totalFormatted = ethers.formatUnits(totalWithdrawals, decimals)
    console.log(`\n💰 Total withdrawals calculated: ${totalFormatted} USDT`)
    console.log(`💰 Total withdrawals (raw): ${totalWithdrawals.toString()}`)
    console.log(`📊 Events found: ${allLogs.length}`)
    
    // If we found 0 events but we know there should be withdrawals, log a warning
    if (allLogs.length === 0 && totalWithdrawals === BigInt(0)) {
      console.warn('⚠️ WARNING: No withdrawal events found. This could mean:')
      console.warn('  1. No withdrawals have been made yet')
      console.warn('  2. The query range is too small (withdrawals are in older blocks)')
      console.warn('  3. Rate limiting prevented querying all blocks')
      console.warn('  4. The contract address might be incorrect')
    }
    
    return totalFormatted
  } catch (error: any) {
    console.error('❌ Error getting total withdrawals:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      data: error.data,
      stack: error.stack
    })
    
    // If it's a rate limit error, don't return 0 - throw so caller can handle it
    const errorMessage = error.message || String(error)
    if (errorMessage.includes('rate limit') || 
        errorMessage.includes('rate_limit') ||
        error.code === -32005 ||
        (error.data?.error?.code === -32005)) {
      console.error('❌ Rate limit error - cannot fetch withdrawals at this time')
      throw new Error('Rate limited: Unable to fetch total withdrawals. Please try again in a few moments.')
    }
    
    // For other errors, return 0 but log it clearly
    console.warn('⚠️ Returning 0 due to error - this may not reflect actual withdrawals')
    return '0'
  }
}

/**
 * Withdraw funds from contract to owner's wallet
 * 
 * Flow:
 * 1. Verify the caller is the contract owner
 * 2. Check contract has sufficient USDT balance
 * 3. Get owner's wallet balance before withdrawal
 * 4. Call contract's withdrawFunds(uint256 _amount) function
 *    - This should transfer USDT from contract address to msg.sender (owner's wallet)
 * 5. Parse transaction logs to verify FundsWithdrawn event
 * 6. Verify owner's wallet balance increased
 * 7. Verify contract balance decreased
 * 
 * The contract's withdrawFunds function should:
 * - Transfer USDT tokens from contract to msg.sender (the owner calling the function)
 * - Emit FundsWithdrawn event with owner address, amount, and timestamp
 * 
 * @param amount - Amount to withdraw in USDT (will be converted to wei based on token decimals)
 * @returns Transaction hash
 */
export async function withdrawContractFunds(amount: string): Promise<string> {
  try {
    console.log('========================================')
    console.log('💰 WITHDRAWING FUNDS FROM CONTRACT')
    console.log('========================================')
    
    const { signer } = await getProviderAndSigner()
    const userAddress = await signer.getAddress()
    
    console.log('📋 Withdrawal Details:')
    console.log('  - Contract Address:', CONTRACT_ADDRESSES.KYC)
    console.log('  - User Wallet Address:', userAddress)
    console.log('  - Amount:', amount, 'USDT')
    
    // Verify owner before proceeding
    console.log('\n🔍 Verifying ownership...')
    const isOwner = await verifyOwner(userAddress)
    if (!isOwner) {
      const owner = await getContractOwner()
      throw new Error(`Only the contract owner can withdraw funds. Current owner: ${owner}. Your address: ${userAddress}`)
    }
    console.log('✅ Ownership verified!')
    
    // Get contract balance
    console.log('\n💰 Checking contract balance...')
    const contractBalance = await getContractBalance()
    console.log('  - Contract Balance:', contractBalance, 'USDT')
    
    // Get USDT decimals
    const usdtContract = await getUSDTContract()
    let decimals = 18
    try {
      decimals = await usdtContract.decimals()
    } catch (err) {
      console.warn('Could not get decimals, using default 18')
    }
    
    // Convert amount to wei
    const amountInWei = ethers.parseUnits(amount, decimals)
    console.log('  - Amount in Wei:', amountInWei.toString())
    
    // Check if contract has enough balance
    const balanceInWei = ethers.parseUnits(contractBalance, decimals)
    if (balanceInWei < amountInWei) {
      throw new Error(`Insufficient contract balance. Available: ${contractBalance} USDT, Requested: ${amount} USDT`)
    }
    
    // Get user's USDT balance BEFORE withdrawal for verification
    console.log('\n💰 Checking balances before withdrawal...')
    const balanceBefore = await checkUSDTBalance(userAddress)
    console.log('  - Owner Wallet Balance Before:', balanceBefore, 'USDT')
    console.log('  - Contract Balance Before:', contractBalance, 'USDT')
    
    // Verify the signer address matches the owner
    const signerAddress = await signer.getAddress()
    if (signerAddress.toLowerCase() !== userAddress.toLowerCase()) {
      throw new Error(`Signer address mismatch: Expected ${userAddress}, got ${signerAddress}`)
    }
    console.log('  ✅ Signer address verified:', signerAddress)
    
    // Call withdrawFunds function - this should transfer USDT from contract to msg.sender (owner)
    console.log('\n📤 Calling withdrawFunds function...')
    console.log('  - Function: withdrawFunds(uint256 _amount)')
    console.log('  - Amount:', amountInWei.toString(), 'wei')
    console.log('  - This will transfer USDT from contract to owner wallet:', userAddress)
    
    const kycContract = await getKYCContract()
    
    // Verify contract is connected with the correct signer
    // The signer is already verified above, so we can trust it
    console.log('  ✅ Contract connected with owner signer')
    
    const tx = await kycContract.withdrawFunds(amountInWei)
    console.log('✅ Transaction sent!')
    console.log('  - Transaction Hash:', tx.hash)
    console.log('  - Waiting for confirmation...')
    
    const receipt = await tx.wait()
    
    console.log('\n✅ Transaction Confirmed!')
    console.log('📋 Transaction Receipt:')
    console.log('  - Transaction Hash:', receipt.hash)
    console.log('  - Block Number:', receipt.blockNumber)
    console.log('  - Gas Used:', receipt.gasUsed?.toString())
    console.log('  - Status:', receipt.status === 1 ? 'Success' : 'Failed')
    
    // Parse the transaction receipt logs to find FundsWithdrawn event
    console.log('\n🔍 Parsing transaction logs to verify withdrawal...')
    const kycContractInterface = kycContract.interface
    let withdrawalEventFound = false
    let recipientAddress: string | null = null
    let withdrawnAmount: bigint | null = null
    
    if (receipt.logs && receipt.logs.length > 0) {
      for (const log of receipt.logs) {
        try {
          // Try to parse as FundsWithdrawn event
          const parsedLog = kycContractInterface.parseLog({
            topics: log.topics as string[],
            data: log.data
          })
          
          if (parsedLog && parsedLog.name === 'FundsWithdrawn') {
            withdrawalEventFound = true
            // Extract event parameters
            const args = parsedLog.args as any
            recipientAddress = args.owner || args[0] || null
            withdrawnAmount = args.amount || args[1] || null
            
            console.log('  ✅ FundsWithdrawn event found!')
            console.log('  - Recipient Address:', recipientAddress)
            console.log('  - Amount (raw):', withdrawnAmount?.toString())
            
            if (recipientAddress) {
              const formattedAmount = ethers.formatUnits(withdrawnAmount || BigInt(0), decimals)
              console.log('  - Amount (formatted):', formattedAmount, 'USDT')
            }
            break
          }
        } catch (parseError) {
          // Not a FundsWithdrawn event, continue
          continue
        }
      }
    }
    
    if (!withdrawalEventFound) {
      console.warn('  ⚠️ FundsWithdrawn event not found in transaction logs')
      console.warn('  - This might indicate the withdrawal did not execute properly')
    }
    
    // Verify the recipient address matches the user's wallet
    if (recipientAddress && recipientAddress.toLowerCase() !== userAddress.toLowerCase()) {
      console.warn('  ⚠️ WARNING: Funds were sent to a different address!')
      console.warn('  - Expected:', userAddress)
      console.warn('  - Actual:', recipientAddress)
      throw new Error(`Withdrawal failed: Funds were sent to ${recipientAddress} instead of your wallet address ${userAddress}. Please check the contract implementation.`)
    }
    
    // Verify the user's USDT balance increased and contract balance decreased
    console.log('\n💰 Verifying transfer completed...')
    console.log('  - Owner Balance Before:', balanceBefore, 'USDT')
    console.log('  - Contract Balance Before:', contractBalance, 'USDT')
    
    // Wait a moment for the transaction to be fully processed
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    const balanceAfter = await checkUSDTBalance(userAddress)
    const contractBalanceAfter = await getContractBalance()
    
    console.log('  - Owner Balance After:', balanceAfter, 'USDT')
    console.log('  - Contract Balance After:', contractBalanceAfter, 'USDT')
    
    const balanceIncrease = parseFloat(balanceAfter) - parseFloat(balanceBefore)
    const contractBalanceDecrease = parseFloat(contractBalance) - parseFloat(contractBalanceAfter)
    
    console.log('  - Owner Balance Increase:', balanceIncrease, 'USDT')
    console.log('  - Contract Balance Decrease:', contractBalanceDecrease, 'USDT')
    
    // Verify owner received the funds
    if (balanceIncrease < parseFloat(amount) * 0.99) { // Allow 1% tolerance for rounding
      console.error('  ❌ ERROR: Owner wallet balance did not increase as expected!')
      console.error('  - Expected increase:', amount, 'USDT')
      console.error('  - Actual increase:', balanceIncrease, 'USDT')
      throw new Error(`Withdrawal verification failed: Expected ${amount} USDT increase in owner wallet, but balance only increased by ${balanceIncrease} USDT. Please check your wallet and the transaction on the block explorer: https://testnet.bscscan.com/tx/${receipt.hash}`)
    }
    
    // Verify contract balance decreased
    if (contractBalanceDecrease < parseFloat(amount) * 0.99) {
      console.warn('  ⚠️ WARNING: Contract balance did not decrease as expected!')
      console.warn('  - Expected decrease:', amount, 'USDT')
      console.warn('  - Actual decrease:', contractBalanceDecrease, 'USDT')
      // This is a warning, not an error, as the owner might have received funds
    }
    
    console.log('  ✅ Transfer verified: Funds successfully moved from contract to owner wallet!')
    
    console.log('\n✅ Funds Withdrawn Successfully!')
    console.log('  - Amount Withdrawn:', amount, 'USDT')
    console.log('  - Recipient:', userAddress)
    console.log('  - Transaction Hash:', receipt.hash)
    console.log('  - View on BSCScan:', `https://testnet.bscscan.com/tx/${receipt.hash}`)
    console.log('========================================\n')
    
    return receipt.hash
  } catch (error: any) {
    console.error('Error withdrawing funds:', error)
    
    if (error.reason) {
      throw new Error(`Withdrawal failed: ${error.reason}`)
    }
    
    if (error.message.includes('Only the contract owner')) {
      throw error
    }
    
    if (error.message.includes('Insufficient contract balance')) {
      throw error
    }
    
    if (error.message.includes('not found') || error.message.includes('BAD_DATA')) {
      throw new Error('Contract not found. Please ensure you are connected to the correct network (Binance Smart Chain Testnet).')
    }
    
    if (error.message.includes('user rejected') || error.code === 4001) {
      throw new Error('Transaction was rejected. Please try again.')
    }
    
    if (error.message.includes('execution reverted')) {
      const revertReason = error.data?.message || error.message
      throw new Error(`Transaction reverted: ${revertReason}. Only the contract owner can withdraw funds.`)
    }
    
    throw error
  }
}