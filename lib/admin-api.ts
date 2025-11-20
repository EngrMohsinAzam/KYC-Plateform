// Admin API utilities
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://xzfjrnv9-3099.asse.devtunnels.ms'

// Get admin token from localStorage
export const getAdminToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('adminToken')
}

// Set admin token in localStorage
export const setAdminToken = (token: string): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem('adminToken', token)
}

// Remove admin token
export const removeAdminToken = (): void => {
  if (typeof window === 'undefined') return
  localStorage.removeItem('adminToken')
}

// Admin Login
export interface AdminLoginRequest {
  username: string
  password: string
}

export interface AdminLoginResponse {
  success: boolean
  message: string
  data?: {
    token: string
    admin: {
      id: string
      username: string
      email: string
      role: string
      lastLogin: string
    }
  }
}

export const adminLogin = async (credentials: AdminLoginRequest): Promise<AdminLoginResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })

    const data = await response.json()

    if (data.success && data.data?.token) {
      setAdminToken(data.data.token)
    }

    return data
  } catch (error: any) {
    console.error('Admin login error:', error)
    return {
      success: false,
      message: error.message || 'Failed to connect to server',
    }
  }
}

// Dashboard Statistics
export interface DashboardStats {
  users: {
    total: number
    pending: number
    approved: number
    cancelled: number
    submitted: number
    underReview: number
  }
  financial: {
    totalCollected: number
    totalTransactions: number
    averageFee: string
  }
  recent: {
    last7Days: number
  }
}

export const getDashboardStats = async (): Promise<{ success: boolean; data?: DashboardStats; message?: string }> => {
  try {
    const token = getAdminToken()
    if (!token) {
      console.error('❌ No admin token found')
      return { success: false, message: 'Not authenticated' }
    }

    console.log('📡 Fetching dashboard stats from:', `${API_BASE_URL}/api/admin/dashboard/stats`)
    
    const response = await fetch(`${API_BASE_URL}/api/admin/dashboard/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    console.log('📡 Stats API Response Status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Stats API Error Response:', errorText)
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText || `HTTP ${response.status}: ${response.statusText}` }
      }
      return {
        success: false,
        message: errorData.message || `Failed to fetch dashboard statistics: ${response.status} ${response.statusText}`,
      }
    }

    const data = await response.json()
    console.log('✅ Stats API Response Data (raw):', JSON.stringify(data, null, 2))
    
    // Validate response structure
    if (!data.success) {
      console.error('❌ Stats API returned success: false', data)
      return {
        success: false,
        message: data.message || 'Failed to fetch dashboard statistics',
      }
    }

    // Ensure data structure is correct
    if (!data.data) {
      console.error('❌ Stats API response missing data field', data)
      return {
        success: false,
        message: 'Invalid response format: missing data field',
      }
    }

    // Validate users object exists
    if (!data.data.users) {
      console.error('❌ Stats API response missing users field', data)
      return {
        success: false,
        message: 'Invalid response format: missing users field',
      }
    }

    // Detailed logging of users object
    console.log('📊 Users object details:', {
      raw: data.data.users,
      total: data.data.users.total,
      totalType: typeof data.data.users.total,
      submitted: data.data.users.submitted,
      submittedType: typeof data.data.users.submitted,
      submittedExists: 'submitted' in data.data.users,
      pending: data.data.users.pending,
      approved: data.data.users.approved,
      cancelled: data.data.users.cancelled,
      allKeys: Object.keys(data.data.users)
    })

    // Ensure submitted is a number if it exists
    if (data.data.users && 'submitted' in data.data.users) {
      if (typeof data.data.users.submitted !== 'number') {
        console.warn('⚠️ Submitted is not a number, converting:', data.data.users.submitted)
        data.data.users.submitted = Number(data.data.users.submitted) || 0
      }
    } else {
      console.warn('⚠️ Submitted field not found in users object')
    }

    console.log('✅ Stats validated successfully:', {
      total: data.data.users.total,
      submitted: data.data.users.submitted,
      pending: data.data.users.pending,
      approved: data.data.users.approved,
      cancelled: data.data.users.cancelled
    })

    return data
  } catch (error: any) {
    console.error('❌ Get dashboard stats error:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return {
      success: false,
      message: error.message || 'Failed to fetch dashboard statistics',
    }
  }
}

// Get All Users
export interface User {
  userId: string
  email: string
  fullName: string
  phone?: string
  kycStatus: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'submitted' | 'under_review'
  submittedAt?: string
  cnicNumber?: string
  idType?: string
  countryName?: string
  cityName?: string
  blockchainAddressId?: string
  identityDocumentFront?: string
  identityDocumentBack?: string
  liveInImage?: string
  [key: string]: any
}

export interface GetUsersParams {
  status?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
}

export interface GetUsersResponse {
  success: boolean
  data?: {
    users: User[]
    pagination: {
      currentPage: number
      totalPages: number
      totalUsers: number
      limit: number
    }
    filters: {
      status?: string
      search?: string
      sortBy?: string
      sortOrder?: string
    }
  }
  message?: string
}

export const getUsers = async (params: GetUsersParams = {}): Promise<GetUsersResponse> => {
  try {
    const token = getAdminToken()
    if (!token) {
      return { success: false, message: 'Not authenticated' }
    }

    const queryParams = new URLSearchParams()
    if (params.status) queryParams.append('status', params.status)
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)
    if (params.search) queryParams.append('search', params.search)

    const response = await fetch(`${API_BASE_URL}/api/admin/users?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    const data = await response.json()
    return data
  } catch (error: any) {
    console.error('Get users error:', error)
    return {
      success: false,
      message: error.message || 'Failed to fetch users',
    }
  }
}

// Get Single User Details
export const getUserDetails = async (email: string): Promise<{ success: boolean; data?: User; message?: string }> => {
  try {
    const token = getAdminToken()
    if (!token) {
      return { success: false, message: 'Not authenticated' }
    }

    // Email should already be decoded, just encode it for the URL
    const encodedEmail = encodeURIComponent(email)
    
    const response = await fetch(`${API_BASE_URL}/api/admin/users/${encodedEmail}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Server error: ${response.status}` }))
      return {
        success: false,
        message: errorData.message || `Failed to fetch user details: ${response.status}`,
      }
    }

    const data = await response.json()
    
    // Log the response to debug status field
    console.log('📥 User details API response:', {
      success: data.success,
      hasData: !!data.data,
      kycStatus: data.data?.kycStatus,
      verificationStatus: data.data?.verificationStatus,
      fullData: data.data
    })
    
    // Map verificationStatus to kycStatus if needed (backend might use different field name)
    if (data.success && data.data) {
      if (data.data.verificationStatus && !data.data.kycStatus) {
        data.data.kycStatus = data.data.verificationStatus
        console.log('✅ Mapped verificationStatus to kycStatus:', data.data.kycStatus)
      }
    }
    
    return data
  } catch (error: any) {
    console.error('Get user details error:', error)
    return {
      success: false,
      message: error.message || 'Failed to fetch user details',
    }
  }
}

// Update KYC Status
export interface UpdateStatusRequest {
  email: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'under_review'
  reason?: string
}

export const updateUserStatus = async (
  email: string,
  status: UpdateStatusRequest['status'],
  reason?: string
): Promise<{ success: boolean; message?: string; data?: any }> => {
  try {
    const token = getAdminToken()
    if (!token) {
      return { success: false, message: 'Not authenticated' }
    }

    const requestBody: { email: string; status: string; reason?: string } = { email, status }
    // Always send reason if provided (for rejected, cancelled, or any status that needs a reason)
    if (reason) {
      requestBody.reason = reason
    }

    console.log('📤 Updating user status:', {
      email,
      status,
      reason: reason || 'No reason provided',
      requestBody
    })

    const response = await fetch(`${API_BASE_URL}/api/admin/users/status-by-email`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        message: `Server error: ${response.status}` 
      }))
      return {
        success: false,
        message: errorData.message || `Failed to update user status: ${response.status}`,
      }
    }

    const data = await response.json()
    
    console.log('✅ Status update API response:', {
      success: data.success,
      message: data.message,
      data: data.data
    })
    
    return data
  } catch (error: any) {
    console.error('Update user status error:', error)
    return {
      success: false,
      message: error.message || 'Failed to update user status',
    }
  }
}

