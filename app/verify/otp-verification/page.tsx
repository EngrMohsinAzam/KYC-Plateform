// 'use client'

// import { useState, useEffect, useRef } from 'react'
// import { useRouter } from 'next/navigation'
// import { Button } from '@/components/ui/Button'
// import { Header } from '@/components/layout/Header'
// import { ProgressBar } from '@/components/ui/ProgressBar'
// import { useAppContext } from '@/context/useAppContext'

// // API base URL - update this to your backend URL
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://xzfjrnv9-3099.asse.devtunnels.ms'

// // Send OTP to email
// const sendOTP = async (email: string): Promise<{ success: boolean; message?: string }> => {
//   try {
//     console.log('📧 Sending OTP to:', email)
//     const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ email })
//     })
    
//     console.log('📧 OTP Response Status:', response.status)
    
//     if (response.status === 429) {
//       const errorData = await response.json().catch(() => ({ message: 'Too many requests. Please wait before requesting again.' }))
//       console.error('❌ Rate limit exceeded:', errorData)
//       return { success: false, message: errorData.message || 'Too many requests. Please wait a moment and try again.' }
//     }
    
//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({ message: `Server error: ${response.status}` }))
//       console.error('❌ OTP Send Error:', errorData)
//       return { success: false, message: errorData.message || 'Failed to send OTP. Please try again.' }
//     }
    
//     const data = await response.json()
//     console.log('✅ OTP Sent Successfully:', data)
//     return data
//   } catch (error: any) {
//     console.error('❌ Error sending OTP:', error)
//     return { success: false, message: error.message || 'Failed to send OTP. Please try again.' }
//   }
// }

// // Verify OTP
// const verifyOTP = async (email: string, otp: string): Promise<{ success: boolean; message?: string }> => {
//   try {
//     console.log('🔐 Verifying OTP for:', email)
//     const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ email, otp })
//     })
    
//     console.log('🔐 OTP Verify Response Status:', response.status)
    
//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({ message: `Server error: ${response.status}` }))
//       console.error('❌ OTP Verify Error:', errorData)
//       return { success: false, message: errorData.message || 'Invalid OTP code. Please try again.' }
//     }
    
//     const data = await response.json()
//     console.log('✅ OTP Verified Successfully:', data)
//     return data
//   } catch (error: any) {
//     console.error('❌ Error verifying OTP:', error)
//     return { success: false, message: error.message || 'Failed to verify OTP. Please try again.' }
//   }
// }

// export default function OTPVerification() {
//   const router = useRouter()
//   const { state } = useAppContext()
//   const [otp, setOtp] = useState(['', '', '', '', '', ''])
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)
//   const [sendingOTP, setSendingOTP] = useState(false)
//   const [otpSent, setOtpSent] = useState(false)
//   const [resendTimer, setResendTimer] = useState(0)
//   const inputRefs = useRef<(HTMLInputElement | null)[]>([])

//   const email = state.personalInfo?.email || ''
//   const hasAutoSentRef = useRef(false)

//   useEffect(() => {
//     // Auto-send OTP when component mounts (only once)
//     if (email && !otpSent && !hasAutoSentRef.current) {
//       hasAutoSentRef.current = true
//       handleSendOTP()
//     }
//   }, [email])

//   useEffect(() => {
//     // Resend timer countdown
//     if (resendTimer > 0) {
//       const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
//       return () => clearTimeout(timer)
//     }
//   }, [resendTimer])

//   const handleSendOTP = async () => {
//     if (!email) {
//       setError('Email address is required')
//       return
//     }

//     setSendingOTP(true)
//     setError(null)

//     try {
//       const result = await sendOTP(email)
//       if (result.success) {
//         setOtpSent(true)
//         setResendTimer(60) // 60 seconds cooldown
//       } else {
//         setError(result.message || 'Failed to send OTP')
//       }
//     } catch (err: any) {
//       setError(err.message || 'Failed to send OTP. Please try again.')
//     } finally {
//       setSendingOTP(false)
//     }
//   }

//   const handleOtpChange = (index: number, value: string) => {
//     // Only allow digits
//     if (value && !/^\d$/.test(value)) return

//     const newOtp = [...otp]
//     newOtp[index] = value
//     setOtp(newOtp)
//     setError(null)

//     // Auto-focus next input
//     if (value && index < 5) {
//       inputRefs.current[index + 1]?.focus()
//     }
//   }

//   const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
//     // Handle backspace
//     if (e.key === 'Backspace' && !otp[index] && index > 0) {
//       inputRefs.current[index - 1]?.focus()
//     }
//   }

//   const handlePaste = (e: React.ClipboardEvent) => {
//     e.preventDefault()
//     const pastedData = e.clipboardData.getData('text').trim()
//     if (/^\d{6}$/.test(pastedData)) {
//       const newOtp = pastedData.split('')
//       setOtp(newOtp)
//       inputRefs.current[5]?.focus()
//     }
//   }

//   const handleVerify = async () => {
//     const otpString = otp.join('')
    
//     if (otpString.length !== 6) {
//       setError('Please enter the complete 6-digit OTP code')
//       return
//     }

//     setLoading(true)
//     setError(null)

//     try {
//       const result = await verifyOTP(email, otpString)
//       if (result.success) {
//         // OTP verified, proceed to review page (where submission happens)
//         console.log('✅ OTP verified, navigating to review page')
//         router.push('/verify/review')
//       } else {
//         setError(result.message || 'Invalid OTP code. Please try again.')
//         // Clear OTP on error
//         setOtp(['', '', '', '', '', ''])
//         inputRefs.current[0]?.focus()
//       }
//     } catch (err: any) {
//       setError(err.message || 'Failed to verify OTP. Please try again.')
//       setOtp(['', '', '', '', '', ''])
//       inputRefs.current[0]?.focus()
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <div className="min-h-screen bg-white md:bg-surface-gray flex flex-col">
//       <Header showBack title="Verify your email" />
//       <ProgressBar currentStep={4} totalSteps={6} />
//       <main className="flex-1 px-4 md:px-0 pt-6 pb-24 md:flex md:items-center md:justify-center">
//         <div className="w-full max-w-md md:bg-white md:rounded-2xl p-4 md:p-6 md:my-8 border-[2px] border-grey-400">
//           <div className="mb-2">
//             <p className="text-sm text-text-light">Check your email</p>
//           </div>

//           <div className="mb-8">
//             <h2 className="text-2xl font-bold text-text-primary mb-4">
//               Enter verification code
//             </h2>
//             <p className="text-sm text-text-secondary mb-6">
//               We've sent a 6-digit verification code to <span className="font-semibold text-text-primary">{email}</span>
//             </p>

//             <div className="mb-6">
//               <div className="flex gap-3 justify-center">
//                 {otp.map((digit, index) => (
//                   <input
//                     key={index}
//                     ref={(el) => { inputRefs.current[index] = el }}
//                     type="text"
//                     inputMode="numeric"
//                     maxLength={1}
//                     value={digit}
//                     onChange={(e) => handleOtpChange(index, e.target.value)}
//                     onKeyDown={(e) => handleKeyDown(index, e)}
//                     onPaste={handlePaste}
//                     className="w-12 h-14 text-center text-2xl font-bold border-2 border-surface-light rounded-lg focus:border-primary focus:outline-none transition-colors"
//                   />
//                 ))}
//               </div>
//               {error && (
//                 <p className="text-sm text-red-600 mt-3 text-center">{error}</p>
//               )}
//             </div>

//             <div className="text-center">
//               <p className="text-sm text-text-secondary mb-2">
//                 Didn't receive the code?
//               </p>
//               <button
//                 onClick={handleSendOTP}
//                 disabled={sendingOTP || resendTimer > 0}
//                 className="text-sm text-primary hover:underline disabled:text-text-light disabled:no-underline"
//               >
//                 {sendingOTP
//                   ? 'Sending...'
//                   : resendTimer > 0
//                   ? `Resend code in ${resendTimer}s`
//                   : 'Resend code'}
//               </button>
//             </div>
//           </div>

//           <div className="md:block fixed md:relative bottom-0 left-0 right-0 p-4 bg-white md:bg-transparent border-t md:border-t-0 border-surface-light">
//             <Button
//               onClick={handleVerify}
//               disabled={loading || otp.join('').length !== 6}
//               className="w-full"
//             >
//               {loading ? 'Verifying...' : 'Continue'}
//             </Button>
//             <p className="text-xs text-text-light text-center mt-2">Powered by Mira</p>
//           </div>
//         </div>
//       </main>
//     </div>
//   )
// }

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Header } from '@/components/layout/Header'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useAppContext } from '@/context/useAppContext'
import { getCountryByValue, getCitiesForCountry } from '@/lib/countries'
import { LoadingDots } from '@/components/ui/LoadingDots'

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://xzfjrnv9-3099.asse.devtunnels.ms'

// Note: Image conversion and submission is now handled in the review page

// Send OTP
const sendOTP = async (email: string): Promise<{ success: boolean; message?: string }> => {
  try {
    console.log('📧 Sending OTP to:', email)
    const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
    
    if (response.status === 429) {
      const errorData = await response.json().catch(() => ({ message: 'Too many requests.' }))
      return { success: false, message: errorData.message || 'Too many requests. Please wait.' }
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to send OTP' }))
      return { success: false, message: errorData.message || 'Failed to send OTP' }
    }
    
    const data = await response.json()
    console.log('✅ OTP Sent Successfully')
    return data
  } catch (error: any) {
    console.error('❌ Error sending OTP:', error)
    return { success: false, message: 'Failed to send OTP. Please try again.' }
  }
}

// Verify OTP
const verifyOTP = async (email: string, otp: string): Promise<{ success: boolean; message?: string }> => {
  try {
    console.log('🔐 Verifying OTP for:', email)
    const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Invalid OTP' }))
      return { success: false, message: errorData.message || 'Invalid OTP code' }
    }
    
    const data = await response.json()
    console.log('✅ OTP Verified Successfully')
    return data
  } catch (error: any) {
    console.error('❌ Error verifying OTP:', error)
    return { success: false, message: 'Failed to verify OTP. Please try again.' }
  }
}

// Note: KYC data submission is now handled in the review page
// after wallet connection and smart contract transaction

export default function OTPVerification() {
  const router = useRouter()
  const { state } = useAppContext()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sendingOTP, setSendingOTP] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const email = state.personalInfo?.email || ''
  const hasAutoSentRef = useRef(false)

  useEffect(() => {
    if (email && !otpSent && !hasAutoSentRef.current) {
      hasAutoSentRef.current = true
      handleSendOTP()
    }
  }, [email])

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

  const handleSendOTP = async () => {
    if (!email) {
      setError('Email address is required')
      return
    }

    setSendingOTP(true)
    setError(null)

    try {
      const result = await sendOTP(email)
      if (result.success) {
        setOtpSent(true)
        setResendTimer(60)
      } else {
        setError(result.message || 'Failed to send OTP')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP')
    } finally {
      setSendingOTP(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setError(null)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').trim()
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split('')
      setOtp(newOtp)
      inputRefs.current[5]?.focus()
    }
  }

  const handleVerify = async () => {
    const otpString = otp.join('')
    
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit OTP code')
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('========================================')
      console.log('🔐 STEP 1: VERIFYING OTP')
      console.log('========================================')
      
      // Step 1: Verify OTP
      const otpResult = await verifyOTP(email, otpString)
      
      if (!otpResult.success) {
        setError(otpResult.message || 'Invalid OTP code')
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
        setLoading(false)
        return
      }

      console.log('✅ OTP verified successfully!\n')

      // Mark that user just completed OTP - they need to connect wallet now
      sessionStorage.setItem('justCompletedOTP', 'true')
      
      // After OTP verification, navigate to review page
      // The review page will handle wallet connection, transaction, and backend submission
      console.log('📍 Navigating to review page for wallet connection and submission...')
      router.push('/verify/review')
      
    } catch (err: any) {
      console.error('❌ Error:', err)
      setError(err.message || 'An error occurred. Please try again.')
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white md:bg-surface-gray flex flex-col">
      <Header showBack title="Verify your email" />
      <ProgressBar currentStep={4} totalSteps={6} />
      <main className="flex-1 px-4 md:px-0 pt-6 pb-32 md:pb-24 md:flex md:items-center md:justify-center">
        <div className="w-full max-w-md md:bg-white md:rounded-2xl p-4 md:p-6 md:my-8 md:border-[2px] md:border-grey-400">
          <div className="mb-2">
            <p className="text-sm text-text-light">Check your email</p>
          </div>

          <div className="mb-6 md:mb-8">
            <h2 className="text-2xl font-bold text-text-primary mb-4">
              Enter verification code
            </h2>
            <p className="text-sm text-text-secondary mb-6">
              We&apos;ve sent a 6-digit verification code to <span className="font-semibold text-text-primary">{email}</span>
            </p>

            <div className="mb-6">
              <div className="flex gap-2 md:gap-3 justify-center">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    disabled={loading}
                    className="w-11 h-12 md:w-12 md:h-14 text-center text-xl md:text-2xl font-bold border-2 border-surface-light rounded-lg focus:border-primary focus:outline-none transition-colors disabled:bg-gray-100"
                  />
                ))}
              </div>
              {error && (
                <p className="text-sm text-red-600 mt-3 text-center">{error}</p>
              )}
            </div>

            <div className="text-center mb-6 md:mb-0">
              <p className="text-sm text-text-secondary mb-2">
                Didn&apos;t receive the code?
              </p>
              <button
                onClick={handleSendOTP}
                disabled={sendingOTP || resendTimer > 0 || loading}
                className="text-sm text-primary hover:underline disabled:text-text-light disabled:no-underline flex items-center gap-2 justify-center"
              >
                {sendingOTP ? (
                  <>
                    <LoadingDots size="sm" color="currentColor" />
                    <span>Sending...</span>
                  </>
                ) : resendTimer > 0 ? (
                  `Resend code in ${resendTimer}s`
                ) : (
                  'Resend code'
                )}
              </button>
            </div>
          </div>

          <div className="md:block fixed md:relative bottom-0 left-0 right-0 p-4 bg-white md:bg-transparent border-t md:border-t-0 border-surface-light">
            <Button
              onClick={handleVerify}
              disabled={loading || otp.join('').length !== 6}
              className="w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <LoadingDots size="sm" color="#ffffff" />
                  <span>Submitting to backend...</span>
                </>
              ) : (
                'Verify & Continue'
              )}
            </Button>
            <p className="text-xs text-text-light text-center mt-2">Powered by Mira</p>
          </div>
        </div>
      </main>
    </div>
  )
}
