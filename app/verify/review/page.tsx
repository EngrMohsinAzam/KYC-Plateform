'use client'

// Force dynamic rendering - this page uses client-side only features (wagmi, localStorage)
export const dynamic = 'force-dynamic'

import dynamicImport from 'next/dynamic'

// Dynamically import the component with SSR disabled
const ReviewContent = dynamicImport(
  () => import('./ReviewContent'),
  { ssr: false }
)

export default function Review() {
  return <ReviewContent />
}
