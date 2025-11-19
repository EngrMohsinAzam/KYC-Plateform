'use client'

// Force dynamic rendering - this page uses client-side only features
export const dynamic = 'force-dynamic'

import dynamicImport from 'next/dynamic'

// Dynamically import the component with SSR disabled
const WalletConnectPageContent = dynamicImport(
  () => import('./WalletConnectContent'),
  { ssr: false }
)

export default function WalletConnectPage() {
  return <WalletConnectPageContent />
}
