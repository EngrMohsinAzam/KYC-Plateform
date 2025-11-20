'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Header } from '@/components/layout/Header'
import { checkStatusByEmail, updateKYCDocuments } from '@/lib/api'
import { useAppContext } from '@/context/useAppContext'
import { LoadingDots } from '@/components/ui/LoadingDots'

export default function Rejected() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { state, dispatch } = useAppContext()
  const [rejectionData, setRejectionData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [canRetry, setCanRetry] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number
    hours: number
    minutes: number
    canReapply: boolean
    reapplyDate?: string
  } | null>(null)
  const [isBlurRejection, setIsBlurRejection] = useState(false)
  const [updatingDocuments, setUpdatingDocuments] = useState(false)
  const [documentFront, setDocumentFront] = useState<string | null>(state.documentImageFront || null)
  const [documentBack, setDocumentBack] = useState<string | null>(state.documentImageBack || null)
  const [selfie, setSelfie] = useState<string | null>(state.selfieImage || null)
  
  const documentInputRef = useRef<HTMLInputElement>(null)
  const selfieInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Get email from URL params or context
    const email = searchParams.get('email') || state.personalInfo?.email
    
    if (email) {
      checkRejectionStatus(email)
    } else {
      setLoading(false)
    }
  }, [searchParams, state.personalInfo?.email])

  const checkRejectionStatus = async (email: string) => {
    setLoading(true)
    try {
      const result = await checkStatusByEmail(email)
      if (result.success && result.data) {
        setRejectionData(result.data)
        
        // Check if rejection reason is "Picture is blur"
        const rejectionReason = result.data.rejectionReason || ''
        setIsBlurRejection(rejectionReason.toLowerCase().includes('blur') || rejectionReason === 'Picture is blur')
        
        // Use timeRemaining from API response
        if (result.data.timeRemaining) {
          // API provides timeRemaining object
          setTimeRemaining(result.data.timeRemaining)
          setCanRetry(result.data.timeRemaining.canReapply)
        } else {
          // No timeRemaining means they can reapply immediately (e.g., blur rejection)
          setCanRetry(true)
          setTimeRemaining(null)
        }
      }
    } catch (err) {
      console.error('Error checking rejection status:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'document' | 'selfie') => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        if (type === 'document') {
          setDocumentFront(result)
          dispatch({ type: 'SET_DOCUMENT_IMAGE_FRONT', payload: result })
        } else {
          setSelfie(result)
          dispatch({ type: 'SET_SELFIE_IMAGE', payload: result })
        }
      }
      reader.readAsDataURL(file)
    }
    if (e.target) e.target.value = ''
  }

  const handleUpdateDocuments = async () => {
    if (!rejectionData?.email) return
    
    const email = rejectionData.email
    
    if (!documentFront || !selfie) {
      alert('Please upload both document and selfie images')
      return
    }

    setUpdatingDocuments(true)
    try {
      const idTypeMap: Record<string, string> = {
        'national-id': 'CNIC',
        'passport': 'Passport',
        'drivers-license': 'License'
      }
      const idType = idTypeMap[state.selectedIdType || ''] || rejectionData.documentType || 'CNIC'

      const result = await updateKYCDocuments({
        email,
        idType,
        identityDocumentFront: documentFront,
        identityDocumentBack: documentBack || documentFront,
        liveInImage: selfie
      })

      if (result.success) {
        alert('Documents updated successfully! Your application is now under review.')
        router.push('/verify/review')
      } else {
        alert(result.message || 'Failed to update documents. Please try again.')
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred. Please try again.')
    } finally {
      setUpdatingDocuments(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white md:bg-surface-gray flex items-center justify-center">
        <div className="text-center">
          <LoadingDots size="lg" color="#2563eb" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white md:bg-surface-gray flex flex-col">
      <Header showClose />
      <main className="flex-1 px-4 md:px-0 pt-8 pb-24 md:flex md:items-center md:justify-center">
        <div className="w-full max-w-md md:bg-white p-4 rounded-2xl md:shadow-lg md:p-8 md:my-8 border-[2px] border-grey-400">
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-6 bg-red-50 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-4">
              KYC Verification Rejected
            </h1>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              Unfortunately, your KYC verification has been rejected.
            </p>
            
            {rejectionData?.rejectionReason && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-semibold text-yellow-900 mb-1">Rejection Reason:</p>
                <p className="text-sm text-yellow-800">{rejectionData.rejectionReason}</p>
              </div>
            )}

            {/* Wait period message using timeRemaining from API */}
            {!canRetry && timeRemaining && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-semibold text-blue-900 mb-2">
                  Wait Period Required
                </p>
                <p className="text-sm text-blue-800 mb-2">
                  You need to wait before you can apply again.
                </p>
                <div className="text-sm text-blue-700 space-y-1">
                  {timeRemaining.days > 0 && (
                    <p>Days: {timeRemaining.days}</p>
                  )}
                  {timeRemaining.hours > 0 && (
                    <p>Hours: {timeRemaining.hours}</p>
                  )}
                  {timeRemaining.minutes > 0 && (
                    <p>Minutes: {timeRemaining.minutes}</p>
                  )}
                  {timeRemaining.reapplyDate && (
                    <p className="text-xs mt-2">
                      You can reapply on: {new Date(timeRemaining.reapplyDate).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Blur rejection - allow document update */}
            {isBlurRejection && canRetry && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg space-y-4">
                <div>
                  <p className="text-sm font-semibold text-green-900 mb-2">
                    Update Your Documents
                  </p>
                  <p className="text-sm text-green-800 mb-4">
                    Since your rejection was due to blurry pictures, you can update your document and selfie images without starting a new verification.
                  </p>
                </div>

                {/* Document Upload */}
                <div>
                  <label className="block text-sm font-medium text-green-900 mb-2">
                    Document Photo
                  </label>
                  <div className="mb-2">
                    {documentFront ? (
                      <div className="relative">
                        <img src={documentFront} alt="Document" className="w-full max-w-xs mx-auto rounded-lg border-2 border-green-300" />
                        <button
                          onClick={() => {
                            setDocumentFront(null)
                            dispatch({ type: 'SET_DOCUMENT_IMAGE_FRONT', payload: '' })
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => documentInputRef.current?.click()}
                        className="w-full p-4 border-2 border-dashed border-green-300 rounded-lg text-green-700 hover:bg-green-100"
                      >
                        Click to upload document
                      </button>
                    )}
                    <input
                      ref={documentInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'document')}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Selfie Upload */}
                <div>
                  <label className="block text-sm font-medium text-green-900 mb-2">
                    Selfie Photo
                  </label>
                  <div className="mb-2">
                    {selfie ? (
                      <div className="relative">
                        <img src={selfie} alt="Selfie" className="w-full max-w-xs mx-auto rounded-lg border-2 border-green-300" />
                        <button
                          onClick={() => {
                            setSelfie(null)
                            dispatch({ type: 'SET_SELFIE_IMAGE', payload: '' })
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => selfieInputRef.current?.click()}
                        className="w-full p-4 border-2 border-dashed border-green-300 rounded-lg text-green-700 hover:bg-green-100"
                      >
                        Click to upload selfie
                      </button>
                    )}
                    <input
                      ref={selfieInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'selfie')}
                      className="hidden"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleUpdateDocuments}
                  disabled={updatingDocuments || !documentFront || !selfie}
                  className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                >
                  {updatingDocuments ? (
                    <>
                      <LoadingDots size="sm" color="#ffffff" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    'Update Documents & Submit'
                  )}
                </Button>
              </div>
            )}
          </div>

          <div className="md:block fixed md:relative bottom-0 left-0 right-0 p-4 bg-white md:bg-transparent border-t md:border-t-0 border-surface-light">
            {canRetry && !isBlurRejection && (
            <Button 
              onClick={() => router.push('/verify/select-id-type')}
              className="w-full"
            >
              Start New Verification
            </Button>
            )}
            {!canRetry && timeRemaining && (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  {timeRemaining.days > 0 && `${timeRemaining.days} day${timeRemaining.days > 1 ? 's' : ''}, `}
                  {timeRemaining.hours > 0 && `${timeRemaining.hours} hour${timeRemaining.hours > 1 ? 's' : ''}, `}
                  {timeRemaining.minutes > 0 && `${timeRemaining.minutes} minute${timeRemaining.minutes > 1 ? 's' : ''} remaining`}
                  {timeRemaining.days === 0 && timeRemaining.hours === 0 && timeRemaining.minutes === 0 && 'Please wait before applying again.'}
                </p>
                <Button 
                  onClick={() => router.push('/')}
                  className="w-full"
                  variant="secondary"
                >
                  Go to Home
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

