'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Header } from '@/components/layout/Header'

export default function Rejected() {
  const router = useRouter()

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
            <p className="text-sm text-text-secondary leading-relaxed">
              Unfortunately, your KYC verification has been rejected. Please review the requirements and try again. If you believe this is an error, please contact support.
            </p>
          </div>

          <div className="md:block fixed md:relative bottom-0 left-0 right-0 p-4 bg-white md:bg-transparent border-t md:border-t-0 border-surface-light">
            <Button 
              onClick={() => router.push('/verify/select-id-type')}
              className="w-full"
            >
              Start New Verification
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}

