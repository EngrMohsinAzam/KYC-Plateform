// API base URL - update this to your backend URL
const API_BASE_URL = 'https://xzfjrnv9-3099.asse.devtunnels.ms'

// Convert base64 image to File object
const base64ToFile = (base64String: string, filename: string): File => {
  // Remove data URL prefix if present
  const base64Data = base64String.includes(',') 
    ? base64String.split(',')[1] 
    : base64String
  
  // Convert base64 to binary
  const byteCharacters = atob(base64Data)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  
  // Determine MIME type from base64 string
  let mimeType = 'image/jpeg'
  if (base64String.includes('data:image/png')) {
    mimeType = 'image/png'
  } else if (base64String.includes('data:image/jpeg') || base64String.includes('data:image/jpg')) {
    mimeType = 'image/jpeg'
  }
  
  // Create File object
  const blob = new Blob([byteArray], { type: mimeType })
  return new File([blob], filename, { type: mimeType })
}

// Submit KYC data to backend
export const submitKYCData = async (data: {
  userId: string
  blockchainAddressId: string
  fullName: string
  firstName?: string
  lastName?: string
  fatherName?: string
  email: string
  phone: string
  countryName: string
  cityName: string
  idType: string
  usaResidence: string
  identityDocumentFront: string // base64
  identityDocumentBack: string // base64
  liveInImage: string // base64
  cnic?: string // CNIC number
  transactionHash?: string
  blockNumber?: string
  fromAddress?: string
  toAddress?: string
  amount?: string
  timestamp?: string
  feeUnit?: number
}): Promise<{ success: boolean; message?: string; data?: any }> => {
  console.log('🔥 submitKYCData FUNCTION CALLED!')
  console.log('📥 Received data parameter:', {
    hasUserId: !!data.userId,
    hasEmail: !!data.email,
    hasFullName: !!data.fullName,
    hasPhone: !!data.phone,
    hasCountry: !!data.countryName,
    hasCity: !!data.cityName,
    hasFrontImage: !!data.identityDocumentFront,
    hasBackImage: !!data.identityDocumentBack,
    hasSelfie: !!data.liveInImage
  })
  
  try {
    console.log('📦 Creating FormData...')
    const formData = new FormData()
    
    // Add text fields
    formData.append('userId', data.userId)
    // Always send blockchainAddressId - backend requires it
    // Ensure it's not undefined or null
    const blockchainAddressId = data.blockchainAddressId || ''
    formData.append('blockchainAddressId', blockchainAddressId)
    console.log('  ✅ Added blockchainAddressId:', blockchainAddressId || '(empty string)')
    formData.append('fullName', data.fullName)
    // Add individual name fields if provided
    if (data.firstName) {
      formData.append('firstName', data.firstName)
      console.log('  ✅ Added firstName:', data.firstName)
    }
    if (data.lastName) {
      formData.append('lastName', data.lastName)
      console.log('  ✅ Added lastName:', data.lastName)
    }
    if (data.fatherName) {
      formData.append('fatherName', data.fatherName)
      console.log('  ✅ Added fatherName:', data.fatherName)
    }
    formData.append('email', data.email)
    formData.append('phone', data.phone)
    formData.append('countryName', data.countryName)
    formData.append('cityName', data.cityName)
    formData.append('idType', data.idType)
    formData.append('usaResidence', data.usaResidence)
    formData.append('feeUnit', String(data.feeUnit || 2))
    
    // Add CNIC if provided (backend expects 'cnicNumber')
    if (data.cnic) {
      formData.append('cnicNumber', data.cnic)
      console.log('  ✅ Added cnicNumber:', data.cnic)
    }
    
    // Add blockchain transaction details if available
    if (data.transactionHash) {
      formData.append('transactionHash', data.transactionHash)
    }
    if (data.blockNumber) {
      formData.append('blockNumber', data.blockNumber)
    }
    if (data.fromAddress) {
      formData.append('fromAddress', data.fromAddress)
    }
    if (data.toAddress) {
      formData.append('toAddress', data.toAddress)
    }
    if (data.amount) {
      formData.append('amount', data.amount)
    }
    if (data.timestamp) {
      formData.append('timestamp', data.timestamp)
    }
    
    // Convert base64 images to File objects and append
    console.log('🖼️ Converting images to File objects...')
    try {
      const frontFile = base64ToFile(data.identityDocumentFront, 'identity-document-front.jpg')
      console.log('  ✅ Front file created:', frontFile.name, frontFile.size, 'bytes')
      formData.append('identityDocumentFront', frontFile)
    } catch (err) {
      console.error('  ❌ Error creating front file:', err)
      throw err
    }
    
    try {
      const backFile = base64ToFile(data.identityDocumentBack, 'identity-document-back.jpg')
      console.log('  ✅ Back file created:', backFile.name, backFile.size, 'bytes')
      formData.append('identityDocumentBack', backFile)
    } catch (err) {
      console.error('  ❌ Error creating back file:', err)
      throw err
    }
    
    try {
      const selfieFile = base64ToFile(data.liveInImage, 'live-in-image.jpg')
      console.log('  ✅ Selfie file created:', selfieFile.name, selfieFile.size, 'bytes')
      formData.append('liveInImage', selfieFile)
    } catch (err) {
      console.error('  ❌ Error creating selfie file:', err)
      throw err
    }
    
    console.log('========================================')
    console.log('📤 SUBMITTING TO BACKEND API')
    console.log('========================================')
    console.log('🌐 API Configuration:')
    console.log('  - API Base URL:', API_BASE_URL)
    console.log('  - Full Endpoint:', `${API_BASE_URL}api/kyc/submit`)
    console.log('  - Request Method: POST')
    console.log('  - Content Type: multipart/form-data (FormData)')
    
    console.log('\n📋 User Information Being Sent:')
    console.log('  - userId:', data.userId)
    console.log('  - blockchainAddressId:', data.blockchainAddressId)
    console.log('  - fullName:', data.fullName)
    console.log('  - email:', data.email)
    console.log('  - phone:', data.phone)
    console.log('  - countryName:', data.countryName)
    console.log('  - cityName:', data.cityName)
    console.log('  - idType:', data.idType)
    console.log('  - usaResidence:', data.usaResidence)
    if (data.cnic) {
      console.log('  - cnic:', data.cnic)
    }
    
    console.log('\n💰 Payment Information:')
    console.log('  - feeUnit:', data.feeUnit || 2)
    if (data.transactionHash) {
      console.log('  - transactionHash:', data.transactionHash)
    }
    if (data.blockNumber) {
      console.log('  - blockNumber:', data.blockNumber)
    }
    if (data.fromAddress) {
      console.log('  - fromAddress:', data.fromAddress)
    }
    if (data.toAddress) {
      console.log('  - toAddress:', data.toAddress)
    }
    if (data.amount) {
      console.log('  - amount:', data.amount)
    }
    if (data.timestamp) {
      console.log('  - timestamp:', data.timestamp)
    }
    
    console.log('\n📷 Image Information:')
    console.log('  - Front Image Present:', !!data.identityDocumentFront)
    console.log('  - Front Image Length:', data.identityDocumentFront?.length || 0, 'characters (base64)')
    console.log('  - Back Image Present:', !!data.identityDocumentBack)
    console.log('  - Back Image Length:', data.identityDocumentBack?.length || 0, 'characters (base64)')
    console.log('  - Selfie Image Present:', !!data.liveInImage)
    console.log('  - Selfie Image Length:', data.liveInImage?.length || 0, 'characters (base64)')
    
    // Log all FormData entries for debugging
    console.log('\n📦 FormData Contents (all fields being sent):')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  ✅ ${key}: File (${value.name}, ${value.size} bytes, ${value.type})`)
      } else {
        console.log(`  ✅ ${key}: ${value}`)
      }
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    console.log('\n🚀 Making POST API Request...')
    const fullEndpoint = `${API_BASE_URL}/api/kyc/submit`
    console.log('  - Endpoint:', fullEndpoint)
    console.log('  - Method: POST')
    console.log('  - Content-Type: multipart/form-data (auto-set by browser)')
    
    const response = await fetch(fullEndpoint, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - browser will set it automatically with boundary for FormData
    })
    
    console.log('\n📡 API Request Sent!')
    console.log('  - Waiting for response...')
    
    console.log('\n📥 Response Received from Backend:')
    console.log('  - Status Code:', response.status)
    console.log('  - Status Text:', response.statusText)
    console.log('  - OK:', response.ok)
    
    if (!response.ok) {
      let errorText = ''
      try {
        errorText = await response.text()
        console.error('\n❌ Backend API Error Response:')
        console.error('  - Status:', response.status)
        console.error('  - Status Text:', response.statusText)
        console.error('  - Error Response Body:', errorText)
      } catch (parseError) {
        console.error('  - Could not parse error response')
      }
      console.log('========================================\n')
      return {
        success: false,
        message: `Backend API error: ${response.status} ${response.statusText}${errorText ? ' - ' + errorText : ''}`
      }
    }
    
    let result
    try {
      result = await response.json()
    } catch (jsonError) {
      console.error('❌ Error parsing JSON response:', jsonError)
      const textResponse = await response.text()
      console.error('  - Raw response:', textResponse)
      return {
        success: false,
        message: 'Invalid JSON response from backend API'
      }
    }
    
    console.log('\n✅ Backend API Success Response:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📋 Full Response Data:')
    console.log(JSON.stringify(result, null, 2))
    console.log('\n📊 Response Summary:')
    console.log('  - Success:', result.success)
    if (result.message) {
      console.log('  - Message:', result.message)
    }
    if (result.data) {
      console.log('  - Response Data Keys:', Object.keys(result.data))
      if (result.data.userId) console.log('    ✅ userId:', result.data.userId)
      if (result.data.email) console.log('    ✅ email:', result.data.email)
      if (result.data.kycStatus) console.log('    ✅ kycStatus:', result.data.kycStatus)
      if (result.data.submittedAt) console.log('    ✅ submittedAt:', result.data.submittedAt)
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('========================================\n')
    return result
  } catch (error: any) {
    console.error('Error submitting KYC data:', error)
    return { 
      success: false, 
      message: error.message || 'Failed to submit KYC data. Please try again.' 
    }
  }
}

// Get KYC status
export const getKYCStatus = async (userId?: string, email?: string): Promise<{ success: boolean; data?: any; message?: string }> => {
  console.log('🔍 getKYCStatus FUNCTION CALLED!')
  console.log('  - userId:', userId || 'not provided')
  console.log('  - email:', email || 'not provided')
  
  try {
    const params = new URLSearchParams()
    if (userId) params.append('userId', userId)
    if (email) params.append('email', email)
    
    const url = `${API_BASE_URL}/api/kyc/status?${params.toString()}`
    console.log('  - API URL:', url)
    console.log('  - Making GET request...')
    
    const response = await fetch(url)
    console.log('  - Response status:', response.status)
    
    const result = await response.json()
    console.log('  - Response data:', result)
    return result
  } catch (error: any) {
    console.error('❌ Error getting KYC status:', error)
    return { 
      success: false, 
      message: error.message || 'Failed to get KYC status. Please try again.' 
    }
  }
}

// Check KYC status by Email
export const checkStatusByEmail = async (email: string): Promise<{ success: boolean; data?: any; message?: string }> => {
  console.log('🔍 checkStatusByEmail FUNCTION CALLED!')
  console.log('  - Email:', email)
  
  try {
    // Use Next.js API route as proxy to avoid CORS issues
    const url = '/api/kyc/check-status-by-email'
    const requestBody = { email }
    
    console.log('  - API URL:', url)
    console.log('  - Request body:', requestBody)
    console.log('  - Making POST request...')
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })
    
    console.log('  - Response status:', response.status)
    console.log('  - Response statusText:', response.statusText)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    console.log('  - Response data:', result)
    return result
  } catch (error: any) {
    console.error('❌ Error checking status by email:', error)
    return { 
      success: false, 
      message: error.message || 'Failed to check status. Please try again.' 
    }
  }
}

// Check KYC status by CNIC (kept for backward compatibility)
export const checkStatusByCNIC = async (cnic: string): Promise<{ success: boolean; data?: any; message?: string }> => {
  console.log('🔍 checkStatusByCNIC FUNCTION CALLED!')
  console.log('  - CNIC:', cnic)
  
  try {
    const url = `${API_BASE_URL}/api/kyc/check-status-by-cnic`
    const requestBody = { cnic }
    
    console.log('  - API URL:', url)
    console.log('  - Request body:', requestBody)
    console.log('  - Making POST request...')
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })
    
    console.log('  - Response status:', response.status)
    console.log('  - Response statusText:', response.statusText)
    
    const result = await response.json()
    console.log('  - Response data:', result)
    return result
  } catch (error: any) {
    console.error('❌ Error checking status by CNIC:', error)
    return { 
      success: false, 
      message: error.message || 'Failed to check status. Please try again.' 
    }
  }
}

// Check KYC status by wallet address
export const checkStatusByWallet = async (walletAddress: string): Promise<{ success: boolean; data?: any; message?: string }> => {
  console.log('🔍 checkStatusByWallet FUNCTION CALLED!')
  console.log('  - Wallet Address:', walletAddress)
  
  try {
    const url = `${API_BASE_URL}/api/kyc/check-status-by-wallet`
    const requestBody = { walletAddress }
    
    console.log('  - API URL:', url)
    console.log('  - Request body:', requestBody)
    console.log('  - Making POST request...')
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })
    
    console.log('  - Response status:', response.status)
    console.log('  - Response statusText:', response.statusText)
    
    const result = await response.json()
    console.log('  - Response data:', result)
    return result
  } catch (error: any) {
    console.error('❌ Error checking status by wallet:', error)
    return { 
      success: false, 
      message: error.message || 'Failed to check status. Please try again.' 
    }
  }
}

// Update KYC documents (for blur rejection)
export const updateKYCDocuments = async (data: {
  email: string
  idType?: string
  identityDocumentFront?: string // base64
  identityDocumentBack?: string // base64
  liveInImage?: string // base64 - selfie
  newEmail?: string
}): Promise<{ success: boolean; message?: string; data?: any }> => {
  console.log('🔄 updateKYCDocuments FUNCTION CALLED!')
  console.log('📥 Received data:', {
    email: data.email,
    hasFrontImage: !!data.identityDocumentFront,
    hasBackImage: !!data.identityDocumentBack,
    hasSelfie: !!data.liveInImage,
    idType: data.idType,
    newEmail: data.newEmail
  })
  
  try {
    const formData = new FormData()
    
    // Required field
    formData.append('email', data.email)
    
    // Optional fields
    if (data.idType) {
      formData.append('idType', data.idType)
    }
    if (data.newEmail) {
      formData.append('newEmail', data.newEmail)
    }
    
    // Convert base64 images to File objects if provided
    if (data.identityDocumentFront) {
      const frontFile = base64ToFile(data.identityDocumentFront, 'identity-document-front.jpg')
      formData.append('identityDocumentFront', frontFile)
      console.log('  ✅ Added front document')
    }
    
    if (data.identityDocumentBack) {
      const backFile = base64ToFile(data.identityDocumentBack, 'identity-document-back.jpg')
      formData.append('identityDocumentBack', backFile)
      console.log('  ✅ Added back document')
    }
    
    if (data.liveInImage) {
      const selfieFile = base64ToFile(data.liveInImage, 'live-in-image.jpg')
      formData.append('liveInImage', selfieFile)
      console.log('  ✅ Added selfie image')
    }
    
    const url = `${API_BASE_URL}/api/kyc/update-documents`
    console.log('  - API URL:', url)
    console.log('  - Method: PUT')
    
    const response = await fetch(url, {
      method: 'PUT',
      body: formData,
    })
    
    console.log('  - Response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API Error:', errorText)
      return {
        success: false,
        message: `API error: ${response.status} ${response.statusText}${errorText ? ' - ' + errorText : ''}`
      }
    }
    
    const result = await response.json()
    console.log('✅ Update successful:', result)
    return result
  } catch (error: any) {
    console.error('❌ Error updating documents:', error)
    return {
      success: false,
      message: error.message || 'Failed to update documents. Please try again.'
    }
  }
}

