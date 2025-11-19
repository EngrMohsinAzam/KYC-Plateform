'use client'

import React from 'react'
import { Modal } from './Modal'
import { Button } from './Button'

interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
  videoUrl?: string
}

// Extract YouTube video ID from URL
function extractVideoId(url: string): string {
  const match = url.match(/(?:youtube\.com\/shorts\/|youtu\.be\/|youtube\.com\/watch\?v=)([^&\n?#]+)/)
  return match ? match[1] : ''
}

export function HelpModal({ isOpen, onClose, videoUrl }: HelpModalProps) {
  const defaultVideoUrl = 'https://www.youtube.com/shorts/NVC-rvJlnlE'
  const finalVideoUrl = videoUrl || defaultVideoUrl
  const videoId = extractVideoId(finalVideoUrl)

  const handleContactSupport = () => {
    // In production, this would open a support chat or form
    window.open('mailto:support@mirakyc.com?subject=Help with Decentralized ID', '_blank')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="p-6">
        <h2 className="text-xl font-bold text-text-primary mb-4">
          Watch this video
        </h2>

        <div className="mb-6">
          <div className="relative w-full rounded-lg aspect-video bg-black overflow-hidden mb-4">
            {videoId ? (
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`}
                title="Help Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                frameBorder="0"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <a
                  href={defaultVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors"
                  aria-label="Play video"
                >
                  <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-bold text-text-primary mb-3">
            Video didn&apos;t help?
          </h3>
        </div>

        <Button onClick={handleContactSupport}>
          Contact support
        </Button>
      </div>
    </Modal>
  )
}

