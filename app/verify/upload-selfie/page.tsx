'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Header } from '@/components/layout/Header'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useAppContext } from '@/context/useAppContext'
import dynamic from 'next/dynamic'

// Dynamically import Lottie
const Lottie = dynamic(() => import('lottie-react'), { 
  ssr: false
})

type LivenessStep = 'center' | 'left' | 'right' | 'up' | 'down' | 'complete'

export default function UploadSelfie() {
  const router = useRouter()
  const { state, dispatch } = useAppContext()
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [currentStep, setCurrentStep] = useState<LivenessStep>('center')
  const [progress, setProgress] = useState(0)
  const [capturedImage, setCapturedImage] = useState<string | null>(state.selfieImage || null)
  const [animationData, setAnimationData] = useState<any>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()
  const isLivenessRunningRef = useRef(false)

  // Load animation
  useEffect(() => {
    fetch('/face.json')
      .then(res => res.json())
      .then(data => {
          setAnimationData(data)
        console.log('✅ Face verification animation loaded')
      })
      .catch(err => {
        console.error('❌ Error loading animation:', err)
      })
  }, [])

  const steps: LivenessStep[] = ['center', 'left', 'right', 'up', 'down', 'complete']
  const stepInstructions: Record<LivenessStep, string> = {
    center: 'Position your face in the center',
    left: 'Turn your head to the LEFT ←',
    right: 'Turn your head to the RIGHT →',
    up: 'Move your head UP ↑',
    down: 'Move your head DOWN ↓',
    complete: 'Face verification complete! ✓',
  }

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [stream])

  const startCamera = async () => {
    try {
      console.log('🎥 Starting camera...')
      
      // Stop any existing stream first
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
        setStream(null)
      }

      // Cancel any existing animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = undefined
      }
      isLivenessRunningRef.current = false
      
      // Reset states
      setCurrentStep('center')
      setProgress(0)
      
      // Mobile-friendly camera constraints with better mobile support
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      
      // Try with ideal constraints first, fallback to basic if needed
      let mediaStream: MediaStream | null = null
      let lastError: any = null
      
      // Try different constraint sets for better mobile compatibility
      const constraintSets = [
        // First try: Ideal constraints for mobile
        {
          video: { 
            facingMode: { ideal: 'user' },
            width: isMobile ? { ideal: 640, min: 320 } : { ideal: 1280 },
            height: isMobile ? { ideal: 480, min: 240 } : { ideal: 720 }
          },
          audio: false
        },
        // Second try: Simpler constraints if first fails
        {
          video: { 
            facingMode: 'user'
          },
          audio: false
        },
        // Third try: Most basic - just front camera
        {
          video: true,
          audio: false
        }
      ]
      
      for (const constraints of constraintSets) {
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
          console.log('✅ Camera stream obtained with constraints:', constraints)
          break
        } catch (error: any) {
          lastError = error
          console.warn('⚠️ Camera constraint set failed, trying next...', error.name)
          // Continue to next constraint set
        }
      }
      
      if (!mediaStream) {
        throw lastError || new Error('Failed to access camera with any constraint set')
      }
      
      // Set stream first
      setStream(mediaStream)
      
      // Wait for video element and set up with retry limit
      await new Promise<void>((resolve, reject) => {
        let retries = 0
        const maxRetries = 50 // Maximum 2.5 seconds (50 * 50ms)
        
        const setupVideo = () => {
          if (!videoRef.current) {
            retries++
            if (retries >= maxRetries) {
              console.error('❌ Video ref not available after maximum retries')
              reject(new Error('Video element not found'))
              return
            }
            setTimeout(setupVideo, 50)
            return
          }

          console.log('✅ Video ref found, setting up video element')
          const video = videoRef.current
          
          // Clear any existing stream
          if (video.srcObject) {
            const oldStream = video.srcObject as MediaStream
            oldStream.getTracks().forEach(track => track.stop())
          }
          
          video.srcObject = mediaStream
          video.muted = true
          video.playsInline = true
          video.setAttribute('autoplay', 'true')
          video.setAttribute('playsinline', 'true')
          // Mobile-specific attributes for better compatibility
          video.setAttribute('webkit-playsinline', 'true')
          video.setAttribute('x5-playsinline', 'true')
          // Ensure video plays on mobile browsers
          ;(video as any).webkitPlaysInline = true
          ;(video as any).playsInline = true
          
          const handleCanPlay = () => {
            console.log('✅ Video can play')
            video.removeEventListener('canplay', handleCanPlay)
            video.removeEventListener('loadedmetadata', handleCanPlay)
            
            video.play()
            .then(() => {
                console.log('✅ Video is playing')
                setIsCameraActive(true)
                resolve()
            })
            .catch((error) => {
                console.error('❌ Error playing video:', error)
                // Still resolve to allow manual retry
                resolve()
              })
          }
          
          // Try both canplay and loadedmetadata events
          video.addEventListener('canplay', handleCanPlay)
          video.addEventListener('loadedmetadata', handleCanPlay)
          
          // If already ready, trigger immediately
          if (video.readyState >= 3) {
            handleCanPlay()
          }
        }
        
        setupVideo()
      }).catch((error) => {
        console.error('❌ Failed to setup video:', error)
        setIsCameraActive(false)
        if (mediaStream) {
          mediaStream.getTracks().forEach(track => track.stop())
        }
        setStream(null)
      })

      // Start liveness check after video is playing
      setTimeout(() => {
        if (mediaStream && mediaStream.active && !isLivenessRunningRef.current) {
          console.log('🎬 Starting liveness check...')
          startLivenessCheck()
        }
      }, 500)
      
    } catch (error: any) {
      console.error('❌ Error accessing camera:', error)
      let errorMessage = 'Unable to access camera. '
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera permissions and try again.'
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera found.'
      } else {
        errorMessage += 'Please check your camera permissions.'
      }
      alert(errorMessage)
      setIsCameraActive(false)
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
        setStream(null)
      }
    }
  }

  const startLivenessCheck = () => {
    if (isLivenessRunningRef.current) {
      console.log('⚠️ Liveness check already running')
        return
      }

    console.log('🎬 Starting liveness check animation...')
    isLivenessRunningRef.current = true
    
    let stepIndex = 0
    let startTime = Date.now()
    const stepDuration = 3000 // 3 seconds per step

    setCurrentStep('center')
    setProgress(0)

    const animate = () => {
      const elapsed = Date.now() - startTime

      if (elapsed >= stepDuration) {
        startTime = Date.now()
        stepIndex++
        
        if (stepIndex < steps.length - 1) {
          const nextStep = steps[stepIndex]
          console.log(`📸 Moving to step: ${nextStep}`)
          setCurrentStep(nextStep)
        } else {
          console.log('✅ Liveness check complete!')
          setCurrentStep('complete')
          setProgress(100)
          isLivenessRunningRef.current = false
          captureFinalPhoto()
          return
        }
      }

      // Calculate overall progress
      const stepProgress = elapsed / stepDuration
      const overallProgress = ((stepIndex + stepProgress) / (steps.length - 1)) * 100
      setProgress(Math.min(overallProgress, 100))

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)
  }

  const captureFinalPhoto = () => {
    console.log('📸 Capturing final photo...')
    
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      if (!context) {
        console.error('❌ Could not get canvas context')
        return
      }

      // Wait a moment to ensure video frame is ready
      setTimeout(() => {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
        
        // Flip the image horizontally to match the mirrored video
        context.translate(canvas.width, 0)
        context.scale(-1, 1)
        context.drawImage(video, 0, 0)

      const imageData = canvas.toDataURL('image/png')
        console.log('✅ Selfie captured')
        
      setCapturedImage(imageData)
      dispatch({ type: 'SET_SELFIE_IMAGE', payload: imageData })
        
      stopCamera()
      }, 200)
    } else {
      console.error('❌ Video or canvas ref not available')
    }
  }

  const stopCamera = () => {
    console.log('🛑 Stopping camera...')
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = undefined
    }
    isLivenessRunningRef.current = false
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    
      setIsCameraActive(false)
    
      if (videoRef.current) {
        videoRef.current.srcObject = null
    }
  }

  const handleContinue = () => {
    if (capturedImage) {
      console.log('✅ Continuing with selfie image saved')
      dispatch({ type: 'SET_SELFIE_IMAGE', payload: capturedImage })
    router.push('/verify/identity')
  }
  }

  const handleRetake = () => {
    setCapturedImage(null)
    setCurrentStep('center')
    setProgress(0)
    dispatch({ type: 'SET_SELFIE_IMAGE', payload: '' })
    stopCamera()
    setTimeout(() => {
      startCamera()
    }, 300)
  }

  // Auto-start camera when component loads - wait for video element to be rendered
  useEffect(() => {
    if (!state.selfieImage && !isCameraActive && !capturedImage) {
      // Wait longer to ensure video element is rendered
      const timer = setTimeout(() => {
        // Double check video ref is available before starting
        if (videoRef.current) {
          console.log('🚀 Auto-starting camera...')
          startCamera()
        } else {
          console.warn('⚠️ Video ref not ready, will retry on next render')
          // Retry after a longer delay
          setTimeout(() => {
            if (videoRef.current) {
              console.log('🚀 Retrying camera start...')
              startCamera()
  }
          }, 1000)
        }
      }, 800)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getProgressColor = () => {
    if (progress < 33) return 'bg-red-500'
    if (progress < 66) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getProgressColorHex = () => {
    if (progress < 33) return '#ef4444'
    if (progress < 66) return '#eab308'
    return '#10b981'
  }

    return (
      <div className="min-h-screen h-screen bg-white flex flex-col overflow-hidden">
        {/* Mobile Header */}
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
          <Header showBack showClose />
          <ProgressBar currentStep={4} totalSteps={5} />
        </div>
        
        <main className="flex-1 overflow-y-auto">
          <div className="min-h-full md:flex md:items-center md:justify-center md:py-8">
            {/* Mobile Design */}
          <div className="md:hidden h-full flex flex-col px-4 pt-4 pb-32">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Take a Selfie
            </h1>
            <p className="text-sm text-gray-500 mb-4">
              Make sure your face is clearly visible and well-lit
            </p>

            <div className="flex-1 flex flex-col min-h-0">
              <div className="relative w-full flex-1 min-h-[400px] max-h-[70vh] bg-gray-900 rounded-2xl overflow-hidden mb-4">
                {/* Always render video element (hidden when not active) */}
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                  className={`w-full h-full object-cover ${isCameraActive && stream ? 'block' : 'hidden'}`}
                          style={{ transform: 'scaleX(-1)' }}
                        />
                        <canvas ref={canvasRef} className="hidden" />
                        
                {isCameraActive && stream ? (
                  <>
                        {/* Face frame overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="relative w-full h-full flex items-center justify-center">
                          <div className="w-[70%] aspect-square rounded-full border-4 border-green-500 relative">
                            <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(16, 185, 129, 0.2)" strokeWidth="4" />
                              <circle
                                cx="50" cy="50" r="48" fill="none"
                              stroke={getProgressColorHex()}
                                strokeWidth="4"
                                strokeDasharray={`${2 * Math.PI * 48}`}
                                strokeDashoffset={`${2 * Math.PI * 48 * (1 - progress / 100)}`}
                                strokeLinecap="round"
                                className="transition-all duration-300"
                              />
                            </svg>
                          
                          {/* Center dot indicator */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className={`w-2 h-2 rounded-full ${currentStep === 'complete' ? 'bg-green-500' : 'bg-white'} transition-all duration-300`} />
                          </div>
                        </div>

                        {/* Direction arrows - larger and more visible */}
                        {currentStep !== 'complete' && currentStep !== 'center' && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            {currentStep === 'left' && (
                              <div className="absolute left-2 sm:left-4 text-white text-5xl sm:text-6xl font-black animate-pulse drop-shadow-2xl" style={{ textShadow: '0 0 20px rgba(0,0,0,0.8)' }}>←</div>
                            )}
                            {currentStep === 'right' && (
                              <div className="absolute right-2 sm:right-4 text-white text-5xl sm:text-6xl font-black animate-pulse drop-shadow-2xl" style={{ textShadow: '0 0 20px rgba(0,0,0,0.8)' }}>→</div>
                            )}
                            {currentStep === 'up' && (
                              <div className="absolute top-2 sm:top-4 text-white text-5xl sm:text-6xl font-black animate-pulse drop-shadow-2xl" style={{ textShadow: '0 0 20px rgba(0,0,0,0.8)' }}>↑</div>
                            )}
                            {currentStep === 'down' && (
                              <div className="absolute bottom-2 sm:bottom-4 text-white text-5xl sm:text-6xl font-black animate-pulse drop-shadow-2xl" style={{ textShadow: '0 0 20px rgba(0,0,0,0.8)' }}>↓</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress bar and instruction text */}
                        <div className="absolute bottom-4 left-4 right-4">
                      <div className="w-full h-2 bg-white bg-opacity-20 rounded-full overflow-hidden mb-2">
                        <div className={`h-full ${getProgressColor()} transition-all duration-300`} style={{ width: `${progress}%` }} />
                      </div>
                      <p className="text-white text-sm text-center font-semibold">
                            {stepInstructions[currentStep]}
                          </p>
                        </div>
                      </>
                ) : capturedImage ? (
                  <img src={capturedImage} alt="Selfie" className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                          <p className="text-white text-sm">Starting camera...</p>
                        </div>
                      </div>
                    )}
              </div>

              <p className="text-sm text-gray-600 text-center mb-4">
                {capturedImage 
                  ? '✓ Selfie captured successfully'
                  : isCameraActive
                  ? 'Position your face within the frame'
                  : 'Ready to capture'}
              </p>
            </div>
          </div>

          {/* Desktop Design */}
          <div className="hidden md:block w-full max-w-md lg:max-w-2xl px-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                Take a Selfie
              </h1>
              <p className="text-sm text-gray-600 mb-6">
                Please take a clear selfie for face verification. Make sure your face is clearly visible and well-lit.
              </p>

              <div className="mb-6">
                <div className="relative w-full aspect-[3/2] bg-gray-900 rounded-lg overflow-hidden mb-4">
                  {/* Always render video element */}
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className={`w-full h-full object-cover ${isCameraActive && stream ? 'block' : 'hidden'}`}
                          style={{ transform: 'scaleX(-1)' }}
                        />
                          <canvas ref={canvasRef} className="hidden" />
                          
                  {isCameraActive && stream ? (
                    <>
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="relative w-full h-full flex items-center justify-center">
                            <div className="w-[70%] max-w-[256px] aspect-square rounded-full border-4 border-green-500 relative">
                              <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(16, 185, 129, 0.2)" strokeWidth="4" />
                                <circle
                                  cx="50" cy="50" r="48" fill="none"
                                stroke={getProgressColorHex()}
                                  strokeWidth="4"
                                  strokeDasharray={`${2 * Math.PI * 48}`}
                                  strokeDashoffset={`${2 * Math.PI * 48 * (1 - progress / 100)}`}
                                strokeLinecap="round"
                                  className="transition-all duration-300"
                                />
                              </svg>
                            
                            {/* Center dot indicator */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className={`w-2 h-2 rounded-full ${currentStep === 'complete' ? 'bg-green-500' : 'bg-white'} transition-all duration-300`} />
                            </div>
                          </div>

                          {/* Direction arrows - larger and more visible */}
                          {currentStep !== 'complete' && currentStep !== 'center' && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              {currentStep === 'left' && (
                                <div className="absolute left-8 text-white text-7xl font-black animate-pulse drop-shadow-2xl" style={{ textShadow: '0 0 30px rgba(0,0,0,0.9)' }}>←</div>
                              )}
                              {currentStep === 'right' && (
                                <div className="absolute right-8 text-white text-7xl font-black animate-pulse drop-shadow-2xl" style={{ textShadow: '0 0 30px rgba(0,0,0,0.9)' }}>→</div>
                              )}
                              {currentStep === 'up' && (
                                <div className="absolute top-8 text-white text-7xl font-black animate-pulse drop-shadow-2xl" style={{ textShadow: '0 0 30px rgba(0,0,0,0.9)' }}>↑</div>
                              )}
                              {currentStep === 'down' && (
                                <div className="absolute bottom-8 text-white text-7xl font-black animate-pulse drop-shadow-2xl" style={{ textShadow: '0 0 30px rgba(0,0,0,0.9)' }}>↓</div>
                              )}
                            </div>
                          )}
                            </div>
                          </div>

                          <div className="absolute bottom-4 left-4 right-4">
                            <div className="w-full h-2 bg-white bg-opacity-20 rounded-full overflow-hidden mb-2">
                              <div className={`h-full ${getProgressColor()} transition-all duration-300`} style={{ width: `${progress}%` }} />
                            </div>
                            <p className="text-white text-sm text-center font-medium">{stepInstructions[currentStep]}</p>
                          </div>
                        </>
                  ) : capturedImage ? (
                    <img src={capturedImage} alt="Selfie" className="w-full h-full object-contain" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-white text-sm">Initializing camera...</p>
                          </div>
                        </div>
                      )}
                </div>
              </div>

              <div className="space-y-3">
                {isCameraActive && !capturedImage && (
                  <button onClick={stopCamera} className="w-full px-6 py-3 bg-gray-100 text-gray-900 rounded-full font-medium">
                    Cancel Camera
                  </button>
                )}
                {capturedImage && (
                  <>
                    <Button 
                      onClick={handleContinue} 
                      className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full py-3 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                      disabled={currentStep !== 'complete'}
                    >
                      {currentStep === 'complete' ? '✓ Selfie is Clear - Continue' : 'Please complete face verification'}
                    </Button>
                    <button onClick={handleRetake} className="w-full px-6 py-3 bg-gray-100 text-gray-900 rounded-full font-medium">
                      Retake photo
                    </button>
                  </>
                )}
                {!capturedImage && !isCameraActive && (
                  <Button 
                    onClick={() => {
                      console.log('📸 Manual camera start requested')
                      startCamera()
                    }} 
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full py-3 font-medium"
                  >
                    Start Camera
                  </Button>
                )}
              </div>

              <p className="text-xs text-gray-500 text-center mt-3">Powered by Mira</p>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Fixed Button */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg">
        <div className="space-y-2">
          {isCameraActive && !capturedImage && (
            <button onClick={stopCamera} className="w-full px-6 py-3 bg-gray-100 text-gray-900 rounded-full font-medium">
              Cancel Camera
            </button>
          )}
          {capturedImage && (
            <>
              <Button 
                onClick={handleContinue} 
                className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full py-3 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                disabled={currentStep !== 'complete'}
              >
                {currentStep === 'complete' ? 'Continue' : 'Please complete face verification'}
              </Button>
              <button onClick={handleRetake} className="w-full px-6 py-3 bg-gray-100 text-gray-900 rounded-full font-medium">
                Retake Photo
              </button>
            </>
          )}
          {!capturedImage && !isCameraActive && (
            <Button 
              onClick={() => {
                console.log('📸 Manual camera start requested')
                startCamera()
              }} 
              className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full py-3 font-medium"
            >
              Start Camera
            </Button>
          )}
          {isCameraActive && !stream && (
            <div className="w-full p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-2">
              <p className="text-sm text-yellow-800 text-center">
                Camera is starting... Please wait
              </p>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 text-center mt-2">Powered by Mira</p>
      </div>
    </div>
  )
}