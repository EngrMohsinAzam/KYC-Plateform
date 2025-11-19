'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getAdminToken, getUserDetails, updateUserStatus, User } from '@/lib/admin-api'
import { XCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  WalletIcon,
  IdentificationIcon,
  UserIcon,
  GlobeAltIcon,
  CalendarIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  GlobeEuropeAfricaIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  CameraIcon,
  CurrencyDollarIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/outline'

export default function UserDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.userId as string

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    const token = getAdminToken()
    if (!token) {
      router.push('/admin')
      return
    }

    if (userId) {
      loadUserDetails()
    }
  }, [userId, router])

  const loadUserDetails = async () => {
    if (!userId) {
      setError('User ID is missing')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')

      // Decode the userId (email) - Next.js params might be encoded
      const decodedEmail = decodeURIComponent(userId)

      const result = await getUserDetails(decodedEmail)

      if (result.success && result.data) {
        setUser(result.data)
      } else {
        setError(result.message || 'Failed to load user details')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading user details')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (status: 'approved' | 'rejected' | 'cancelled' | 'pending' | 'under_review', reason?: string) => {
    if (!user) return

    try {
      setUpdating(true)
      // Use email for the status-by-email endpoint
      const userEmail = user.email
      if (!userEmail) {
        alert('User email is required to update status')
        return
      }

      const result = await updateUserStatus(userEmail, status, reason)

      if (result.success) {
        // Reload user details to get updated status
        await loadUserDetails()
        const statusMessage = result.message || `User status updated to ${status}`
        alert(statusMessage)
        setShowRejectModal(false)
        setRejectionReason('')
      } else {
        alert(result.message || 'Failed to update status')
      }
    } catch (err: any) {
      console.error('Status update error:', err)
      alert(err.message || 'An error occurred while updating status')
    } finally {
      setUpdating(false)
    }
  }

  const handleRejectClick = () => {
    setShowRejectModal(true)
  }

  const handleRejectConfirm = () => {
    if (!rejectionReason) {
      alert('Please select a rejection reason')
      return
    }
    handleStatusUpdate('rejected', rejectionReason)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user details...</p>
        </div>
      </div>
    )
  }

  if (error || (!loading && !user)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <svg className="w-16 h-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading User Details</h2>
          <p className="text-red-600 mb-4">{error || 'User not found'}</p>
          {userId && (
            <p className="text-sm text-gray-500 mb-4">User ID: {userId}</p>
          )}
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </button>
            <button
              onClick={loadUserDetails}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Generate Anonymous ID from userId or email
  const getAnonymousId = () => {
    const id = user?.userId || user?.email || ''
    // Create a formatted ID like: AE9-2B23-001234
    if (id.length >= 12) {
      const part1 = id.substring(0, 3).toUpperCase()
      const part2 = id.substring(3, 7).toUpperCase()
      const part3 = id.substring(7, 13).toUpperCase().padEnd(6, '0')
      return `${part1}-${part2}-${part3}`
    }
    // Fallback format
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return `AE9-${String(hash).substring(0, 4)}-${String(hash).substring(4, 10).padEnd(6, '0')}`
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Top Row - Back button and title */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="text-grey-400 hover:text-grey-700 text-xs sm:text-sm font-medium flex-shrink-0"
              >
                <span className="hidden sm:inline">← Back to Dashboard | </span>
                <span className="sm:hidden">← Back</span>
              </button>
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 truncate">User Details</h1>
                {user.kycStatus && (
                  <span
                    className={`px-2 sm:px-3 py-0.5 rounded-full text-[10px] sm:text-xs font-medium flex-shrink-0 ${
                      user.kycStatus === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : user.kycStatus === 'rejected' || user.kycStatus === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {user.kycStatus.charAt(0).toUpperCase() + user.kycStatus.slice(1).replace('_', ' ')}
                </span>
                )}
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex gap-2 justify-end">
              {/* Reject Button (Outlined) - Always show */}
              <button
                onClick={handleRejectClick}
                disabled={updating || user.kycStatus === 'rejected'}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 border border-red-600 text-red-600 bg-white rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 text-xs sm:text-sm md:text-base"
              >
                <XCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Reject</span>
              </button>

              {/* Approve Button (Filled) - Only show if not already approved */}
              {user.kycStatus !== 'approved' && (
              <button
                onClick={() => handleStatusUpdate('approved')}
                disabled={updating}
                  className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-xs sm:text-sm md:text-base"
              >
                  <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Approve</span>
              </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {/* Left Column - User Information */}
          <div className="lg:col-span-1 space-y-3 sm:space-y-4 md:space-y-6">
  {/* User Profile Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-300 p-3 sm:p-4 md:p-6 min-h-[350px] sm:min-h-[400px] md:h-[456px]">
              <div className="flex flex-col items-center text-center mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-base sm:text-lg md:text-xl font-bold">
        {getInitials(user.fullName || user.email)}
      </div>
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mt-2 sm:mt-4">{user.fullName || 'N/A'}</h2>
                <span className="mt-1.5 sm:mt-2 px-2 sm:px-3 py-0.5 sm:py-1 bg-yellow-100 text-yellow-800 rounded-full text-[10px] sm:text-xs font-medium">
          Verified
        </span>
    </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <EnvelopeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#00D3F2] mt-0.5 sm:mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">Email</p>
                    <p className="text-xs sm:text-sm md:text-base text-gray-900 break-words">{user.email}</p>
        </div>
      </div>
      {user.phone && (
                  <div className="flex items-start gap-2 sm:gap-3">
                    <PhoneIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#00D3F2] mt-0.5 sm:mt-1 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">Phone</p>
                      <p className="text-xs sm:text-sm md:text-base text-gray-900 break-words">{user.phone}</p>
          </div>
        </div>
      )}
      {user.countryName && (
                  <div className="flex items-start gap-2 sm:gap-3">
                    <MapPinIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#00D3F2] mt-0.5 sm:mt-1 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">Address</p>
                      <p className="text-xs sm:text-sm md:text-base text-gray-900 break-words">
              {user.cityName ? `${user.cityName}, ` : ''}{user.countryName}
            </p>
          </div>
        </div>
      )}
      {user.blockchainAddressId && (
                  <div className="flex items-start gap-2 sm:gap-3">
                    <WalletIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#00D3F2] mt-0.5 sm:mt-1 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">Wallet Address</p>
                      <p className="text-[10px] sm:text-xs md:text-sm text-gray-900 font-mono break-all">{user.blockchainAddressId}</p>
          </div>
        </div>
      )}
    </div>
  </div>


  {/* Consolidated KYC Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-300 p-3 sm:p-4 md:p-6 min-h-[450px] sm:min-h-[500px] md:h-[550px]">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Consolidated KYC Information</h3>
    <div className="space-y-4">
      <div className="flex items-start gap-3">
                  {/* <UserIcon className="w-5 h-5 text-gray-500 mt-1" /> */}
        <div>
          <p className="text-sm text-gray-600">Full Name</p>
          <p className="text-base text-gray-900 font-medium">{user.fullName || 'N/A'}</p>
        </div>
      </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  {/* <IdentificationIcon className="w-5 h-5 text-gray-500 mt-1" /> */}
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">User ID</p>
                    <p className="text-xs sm:text-sm md:text-base text-gray-900 font-medium break-words">{user.userId}</p>
        </div>
      </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  {/* <GlobeAltIcon className="w-5 h-5 text-gray-500 mt-1" /> */}
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">Nationality</p>
                    <p className="text-xs sm:text-sm md:text-base text-gray-900 font-medium break-words">{user.countryName || 'N/A'}</p>
        </div>
      </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  {/* <GlobeEuropeAfricaIcon className="w-5 h-5 text-gray-500 mt-1" /> */}
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">Country of Residence</p>
                    <p className="text-xs sm:text-sm md:text-base text-gray-900 font-medium break-words">{user.countryName || 'N/A'}</p>
        </div>
      </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  {/* <IdentificationIcon className="w-5 h-5 text-gray-500 mt-1" /> */}
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">Document Type</p>
                    <p className="text-xs sm:text-sm md:text-base text-gray-900 font-medium break-words">{user.idType || 'N/A'}</p>
        </div>
      </div>
      {user.cnicNumber && (
                  <div className="flex items-start gap-2 sm:gap-3">
                    {/* <IdentificationIcon className="w-5 h-5 text-gray-500 mt-1" /> */}
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">Document Number</p>
                      <p className="text-xs sm:text-sm md:text-base text-gray-900 font-medium break-words">{user.cnicNumber}</p>
          </div>
        </div>
      )}
                <div className="flex items-start gap-2 sm:gap-3">
                  {/* <GlobeAltIcon className="w-5 h-5 text-gray-500 mt-1" /> */}
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">Issuing Country</p>
                    <p className="text-xs sm:text-sm md:text-base text-gray-900 font-medium break-words">{user.countryName || 'N/A'}</p>
        </div>
      </div>
      {user.submittedAt && (
                  <div className="flex items-start gap-2 sm:gap-3">
                    {/* <CalendarIcon className="w-5 h-5 text-gray-500 mt-1" /> */}
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">Expiry Date</p>
                      <p className="text-xs sm:text-sm md:text-base text-gray-900 font-medium break-words">
              {new Date(user.submittedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}
    </div>
  </div>

  {/* Submission Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-300 p-3 sm:p-4 md:p-6 min-h-[340px] sm:min-h-[380px] md:h-[420px]">
              <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Submission Details</h3>
              <div className="space-y-3 sm:space-y-4">
      {user.submittedAt && (
        <>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#00D3F2] mt-0.5 sm:mt-1 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">Submission Date</p>
                        <p className="text-xs sm:text-sm md:text-base text-gray-900 font-medium break-words">
                {new Date(user.submittedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#00D3F2] mt-0.5 sm:mt-1 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">Submission Time</p>
                        <p className="text-xs sm:text-sm md:text-base text-gray-900 font-medium break-words">
                {new Date(user.submittedAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </>
      )}
                <div className="flex items-start gap-2 sm:gap-3">
                  <MapPinIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#00D3F2] mt-0.5 sm:mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">Location</p>
                    <p className="text-xs sm:text-sm md:text-base text-gray-900 font-medium break-words">
            {user.cityName ? `${user.cityName}, ` : ''}{user.countryName || 'N/A'}
          </p>
        </div>
      </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <ComputerDesktopIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#00D3F2] mt-0.5 sm:mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">Browser</p>
                    <p className="text-xs sm:text-sm md:text-base text-gray-900 font-medium break-words">Chrome</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <DevicePhoneMobileIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#00D3F2] mt-0.5 sm:mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">Device Type</p>
                    <p className="text-xs sm:text-sm md:text-base text-gray-900 font-medium break-words">Mobile</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <GlobeAltIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#00D3F2] mt-0.5 sm:mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">IP Address</p>
                    <p className="text-xs sm:text-sm md:text-base text-gray-900 font-medium break-words">N/A</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Blockchain Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-300 p-3 sm:p-4 md:p-6 min-h-[280px] sm:min-h-[320px] md:h-[350px]">
              <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Blockchain Information</h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <IdentificationIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#00D3F2] mt-0.5 sm:mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">Anonymous ID</p>
                    <a
                      href={`#${user.userId}`}
                      className="text-xs sm:text-sm md:text-base text-blue-600 hover:text-blue-800 font-medium underline break-all"
                    >
                      {getAnonymousId()}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <DocumentCheckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#00D3F2] mt-0.5 sm:mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">KYC Hash Verified</p>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <p className="text-xs sm:text-sm md:text-base text-gray-900 font-medium">
                        {user.submittedAt ? 'Yes' : 'No'}
                      </p>
                      {user.submittedAt && (
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
        </div>
      </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <GlobeAltIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#00D3F2] mt-0.5 sm:mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">Decentralized ID</p>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <p className="text-xs sm:text-sm md:text-base text-gray-900 font-medium">
                        {user.blockchainAddressId ? 'Enabled' : 'Disabled'}
                      </p>
                      {user.blockchainAddressId && (
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
        </div>
      </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <WalletIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#00D3F2] mt-0.5 sm:mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">Wallet Connected</p>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <p className="text-xs sm:text-sm md:text-base text-gray-900 font-medium">
                        {user.blockchainAddressId ? 'Yes' : 'No'}
                      </p>
                      {user.blockchainAddressId && (
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
        </div>
      </div>
    </div>
  </div>

  {/* Activity Stream */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6 min-h-[280px] sm:min-h-[320px] md:h-[350px]">
              <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Activity Stream</h3>
              <div className="space-y-3 sm:space-y-4">
      {user.submittedAt && (
                  <div className="flex items-start gap-2 sm:gap-3">
                    <ArrowTrendingUpIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#00D3F2] mt-0.5 sm:mt-1 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">KYC Started</p>
                      <p className="text-xs sm:text-sm md:text-base text-gray-900 font-medium break-words">{new Date(user.submittedAt).toLocaleDateString()}</p>
          </div>
        </div>
      )}
                <div className="flex items-start gap-2 sm:gap-3">
                  <DocumentCheckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#00D3F2] mt-0.5 sm:mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">ID Uploaded</p>
                    <p className="text-xs sm:text-sm md:text-base text-gray-900 font-medium break-words">{user.submittedAt ? new Date(user.submittedAt).toLocaleDateString() : 'N/A'}</p>
        </div>
      </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <CameraIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#00D3F2] mt-0.5 sm:mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">Selfie Uploaded</p>
                    <p className="text-xs sm:text-sm md:text-base text-gray-900 font-medium break-words">{user.submittedAt ? new Date(user.submittedAt).toLocaleDateString() : 'N/A'}</p>
        </div>
      </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <CurrencyDollarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#00D3F2] mt-0.5 sm:mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">Funding Source</p>
                    <p className="text-xs sm:text-sm md:text-base text-gray-900 font-medium break-words">{user.submittedAt ? new Date(user.submittedAt).toLocaleDateString() : 'N/A'}</p>
        </div>
      </div>
    </div>
  </div>
</div>


          {/* Right Column - Documents */}
          <div className="space-y-3 sm:space-y-4 md:space-y-6 lg:col-span-2">
            {/* Document Front */}
            {user.identityDocumentFront && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-3 md:p-4">
                <div className="w-full overflow-hidden rounded-lg mb-2">
                <img
                  src={user.identityDocumentFront}
                  alt="Document Front"
                    className="w-full h-auto max-h-[300px] sm:max-h-[400px] md:max-h-[566px] object-contain rounded-lg"
                />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-900">Document Front</span>
                  <span className="text-green-600 text-xs sm:text-sm">✓</span>
                </div>
              </div>
            )}

            {/* Document Back */}
            {user.identityDocumentBack && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-3 md:p-4">
                <div className="w-full overflow-hidden rounded-lg mb-2">
                <img
                  src={user.identityDocumentBack}
                  alt="Document Back"
                    className="w-full h-auto max-h-[300px] sm:max-h-[400px] md:max-h-[566px] object-contain rounded-lg"
                />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-900">Document Back</span>
                  <span className="text-green-600 text-xs sm:text-sm">✓</span>
                </div>
              </div>
            )}

            {/* Selfie Verification */}
            {user.liveInImage && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-3 md:p-4">
                <div className="w-full overflow-hidden rounded-lg mb-2">
                <img
                  src={user.liveInImage}
                  alt="Selfie Verification"
                    className="w-full h-auto max-h-[350px] sm:max-h-[450px] md:max-h-[702px] object-contain rounded-lg"
                />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-900">Selfie Verification</span>
                  <span className="text-green-600 text-xs sm:text-sm">✓</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Rejection Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Reject KYC Application</h2>
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectionReason('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">Please select a reason for rejection:</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason
                </label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                >
                  <option value="">Select a reason</option>
                  <option value="Selfie is not properly taken">Selfie is not properly taken</option>
                  <option value="Document is wrong">Document is wrong</option>
                  <option value="Data is wrong">Data is wrong</option>
                  <option value="Picture is blur">Picture is blur</option>
                  <option value="Unauthorized">Unauthorized</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowRejectModal(false)
                    setRejectionReason('')
                  }}
                  className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectConfirm}
                  disabled={!rejectionReason || updating}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? 'Processing...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

