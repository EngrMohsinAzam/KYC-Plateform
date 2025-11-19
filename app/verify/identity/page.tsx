'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Header } from '@/components/layout/Header'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useAppContext } from '@/context/useAppContext'
import { HiOutlineDocumentText, HiOutlineUser } from 'react-icons/hi'

export default function VerifyIdentity() {
  const router = useRouter()
  const { state } = useAppContext()

  const handleDocumentClick = () => {
    router.push('/verify/upload-document')
  }

  const handleSelfieClick = () => {
    router.push('/verify/upload-selfie')
  }

  const hasDocument = state.documentImageFront || state.documentImage
  const needsBackSide = state.selectedIdType && state.selectedIdType !== 'passport'
  const hasBackImage = !needsBackSide || state.documentImageBack
  const documentComplete = hasDocument && hasBackImage
  const canContinue = documentComplete && state.selfieImage

  const handleContinue = () => {
    router.push('/verify/personal-info')
  }

  return (
    <div className="min-h-screen h-screen bg-white flex flex-col overflow-hidden">
      {/* Mobile Header - Simple back and close */}
      <div className="md:hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <button onClick={() => router.back()} className="p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button onClick={() => router.push('/')} className="p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block">
        <Header showBack showClose title="Verify your identity" />
        <ProgressBar currentStep={3} totalSteps={5} />
      </div>
      
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full md:flex md:items-center md:justify-center md:py-16">
          {/* Mobile Design - Full screen, centered */}
          <div className="md:hidden h-full flex flex-col px-4 pt-12 pb-32">
            {/* Title */}
            <div className="text-center mb-6">
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Verify your identity
              </h1>
              <p className="text-sm text-gray-400">
                It will only take 2 minutes
              </p>
            </div>

            {/* Cards */}
            <div className="space-y-3 flex-1">
              {/* Identity Document Card */}
              <div 
                onClick={handleDocumentClick}
                className="bg-gray-50 rounded-xl p-4 cursor-pointer hover:bg-gray-100 transition-all"
              >
                <div className="flex items-center gap-3">
                  {/* Icon */}
                  <div className="bg-white rounded-lg w-10 h-10 flex items-center justify-center flex-shrink-0">
                    <HiOutlineDocumentText className="w-5 h-5 text-gray-500" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-sm mb-0.5">Identity document</h3>
                    <p className="text-xs text-gray-400">
                      {documentComplete ? 'Document uploaded ✓' : 'Take a photo of your ID'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Selfie Card */}
              <div 
                onClick={handleSelfieClick}
                className="bg-gray-50 rounded-xl p-4 cursor-pointer hover:bg-gray-100 transition-all"
              >
                <div className="flex items-center gap-3">
                  {/* Icon */}
                  <div className="bg-white rounded-lg w-10 h-10 flex items-center justify-center flex-shrink-0">
                    <HiOutlineUser className="w-5 h-5 text-gray-500" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-sm mb-0.5">Selfie</h3>
                    <p className="text-xs text-gray-400">
                      {state.selfieImage ? 'Selfie uploaded ✓' : 'Take a selfie'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Design - Card with all content */}
          <div className="hidden md:block w-full max-w-md lg:max-w-2xl px-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
              {/* Title */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                  Verify your identity
                </h1>
                <p className="text-sm text-gray-500">
                  It will only take 2 minutes
                </p>
              </div>

              {/* Cards Container */}
              <div className="space-y-4 mb-8">
                {/* Identity Document Card */}
                <div 
                  onClick={handleDocumentClick}
                  className={`
                    bg-gray-50 rounded-xl p-5 cursor-pointer transition-all
                    hover:bg-gray-100 flex items-center gap-4
                    ${documentComplete ? 'ring-2 ring-green-500' : ''}
                  `}
                >
                  <div className="bg-white rounded-lg w-12 h-12 flex items-center justify-center flex-shrink-0">
                    <HiOutlineDocumentText className="w-6 h-6 text-gray-600" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900">Identity document</h3>
                      {documentComplete && (
                        <div className="w-5 h-5 bg-green-500 rounded-lg flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {documentComplete 
                        ? needsBackSide 
                          ? 'Front and back sides uploaded ✓' 
                          : 'Document uploaded ✓'
                        : 'Take a photo of your ID'}
                    </p>
                  </div>

                  {!documentComplete && (
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>

                {/* Selfie Card */}
                <div 
                  onClick={handleSelfieClick}
                  className={`
                    bg-gray-50 rounded-xl p-5 cursor-pointer transition-all
                    hover:bg-gray-100 flex items-center gap-4
                    ${state.selfieImage ? 'ring-2 ring-green-500' : ''}
                  `}
                >
                  <div className="bg-white rounded-lg w-12 h-12 flex items-center justify-center flex-shrink-0">
                    <HiOutlineUser className="w-6 h-6 text-gray-600" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900">Selfie</h3>
                      {state.selfieImage && (
                        <div className="w-5 h-5 bg-green-500 rounded-lg flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {state.selfieImage ? 'Selfie uploaded ✓' : 'Take a selfie'}
                    </p>
                  </div>

                  {!state.selfieImage && (
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              </div>

              <Button 
                onClick={handleContinue} 
                disabled={!canContinue} 
                className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full py-3 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Continue
              </Button>
              <p className="text-xs text-gray-500 text-center mt-3">
                Powered by Mira
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Fixed Button */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg">
        <Button 
          onClick={handleContinue} 
          disabled={!canContinue} 
          className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full py-3 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Continue
        </Button>
        <p className="text-xs text-gray-500 text-center mt-2">
          Powered by Mira
        </p>
      </div>
    </div>
  )
}