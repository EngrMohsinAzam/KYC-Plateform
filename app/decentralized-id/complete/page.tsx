'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Header } from '@/components/layout/Header'
import { useAppContext } from '@/context/useAppContext'

export default function VerificationComplete() {
  const { state } = useAppContext()
  const [transactionHash, setTransactionHash] = useState<string | null>(null)
  
  useEffect(() => {
    // Get transaction hash from localStorage
    const hash = localStorage.getItem('kycTransactionHash')
    if (hash) {
      setTransactionHash(hash)
    }
  }, [])

  const anonymousId = state.idNumber 
    ? `AID-${state.idNumber.slice(0, 4)}-${state.idNumber.slice(4, 8)}-${state.idNumber.slice(8, 12)}-${state.idNumber.slice(12)}`
    : 'AID-4278-8818-2637-3231'
  
  // Get explorer URL based on network (adjust based on your network)
  const getExplorerUrl = (hash: string) => {
    // Default to Etherscan - adjust based on your network
    return `https://etherscan.io/tx/${hash}`
  }

  const handleDownload = () => {
    // Create a canvas to generate the ID card image
    const canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 500
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      // Draw background
      ctx.fillStyle = '#1A202C'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Draw text
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 32px Inter'
      ctx.fillText('Digital Identity', 40, 60)
      
      ctx.font = '16px Inter'
      ctx.fillStyle = '#10B981'
      ctx.fillText('Verified by Blockchain', 40, 100)
      
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 24px Inter'
      ctx.fillText(anonymousId, 40, 200)
      
      ctx.font = '14px Inter'
      ctx.fillText('Blockchain: BSC Testnet', 40, 250)
      ctx.fillText('Verified: Oct 24, 2025', 40, 280)
      
      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `KYX-ID-${anonymousId}.png`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        }
      }, 'image/png')
    }
  }

  const handleShare = async () => {
    const shareData = {
      title: 'KYX Platform - Digital Identity',
      text: `My anonymous ID: ${anonymousId}`,
      url: window.location.href,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(
          `KYX Platform - Digital Identity\nAnonymous ID: ${anonymousId}\nBlockchain: Mira-20\nVerified: Oct 24, 2025`
        )
        alert('Information copied to clipboard!')
      }
    } catch (error) {
      // User cancelled or error occurred
      console.log('Share cancelled or failed')
    }
  }

  return (
    <div className="min-h-screen bg-white md:bg-surface-gray flex flex-col">
      <Header showClose />
      <main className="flex-1 px-4 md:px-0 pt-8 pb-6 md:flex md:items-center md:justify-center">
        <div className="w-full max-w-md md:bg-white md:rounded-lg md:shadow-md md:p-6 md:my-8">
          <div className="text-center mb-8">
          {/* Mobile: Green circle with checkmark */}
          <div className="w-20 h-20 mx-auto mb-6 bg-green-500 rounded-full flex items-center justify-center md:bg-accent-green">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Verification Complete!
          </h1>
          <p className="text-sm text-text-light">Your anonymous ID has been created!</p>
        </div>

        <div className="mb-6">
          <div className="bg-primary rounded-lg p-6 text-white relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm opacity-90 mb-1">Digital Identity</p>
              </div>
              <div className="w-10 h-10 bg-accent-blue rounded-full flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-accent-green font-semibold mb-2">Verified by Blockchain</p>
            </div>

            <div className="mb-4">
              <p className="text-sm opacity-90 mb-1">Anonymous ID:</p>
              <p className="text-xl font-bold">{anonymousId}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs opacity-90 mb-1">Blockchain:</p>
                <p className="text-sm font-semibold">BSC Testnet</p>
              </div>
              <div>
                <p className="text-xs opacity-90 mb-1">Verified:</p>
                <p className="text-sm font-semibold">Oct 24, 2025</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white border-opacity-20">
              <div className="w-full h-24 bg-white bg-opacity-10 rounded flex items-center justify-center">
                <div className="grid grid-cols-8 gap-1">
                  {Array.from({ length: 64 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded ${
                        Math.random() > 0.5 ? 'bg-white' : 'bg-white bg-opacity-30'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm text-text-secondary mb-6 text-center leading-relaxed">
          Your identity has been verified and stamped on the Binance Smart Chain Testnet. This anonymous ID protects your privacy while proving your verification status.
        </p>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleDownload} className="flex-1 flex items-center justify-center gap-2 border-2 border-text-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </Button>
          <Button variant="secondary" onClick={handleShare} className="flex-1 flex items-center justify-center gap-2 border-2 border-text-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </Button>
        </div>
        </div>
      </main>
    </div>
  )
}

