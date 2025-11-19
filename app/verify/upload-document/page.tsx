// 'use client'

// import { useState, useRef, useEffect } from 'react'
// import { useRouter } from 'next/navigation'
// import { Button } from '@/components/ui/Button'
// import { Header } from '@/components/layout/Header'
// import { ProgressBar } from '@/components/ui/ProgressBar'
// import { useAppContext } from '@/context/useAppContext'

// const idTypeLabels: Record<string, string> = {
//   'passport': 'Passport',
//   'national-id': 'National ID Card',
//   'drivers-license': "Driver's License",
// }

// export default function UploadDocument() {
//   const router = useRouter()
//   const { state, dispatch } = useAppContext()
  
//   const idTypeLabel = state.selectedIdType ? idTypeLabels[state.selectedIdType] || 'ID Document' : 'ID Document'
//   const needsBackSide = state.selectedIdType !== 'passport' // Passports usually only need front
  
//   // Determine initial side: if front is uploaded and back is needed but not uploaded, show back side
//   const getInitialSide = (): 'front' | 'back' => {
//     if (state.documentImageFront && needsBackSide && !state.documentImageBack) {
//       return 'back'
//     }
//     return 'front'
//   }
  
//   const [currentSide, setCurrentSide] = useState<'front' | 'back'>(getInitialSide())
//   const [frontImage, setFrontImage] = useState<string | null>(state.documentImageFront || null)
//   const [backImage, setBackImage] = useState<string | null>(state.documentImageBack || null)
  
//   const fileInputRef = useRef<HTMLInputElement>(null)
//   const cameraInputRef = useRef<HTMLInputElement>(null)
  
//   // Preload face verification animation for next step
//   useEffect(() => {
//     // Preload the animation JSON file in the background
//     fetch('/Face%20verification.json')
//       .then(res => res.json())
//       .then(() => {
//         // Animation data cached by browser, will load faster on next page
//         console.log('Face verification animation preloaded')
//       })
//       .catch(() => {
//         // Silently fail - will load on next page anyway
//       })
//   }, [])

//   // Debug: Log state changes to help troubleshoot
//   useEffect(() => {
//     console.log('Document Upload State:', {
//       currentSide,
//       hasFrontImage: !!frontImage,
//       hasBackImage: !!backImage,
//       needsBackSide,
//       frontImageLength: frontImage?.length || 0,
//       backImageLength: backImage?.length || 0,
//       stateFrontImage: !!state.documentImageFront,
//       stateBackImage: !!state.documentImageBack
//     })
//   }, [currentSide, frontImage, backImage, needsBackSide, state.documentImageFront, state.documentImageBack])
  
//   // Sync local state with global state when component mounts or state changes
//   useEffect(() => {
//     if (state.documentImageFront && !frontImage) {
//       console.log('Restoring front image from global state')
//       setFrontImage(state.documentImageFront)
//     }
//     if (state.documentImageBack && !backImage) {
//       console.log('Restoring back image from global state')
//       setBackImage(state.documentImageBack)
//     }
//   }, [state.documentImageFront, state.documentImageBack])

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0]
//     if (file) {
//       console.log('📷 File selected:', file.name, file.size, 'bytes')
//       const reader = new FileReader()
//       reader.onloadend = () => {
//         const result = reader.result as string
//         if (currentSide === 'front') {
//           console.log('✅ Front image captured, saving to state...')
//           setFrontImage(result)
//           // Immediately save to global state
//           dispatch({ type: 'SET_DOCUMENT_IMAGE_FRONT', payload: result })
//           // Also set as main document image for backward compatibility
//           dispatch({ type: 'SET_DOCUMENT_IMAGE', payload: result })
//           console.log('✅ Front image saved to state (length:', result.length, 'chars)')
//           // Don't change UI - just set the image
//         } else if (currentSide === 'back') {
//           console.log('✅ Back image captured, saving to state...')
//           setBackImage(result)
//           // Immediately save to global state
//           dispatch({ type: 'SET_DOCUMENT_IMAGE_BACK', payload: result })
//           console.log('✅ Back image saved to state (length:', result.length, 'chars)')
//           // Don't change UI - just set the image, stay on back side
//         }
//       }
//       reader.onerror = (error) => {
//         console.error('❌ Error reading file:', error)
//         alert('Error reading file. Please try again.')
//       }
//       reader.readAsDataURL(file)
//     }
//     // Reset input so same file can be selected again if needed
//     if (e.target) {
//       e.target.value = ''
//     }
//   }

//   const handleCameraClick = () => {
//     cameraInputRef.current?.click()
//   }

//   const handleFileClick = () => {
//     fileInputRef.current?.click()
//   }

//   const handleContinue = () => {
//     console.log('Continue clicked:', { currentSide, frontImage: !!frontImage, backImage: !!backImage, needsBackSide })
    
//     // Front side uploaded, need to switch to back side
//     if (currentSide === 'front' && needsBackSide && frontImage) {
//       // Ensure front image is saved to state before switching
//       console.log('✅ Front image present, saving to state and switching to back side...')
//       dispatch({ type: 'SET_DOCUMENT_IMAGE_FRONT', payload: frontImage })
//       dispatch({ type: 'SET_DOCUMENT_IMAGE', payload: frontImage })
      
//       // Switch to back side immediately (no delay)
//       setCurrentSide('back')
//       // Reset file inputs for back side
//       if (fileInputRef.current) fileInputRef.current.value = ''
//       if (cameraInputRef.current) cameraInputRef.current.value = ''
//       console.log('✅ Switched to back side - ready for back image upload')
//       return // Don't proceed further, just switch sides
//     }
    
//     // Back side uploaded, both sides are complete
//     if (currentSide === 'back' && backImage && frontImage) {
//       // Ensure both images are saved to state
//       console.log('Both images present, saving to state and navigating...')
//       console.log('Front image length:', frontImage.length)
//       console.log('Back image length:', backImage.length)
      
//       // Save both images to state
//       dispatch({ type: 'SET_DOCUMENT_IMAGE_FRONT', payload: frontImage })
//       dispatch({ type: 'SET_DOCUMENT_IMAGE_BACK', payload: backImage })
      
//       // Double-check that both images are valid before navigating
//       if (!frontImage || frontImage.length < 100) {
//         alert('Front image is missing or invalid. Please retake the front side photo.')
//         return
//       }
//       if (!backImage || backImage.length < 100) {
//         alert('Back image is missing or invalid. Please retake the back side photo.')
//         return
//       }
      
//       // Wait a moment to ensure state is saved before navigation
//       setTimeout(() => {
//         // Verify state was saved correctly
//         console.log('Verifying state before navigation...')
//         console.log('State front image:', !!state.documentImageFront)
//         console.log('State back image:', !!state.documentImageBack)
//         console.log('Navigating to identity page with both images')
//         router.push('/verify/identity')
//       }, 300)
//       return
//     }
    
//     // Passport only needs front side
//     if (currentSide === 'front' && !needsBackSide && frontImage) {
//       console.log('Passport - only front side needed, saving and navigating...')
//       dispatch({ type: 'SET_DOCUMENT_IMAGE_FRONT', payload: frontImage })
//       setTimeout(() => {
//         router.push('/verify/identity')
//       }, 200)
//       return
//     }
    
//     // If we reach here, something is wrong - show alert
//     if (needsBackSide && currentSide === 'back' && !backImage) {
//       alert('Please upload the back side of your document before continuing.')
//     } else if (needsBackSide && currentSide === 'front' && !frontImage) {
//       alert('Please upload the front side of your document first.')
//     } else {
//       console.error('Unexpected state in handleContinue:', { currentSide, frontImage: !!frontImage, backImage: !!backImage, needsBackSide })
//       alert('Please upload the required document image(s) before continuing.')
//     }
//   }

//   const handleRetake = () => {
//     if (currentSide === 'front') {
//       setFrontImage(null)
//       dispatch({ type: 'SET_DOCUMENT_IMAGE_FRONT', payload: '' })
//     } else {
//       setBackImage(null)
//       dispatch({ type: 'SET_DOCUMENT_IMAGE_BACK', payload: '' })
//     }
//     if (fileInputRef.current) fileInputRef.current.value = ''
//     if (cameraInputRef.current) cameraInputRef.current.value = ''
//   }

//   const handleBackToFront = () => {
//     setCurrentSide('front')
//   }

//   const currentImage = currentSide === 'front' ? frontImage : backImage
//   // Can continue only if current side has image
//   // For back side, also need front image to be present
//   const canContinue = currentImage !== null && (currentSide === 'front' || (currentSide === 'back' && frontImage))

//   return (
//     <div className="min-h-screen bg-white md:bg-surface-gray flex flex-col">
//       <Header showBack showClose />
//       <ProgressBar currentStep={4} totalSteps={5} />
//       <main className="flex-1 px-4 md:px-0 pt-6 pb-24 md:flex md:items-center md:justify-center py-24">
//         <div className="w-full max-w-md lg:max-w-2xl md:bg-white p-4 rounded-2xl md:p-6 md:my-8 border-[2px] border-grey-400">
//           <div className="mb-6">
//             <h1 className="text-xl font-bold text-text-primary mb-2">
//               {idTypeLabel}
//             </h1>
//             {needsBackSide && (
//               <div className="mb-4">
//                 <p className="text-sm font-semibold text-text-primary mb-2">
//                   {currentSide === 'front' ? 'Step 1 of 2: Front Side' : 'Step 2 of 2: Back Side'}
//                 </p>
              
//                 {currentSide === 'front' && frontImage && (
//                   <p className="text-xs text-accent-green font-semibold">
//                     ✓ Front side uploaded. Now you need to upload the BACK side.
//                   </p>
//                 )}
//               </div>
//             )}
            
//             {!needsBackSide && (
//               <p className="text-xs text-text-secondary mb-2">
//                 Please take a photo of your passport. Make sure all information is visible and readable.
//               </p>
//             )}

//             {/* Progress indicator for front/back */}
//             {needsBackSide && (
//               <div className="mb-4">
//                 <div className="flex gap-2 mb-2">
//                   <div className={`flex-1 h-2 rounded-full ${frontImage ? 'bg-accent-green' : 'bg-surface-light'}`} />
//                   <div className={`flex-1 h-2 rounded-full ${backImage ? 'bg-accent-green' : 'bg-surface-light'}`} />
//                 </div>
//                 <div className="flex gap-2 text-xs">
//                   <div className={`flex-1 text-center ${frontImage ? 'text-accent-green font-semibold' : 'text-text-light'}`}>
//                     Front {frontImage ? '✓' : '○'}
//                   </div>
//                   <div className={`flex-1 text-center ${backImage ? 'text-accent-green font-semibold' : 'text-text-light'}`}>
//                     Back {backImage ? '✓' : '○'}
//                   </div>
//                 </div>
//               </div>
//             )}
            
//             {/* Show both images when on back side */}
//             {currentSide === 'back' && frontImage && (
//   <div className="mb-4 flex justify-center">
//     <div className="relative w-full max-w-sm aspect-[16/16] bg-pink-50 border-2 border-pink-200 rounded-lg overflow-hidden">
//       <img
//         src={frontImage}
//         alt="Front side preview"
//         className="w-full h-auto max-h-96 object-contain bg-white"
//       />
//     </div>
//   </div>
// )}

//             <div className="mb-6">
//               <div className="relative mx-auto w-full max-w-sm aspect-[16/16] bg-pink-50 border-2 border-pink-200 rounded-lg overflow-hidden mb-4">
//                 {currentImage ? (
//                   <img
//                     src={currentImage}
//                     alt={`ID Document ${currentSide}`}
//                     className="w-full h-auto max-h-96 object-contain bg-white"
//                   />
//                 ) : (
//                   <div className="w-full h-full flex items-center justify-center cursor-pointer" onClick={handleFileClick}>
//                     <div className="text-center">
//                       <svg
//                         className="w-16 h-16 text-text-light mx-auto mb-4"
//                         fill="none"
//                         stroke="currentColor"
//                         viewBox="0 0 24 24"
//                       >
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           strokeWidth={2}
//                           d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
//                         />
//                       </svg>
//                       <p className="text-sm text-text-light mb-4">Make sure that all the information on the document is visible and easily readable.</p>
//                       <div className="flex gap-2 justify-center">
//                         <button
//                           onClick={(e) => {
//                             e.stopPropagation()
//                             handleFileClick()
//                           }}
//                           className="px-4 py-2 bg-primary text-white rounded-button text-sm hover:bg-primary-light transition-colors"
//                         >
//                           Choose File
//                         </button>
//                         <button
//                           onClick={(e) => {
//                             e.stopPropagation()
//                             handleCameraClick()
//                           }}
//                           className="px-4 py-2 bg-white text-primary border-2 border-primary rounded-button text-sm hover:bg-surface-light transition-colors"
//                         >
//                           Use Camera
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                 )}
//               </div>
//               {/* Hidden file inputs */}
//               <input
//                 ref={fileInputRef}
//                 type="file"
//                 accept="image/*"
//                 onChange={handleFileChange}
//                 className="hidden"
//                 aria-label={`Upload ID document ${currentSide}`}
//               />
//               <input
//                 ref={cameraInputRef}
//                 type="file"
//                 accept="image/*"
//                 capture="environment"
//                 onChange={handleFileChange}
//                 className="hidden"
//                 aria-label={`Take photo with camera ${currentSide}`}
//               />
//             </div>
//           </div>

//           <div className="space-y-3">
//             {currentImage ? (
//               <>
//                 <Button 
//                   onClick={handleContinue}
//                   disabled={!canContinue}
//                   className="w-full bg-black hover:bg-black/80 text-white font-semibold rounded-full py-3 disabled:bg-gray-300 disabled:cursor-not-allowed"
//                 >
//                   {currentSide === 'front' && needsBackSide && frontImage
//                     ? 'Continue to Back Side'
//                     : currentSide === 'back' && backImage && frontImage
//                     ? 'Continue'
//                     : 'Document is readable'}
//                 </Button>
                
//                 <Button 
//                   onClick={handleRetake}
//                   variant="secondary"
//                   className="w-full border-2 border-text-primary text-text-primary hover:bg-surface-light rounded-full py-3"
//                 >
//                   Retake photo
//                 </Button>
//               </>
//             ) : (
//               <Button 
//                 onClick={handleFileClick}
//                 className="w-full bg-black hover:bg-black/80 text-white font-semibold rounded-full py-3"
//               >
//                 Upload Document
//               </Button>
//             )}
//           </div>

//           <div className="md:block fixed md:relative bottom-0 left-0 right-0 p-4 bg-white md:bg-transparent border-t md:border-t-0 border-surface-light">
//             <p className="text-xs text-text-light text-center">Powered by Mira</p>
//           </div>
//         </div>
//       </main>
//     </div>
//   )
// }
'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Header } from '@/components/layout/Header'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useAppContext } from '@/context/useAppContext'
import { HiOutlineCamera, HiOutlinePhotograph } from 'react-icons/hi'

const idTypeLabels: Record<string, string> = {
  'passport': 'Passport',
  'national-id': 'National ID Card',
  'drivers-license': "Driver's License",
}

export default function UploadDocument() {
  const router = useRouter()
  const { state, dispatch } = useAppContext()
  
  const idTypeLabel = state.selectedIdType ? idTypeLabels[state.selectedIdType] || 'ID Document' : 'ID Document'
  const needsBackSide = state.selectedIdType !== 'passport'
  
  const getInitialSide = (): 'front' | 'back' => {
    if (state.documentImageFront && needsBackSide && !state.documentImageBack) {
      return 'back'
    }
    return 'front'
  }
  
  const [currentSide, setCurrentSide] = useState<'front' | 'back'>(getInitialSide())
  const [frontImage, setFrontImage] = useState<string | null>(state.documentImageFront || null)
  const [backImage, setBackImage] = useState<string | null>(state.documentImageBack || null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  
  useEffect(() => {
    // Preload animation (optional, won't break if it fails)
    fetch('/face.json')
      .then(res => res.json())
      .then(() => {
        console.log('Face verification animation preloaded')
      })
      .catch(() => {
        // Silently fail - animation is optional
      })
  }, [])

  useEffect(() => {
    console.log('Document Upload State:', {
      currentSide,
      hasFrontImage: !!frontImage,
      hasBackImage: !!backImage,
      needsBackSide,
    })
  }, [currentSide, frontImage, backImage, needsBackSide])
  
  useEffect(() => {
    if (state.documentImageFront && !frontImage) {
      setFrontImage(state.documentImageFront)
    }
    if (state.documentImageBack && !backImage) {
      setBackImage(state.documentImageBack)
    }
  }, [state.documentImageFront, state.documentImageBack])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIsUploading(true)
      const reader = new FileReader()
      reader.onloadend = () => {
        setTimeout(() => {
          const result = reader.result as string
          if (currentSide === 'front') {
            // Only save front image, don't auto-switch
            setFrontImage(result)
            dispatch({ type: 'SET_DOCUMENT_IMAGE_FRONT', payload: result })
            dispatch({ type: 'SET_DOCUMENT_IMAGE', payload: result })
            console.log('✅ Front image saved. User must click Continue to upload back side.')
          } else if (currentSide === 'back') {
            // Save back image separately
            setBackImage(result)
            dispatch({ type: 'SET_DOCUMENT_IMAGE_BACK', payload: result })
            console.log('✅ Back image saved.')
          }
          setIsUploading(false)
        }, 800)
      }
      reader.readAsDataURL(file)
    }
    // Reset input so user can take a new photo
    if (e.target) {
      e.target.value = ''
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setIsUploading(true)
      const reader = new FileReader()
      reader.onloadend = () => {
        setTimeout(() => {
          const result = reader.result as string
          if (currentSide === 'front') {
            // Only save front image, don't auto-switch
            setFrontImage(result)
            dispatch({ type: 'SET_DOCUMENT_IMAGE_FRONT', payload: result })
            dispatch({ type: 'SET_DOCUMENT_IMAGE', payload: result })
            console.log('✅ Front image saved. User must click Continue to upload back side.')
          } else if (currentSide === 'back') {
            // Save back image separately
            setBackImage(result)
            dispatch({ type: 'SET_DOCUMENT_IMAGE_BACK', payload: result })
            console.log('✅ Back image saved.')
          }
          setIsUploading(false)
        }, 800)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCameraClick = () => {
    cameraInputRef.current?.click()
  }

  const handleFileClick = () => {
    fileInputRef.current?.click()
  }

  const handleContinue = () => {
    console.log('Continue clicked:', { currentSide, hasFrontImage: !!frontImage, hasBackImage: !!backImage, needsBackSide })
    
    // Front side uploaded, switch to back side manually
    if (currentSide === 'front' && needsBackSide && frontImage) {
      console.log('✅ Front image present, switching to back side...')
      // Ensure front image is saved to state
      dispatch({ type: 'SET_DOCUMENT_IMAGE_FRONT', payload: frontImage })
      dispatch({ type: 'SET_DOCUMENT_IMAGE', payload: frontImage })
      
      // Switch to back side - user must take a NEW photo
      setCurrentSide('back')
      
      // Reset file inputs so user can take a fresh photo for back side
      if (fileInputRef.current) fileInputRef.current.value = ''
      if (cameraInputRef.current) cameraInputRef.current.value = ''
      
      // Clear any previous back image
      setBackImage(null)
      
      console.log('✅ Switched to back side - ready for NEW back image upload')
      return
    }
    
    if (currentSide === 'back' && backImage && frontImage) {
      dispatch({ type: 'SET_DOCUMENT_IMAGE_FRONT', payload: frontImage })
      dispatch({ type: 'SET_DOCUMENT_IMAGE_BACK', payload: backImage })
      
      if (!frontImage || frontImage.length < 100) {
        alert('Front image is missing or invalid. Please retake the front side photo.')
        return
      }
      if (!backImage || backImage.length < 100) {
        alert('Back image is missing or invalid. Please retake the back side photo.')
        return
      }
      
      setTimeout(() => {
        router.push('/verify/identity')
      }, 300)
      return
    }
    
    if (currentSide === 'front' && !needsBackSide && frontImage) {
      dispatch({ type: 'SET_DOCUMENT_IMAGE_FRONT', payload: frontImage })
      setTimeout(() => {
        router.push('/verify/identity')
      }, 200)
      return
    }
  }

  const handleRetake = () => {
    if (currentSide === 'front') {
      setFrontImage(null)
      dispatch({ type: 'SET_DOCUMENT_IMAGE_FRONT', payload: '' })
    } else {
      setBackImage(null)
      dispatch({ type: 'SET_DOCUMENT_IMAGE_BACK', payload: '' })
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  const currentImage = currentSide === 'front' ? frontImage : backImage
  const canContinue = currentImage !== null && (currentSide === 'front' || (currentSide === 'back' && frontImage))

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
        <Header showBack showClose />
        <ProgressBar currentStep={4} totalSteps={5} />
      </div>
      
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full md:flex md:items-center md:justify-center md:py-8">
          {/* Mobile Design - Full screen */}
          <div className="md:hidden h-full flex flex-col px-4 pt-8 pb-32">
            {/* Title and Step Info */}
            <div className="mb-6">
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                {idTypeLabel}
              </h1>
              {needsBackSide && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {currentSide === 'front' ? 'Step 1 of 2: Front Side' : 'Step 2 of 2: Back Side'}
                  </p>
                  {currentSide === 'back' && frontImage && (
                    <p className="text-xs text-green-600 font-semibold">
                      ✓ Front side uploaded! Now take a photo of the BACK side.
                    </p>
                  )}
                </div>
              )}
              
              {/* Progress indicator */}
              {needsBackSide && (
                <div className="flex gap-2 mb-4">
                  <div className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${frontImage ? 'bg-gray-900' : 'bg-gray-200'}`} />
                  <div className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${backImage ? 'bg-gray-900' : 'bg-gray-200'}`} />
                </div>
              )}
            </div>

            {/* Upload Area */}
            <div className="flex-1 flex flex-col">
              <div 
                className={`
                  relative w-full aspect-[3/2] rounded-2xl overflow-hidden mb-4 transition-all duration-300
                  ${currentImage ? 'bg-white border border-gray-200' : 'bg-gray-50 border-2 border-dashed border-gray-300'}
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {isUploading ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-white">
                    <div className="scanning-animation mb-4">
                      <svg className="w-16 h-16 text-gray-900 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600 font-medium">Processing document...</p>
                  </div>
                ) : currentImage ? (
                  <div className="relative w-full h-full group">
                    <img
                      src={currentImage}
                      alt={`ID Document ${currentSide}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6">
                    <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm text-gray-500 text-center mb-6">
                      Make sure all information is visible and easy to read
                    </p>

                    <div className="flex flex-col gap-3 w-full">
                      <button
                        onClick={handleCameraClick}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-full font-medium transition-all"
                      >
                        <HiOutlineCamera className="w-5 h-5" />
                        <span>Take Photo</span>
                      </button>
                      <button
                        onClick={handleFileClick}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300 rounded-full font-medium transition-all"
                      >
                        <HiOutlinePhotograph className="w-5 h-5" />
                        <span>Choose File</span>
                      </button>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileChange}
                      className="hidden"
                      aria-label="Take photo with camera"
                    />
                  </div>
                )}
              </div>

              {/* Tips */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
                <h4 className="font-medium text-gray-900 mb-2 text-sm">Tips for best results</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Ensure all information is clearly visible</li>
                  <li>• Use good lighting, avoid shadows</li>
                  <li>• Place document on flat surface</li>
                  <li>• Capture entire document in frame</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Desktop Design - Keep existing */}
          <div className="hidden md:block w-full max-w-md lg:max-w-2xl px-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
              {/* Your existing desktop code here... */}
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                  {idTypeLabel}
                </h1>
                {needsBackSide && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-4">
                      {currentSide === 'front' ? 'Step 1 of 2: Front Side' : 'Step 2 of 2: Back Side'}
                    </p>
                    
                    <div className="flex gap-2 mb-3">
                      <div className={`flex-1 h-1.5 rounded-full transition-all duration-700 ${frontImage ? 'bg-gray-900' : 'bg-gray-200'}`} />
                      <div className={`flex-1 h-1.5 rounded-full transition-all duration-700 ${backImage ? 'bg-gray-900' : 'bg-gray-200'}`} />
                    </div>
                  </div>
                )}

                {currentSide === 'back' && frontImage && (
                  <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                    <p className="text-sm font-semibold text-green-800 mb-3">✓ Front side uploaded! Now take a photo of the BACK side.</p>
                    <img
                      src={frontImage}
                      alt="Front side preview"
                      className="w-full max-w-xs mx-auto rounded-lg border border-gray-200 shadow-sm"
                    />
                  </div>
                )}
              </div>

              <div className="mb-6">
                <div 
                  className={`
                    relative w-full aspect-[3/2] rounded-2xl overflow-hidden mb-4 transition-all
                    ${currentImage ? 'bg-white border border-gray-200' : 'bg-gray-50 border-2 border-dashed border-gray-300'}
                  `}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {isUploading ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-white">
                      <div className="mb-6">
                        <svg className="w-20 h-20 text-gray-900 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-600 font-medium">Processing document...</p>
                    </div>
                  ) : currentImage ? (
                    <div className="relative w-full h-full group">
                      <img
                        src={currentImage}
                        alt={`ID Document ${currentSide}`}
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                        <button
                          onClick={handleRetake}
                          className="opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all duration-300 bg-white text-gray-900 px-6 py-3 rounded-full font-medium shadow-lg"
                        >
                          Retake Photo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6">
                      <svg className="w-24 h-24 text-gray-400 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Upload {currentSide} side
                      </h3>
                      <p className="text-sm text-gray-500 mb-6 text-center max-w-xs">
                        Drag & drop your document or choose a method below
                      </p>

                      <div className="flex gap-3 w-full max-w-sm">
                        <button
                          onClick={handleCameraClick}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-full font-medium transition-all"
                        >
                          <HiOutlineCamera className="w-5 h-5" />
                          <span>Take Photo</span>
                        </button>
                        <button
                          onClick={handleFileClick}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300 rounded-full font-medium transition-all"
                        >
                          <HiOutlinePhotograph className="w-5 h-5" />
                          <span>Choose File</span>
                        </button>
                      </div>

                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                      <input 
                        ref={cameraInputRef} 
                        type="file" 
                        accept="image/*" 
                        capture="environment" 
                        onChange={handleFileChange} 
                        className="hidden"
                        aria-label="Take photo with camera"
                      />
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Tips for best results</h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Ensure all information is clearly visible and readable</li>
                    <li>• Use good lighting and avoid shadows or glare</li>
                    <li>• Place document on a flat, contrasting surface</li>
                    <li>• Capture the entire document within the frame</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={handleContinue} 
                  disabled={!canContinue}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full py-3 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {currentSide === 'front' && needsBackSide && frontImage 
                    ? 'Continue to Back Side →' 
                    : currentSide === 'back' && backImage && frontImage
                    ? 'Continue'
                    : currentSide === 'back' && !backImage
                    ? 'Upload Back Side to Continue'
                    : 'Continue'}
                </Button>
                {currentImage && (
                  <button 
                    onClick={handleRetake}
                    className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-full font-medium"
                  >
                    Retake Photo
                  </button>
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
          {currentImage ? (
            <>
              <Button 
                onClick={handleContinue} 
                disabled={!canContinue}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full py-3 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {currentSide === 'front' && needsBackSide && frontImage 
                  ? 'Continue to Back Side →' 
                  : currentSide === 'back' && backImage && frontImage
                  ? 'Continue'
                  : currentSide === 'back' && !backImage
                  ? 'Upload Back Side to Continue'
                  : 'Continue'}
              </Button>
              <button 
                onClick={handleRetake}
                className="w-full px-6 py-3 bg-gray-100 text-gray-900 rounded-full font-medium"
              >
                Retake Photo
              </button>
            </>
          ) : (
            <Button 
              onClick={handleCameraClick}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full py-3 font-medium"
            >
              Take Photo
            </Button>
          )}
        </div>
        <p className="text-xs text-gray-500 text-center mt-2">Powered by Mira</p>
      </div>
    </div>
  )
}