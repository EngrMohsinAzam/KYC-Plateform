// 'use client'

// import { useState } from 'react'
// import { useRouter } from 'next/navigation'
// import { Button } from '@/components/ui/Button'
// import { RadioButton } from '@/components/ui/RadioButton'
// import { Header } from '@/components/layout/Header'
// import { ProgressBar } from '@/components/ui/ProgressBar'
// import { useAppContext } from '@/context/useAppContext'
// import { FaGlobeAmericas } from 'react-icons/fa'

// export default function ResidentSelection() {
//   const router = useRouter()
//   const { state, dispatch } = useAppContext()
//   const [selected, setSelected] = useState<string>(
//     state.isResidentUSA !== undefined
//       ? state.isResidentUSA ? 'usa' : 'other'
//       : ''
//   )

//   const handleContinue = () => {
//     dispatch({ type: 'SET_RESIDENT_USA', payload: selected === 'usa' })
//     router.push('/verify/identity')
//   }

//   return (
//     <div className="min-h-screen h-screen bg-white flex flex-col overflow-hidden">
//       {/* Mobile Header - Simple back and close */}
//       <div className="md:hidden">
//         <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
//           <button onClick={() => router.back()} className="p-2">
//             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
//             </svg>
//           </button>
//           <button onClick={() => router.push('/')} className="p-2">
//             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//             </svg>
//           </button>
//         </div>
//       </div>

//       {/* Desktop Header */}
//       <div className="hidden md:block">
//         <Header showBack showClose />
//         <ProgressBar currentStep={2} totalSteps={5} />
//       </div>
      
//       {/* Scrollable main content */}
//       <main className="flex-1 overflow-y-auto">
//         <div className="min-h-full md:flex md:items-center md:justify-center md:py-16">
//           {/* Mobile Design - Full screen, centered content */}
//           <div className="md:hidden h-full flex flex-col px-4 pt-12 pb-32">
//             {/* Globe Icon - Mobile only */}
//             <div className="flex justify-center mb-8">
//               <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
//                 <FaGlobeAmericas className="w-8 h-8 text-gray-400" />
//               </div>
//             </div>

//             {/* Title - Centered on mobile */}
//             <h1 className="text-lg font-medium text-gray-900 text-center mb-8">
//               I'm a resident of or live in:
//             </h1>

//             {/* Radio Options */}
//             <div className="space-y-3 flex-1">
//               {/* All countries except USA */}
//               <label
//                 htmlFor="other"
//                 className={`
//                   flex items-center justify-between w-full p-4 border rounded-lg cursor-pointer transition-all
//                   ${selected === 'other' 
//                     ? 'border-gray-900 bg-white' 
//                     : 'border-gray-200 bg-white hover:border-gray-300'
//                   }
//                 `}
//               >
//                 <div className="flex items-center gap-3">
//                   <div className="text-gray-400 text-xl">
//                     🌍
//                   </div>
//                   <span className="text-gray-700 font-normal text-sm">
//                     All countries except USA
//                   </span>
//                 </div>
//                 <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
//                   selected === 'other' ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
//                 }`}>
//                   {selected === 'other' && (
//                     <div className="w-2 h-2 rounded-full bg-white"></div>
//                   )}
//                 </div>
//                 <input
//                   type="radio"
//                   id="other"
//                   name="residence"
//                   value="other"
//                   checked={selected === 'other'}
//                   onChange={(e) => setSelected(e.target.value)}
//                   className="hidden"
//                 />
//               </label>

//               {/* United States of America */}
//               <label
//                 htmlFor="usa"
//                 className={`
//                   flex items-center justify-between w-full p-4 border rounded-lg cursor-pointer transition-all
//                   ${selected === 'usa' 
//                     ? 'border-gray-900 bg-white' 
//                     : 'border-gray-200 bg-white hover:border-gray-300'
//                   }
//                 `}
//               >
//                 <div className="flex items-center gap-3">
//                   <span className="text-gray-600 text-xs font-semibold w-6 text-center">
//                     US
//                   </span>
//                   <span className="text-gray-700 font-normal text-sm">
//                     United States of America
//                   </span>
//                 </div>
//                 <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
//                   selected === 'usa' ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
//                 }`}>
//                   {selected === 'usa' && (
//                     <div className="w-2 h-2 rounded-full bg-white"></div>
//                   )}
//                 </div>
//                 <input
//                   type="radio"
//                   id="usa"
//                   name="residence"
//                   value="usa"
//                   checked={selected === 'usa'}
//                   onChange={(e) => setSelected(e.target.value)}
//                   className="hidden"
//                 />
//               </label>
//             </div>
//           </div>

//           {/* Desktop Design - Card with all content */}
//           <div className="hidden md:block w-full max-w-md lg:max-w-2xl px-4">
//             <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
//               {/* Title - Desktop */}
//               <div className="mb-8 text-left">
//                 <h1 className="text-2xl font-medium text-gray-900">
//                   I'm a resident of or live in:
//                 </h1>
//               </div>

//               {/* Radio Options - Desktop */}
//               <div className="space-y-3 mb-8">
//                 {/* All countries except USA */}
//                 <label
//                   htmlFor="other-desktop"
//                   className={`
//                     flex items-center justify-between w-full p-4 border rounded-lg cursor-pointer transition-all
//                     ${selected === 'other' 
//                       ? 'border-gray-900 bg-white' 
//                       : 'border-gray-200 bg-white hover:border-gray-300'
//                     }
//                   `}
//                 >
//                   <div className="flex items-center gap-3">
//                     <div className="text-gray-400 text-xl">
//                       🌍
//                     </div>
//                     <span className="text-gray-700 font-normal">
//                       All countries except USA
//                     </span>
//                   </div>
//                   <input
//                     type="radio"
//                     id="other-desktop"
//                     name="residence"
//                     value="other"
//                     checked={selected === 'other'}
//                     onChange={(e) => setSelected(e.target.value)}
//                     className="w-5 h-5 text-gray-900 border-gray-300 focus:ring-gray-900"
//                   />
//                 </label>

//                 {/* United States of America */}
//                 <label
//                   htmlFor="usa-desktop"
//                   className={`
//                     flex items-center justify-between w-full p-4 border rounded-lg cursor-pointer transition-all
//                     ${selected === 'usa' 
//                       ? 'border-gray-900 bg-white' 
//                       : 'border-gray-200 bg-white hover:border-gray-300'
//                     }
//                   `}
//                 >
//                   <div className="flex items-center gap-3">
//                     <span className="text-gray-500 text-sm font-semibold">
//                       US
//                     </span>
//                     <span className="text-gray-700 font-normal">
//                       United States of America
//                     </span>
//                   </div>
//                   <input
//                     type="radio"
//                     id="usa-desktop"
//                     name="residence"
//                     value="usa"
//                     checked={selected === 'usa'}
//                     onChange={(e) => setSelected(e.target.value)}
//                     className="w-5 h-5 text-gray-900 border-gray-300 focus:ring-gray-900"
//                   />
//                 </label>
//               </div>

//               {/* Desktop Button */}
//               <Button 
//                 onClick={handleContinue} 
//                 disabled={!selected} 
//                 className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full py-3 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
//               >
//                 Continue
//               </Button>
//               <p className="text-xs text-gray-500 text-center mt-3">
//                 Powered by Mira
//               </p>
//             </div>
//           </div>
//         </div>
//       </main>

//       {/* Mobile Fixed Button */}
//       <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg">
//         <Button 
//           onClick={handleContinue} 
//           disabled={!selected} 
//           className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full py-3 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
//         >
//           Continue
//         </Button>
//         <p className="text-xs text-gray-500 text-center mt-2">
//           Powered by Mira
//         </p>
//       </div>
//     </div>
//   )
// }
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { RadioButton } from '@/components/ui/RadioButton'
import { Header } from '@/components/layout/Header'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useAppContext } from '@/context/useAppContext'
import { CiGlobe } from "react-icons/ci";

export default function ResidentSelection() {
  const router = useRouter()
  const { state, dispatch } = useAppContext()
  
  // Check if selected country is USA (value is 'us' in countries.ts)
  const isUSACountry = state.selectedCountry?.toLowerCase() === 'us' || 
                       state.selectedCountry === 'US' || 
                       state.selectedCountry === 'USA' || 
                       state.selectedCountry === 'United States'
  
  // If country is selected and it's NOT USA, pre-select "other" and disable selection
  const isPreSelected = state.selectedCountry && !isUSACountry
  const isDisabled = isPreSelected
  
  const [selected, setSelected] = useState<string>(() => {
    // If already set in state, use that
    if (state.isResidentUSA !== undefined) {
      return state.isResidentUSA ? 'usa' : 'other'
    }
    // Auto-select "other" if country is not USA and country is selected
    if (isPreSelected) {
      // Also save to state so it persists
      dispatch({ type: 'SET_RESIDENT_USA', payload: false })
      return 'other'
    }
    // Auto-select "usa" if country is USA
    if (isUSACountry) {
      dispatch({ type: 'SET_RESIDENT_USA', payload: true })
      return 'usa'
    }
    return ''
  })

  const handleContinue = () => {
    dispatch({ type: 'SET_RESIDENT_USA', payload: selected === 'usa' })
    router.push('/verify/identity')
  }

  // Update selection when country changes
  useEffect(() => {
    if (isPreSelected && selected !== 'other') {
      setSelected('other')
      dispatch({ type: 'SET_RESIDENT_USA', payload: false })
    } else if (isUSACountry && selected !== 'usa' && state.selectedCountry) {
      setSelected('usa')
      dispatch({ type: 'SET_RESIDENT_USA', payload: true })
    }
  }, [state.selectedCountry, isPreSelected, isUSACountry, selected, dispatch])

  const handleSelect = (value: string) => {
    // Don't allow changing if pre-selected (non-USA country)
    if (isDisabled) {
      return // Prevent any changes
    }
    setSelected(value)
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
        <Header showBack showClose />
        <ProgressBar currentStep={2} totalSteps={5} />
      </div>
      
      {/* Scrollable main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full md:flex md:items-center md:justify-center md:py-16">
       
          {/* Mobile Design - Full screen, centered content */}
          <div className="md:hidden h-full flex flex-col px-4 pt-12 pb-32">
          <div className="flex justify-center items-center mb-8">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                <CiGlobe className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            {/* Globe Icon - Mobile only */}
         

            {/* Title - Centered on mobile */}
            <h1 className="text-lg font-medium text-gray-900 text-center mb-8">
              I&apos;m a resident of or live in:
            </h1>

            {/* Radio Options */}
            <div className="space-y-3 flex-1">
              {/* All countries except USA */}
              <button
                onClick={() => handleSelect('other')}
                disabled={isDisabled && selected === 'other'}
                className={`
                  flex items-center justify-between w-full p-4 border rounded-lg transition-all
                  ${selected === 'other' 
                    ? 'border-gray-900 bg-white' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
                  }
                  ${isDisabled && selected === 'other' ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <CiGlobe className="w-4 h-4 text-gray-500" />
                  </div>
                  <span className="text-gray-700 font-normal text-sm">
                    All countries except USA
                  </span>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  selected === 'other' ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
                }`}>
                  {selected === 'other' && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>
              </button>

              {/* United States of America */}
              <button
                onClick={() => handleSelect('usa')}
                disabled={isDisabled}
                className={`
                  flex items-center justify-between w-full p-4 border rounded-lg transition-all
                  ${selected === 'usa' 
                    ? 'border-gray-900 bg-white' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
                  }
                  ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-600 text-xs font-bold">US</span>
                  </div>
                  <span className="text-gray-700 font-normal text-sm">
                    United States of America
                  </span>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  selected === 'usa' ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
                }`}>
                  {selected === 'usa' && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Desktop Design - Card with all content */}
          <div className="hidden md:block w-full max-w-md lg:max-w-2xl px-4">
            
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <div className="flex justify-center items-center mb-8">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                <CiGlobe className="w-8 h-8 text-gray-400" />
              </div>
            </div>
              {/* Title - Desktop */}
              <div className="mb-8 text-left">
                <h1 className="text-2xl font-medium text-gray-900">
                  I&apos;m a resident of or live in:
                </h1>
              </div>

              {/* Radio Options - Desktop */}
              <div className="space-y-3 mb-8">
                {/* All countries except USA */}
                <button
                  onClick={() => handleSelect('other')}
                  disabled={isDisabled && selected === 'other'}
                  className={`
                    flex items-center justify-between w-full p-4 border rounded-lg transition-all
                    ${selected === 'other' 
                      ? 'border-gray-900 bg-white' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                    }
                    ${isDisabled && selected === 'other' ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <CiGlobe className="w-4 h-4 text-gray-500" />
                    </div>
                    <span className="text-gray-700 font-normal">
                      All countries except USA
                    </span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    selected === 'other' ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
                  }`}>
                    {selected === 'other' && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                </button>

                {/* United States of America */}
                <button
                  onClick={() => handleSelect('usa')}
                  disabled={isDisabled}
                  className={`
                    flex items-center justify-between w-full p-4 border rounded-lg transition-all
                    ${selected === 'usa' 
                      ? 'border-gray-900 bg-white' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                    }
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-600 text-xs font-bold">US</span>
                    </div>
                    <span className="text-gray-700 font-normal">
                      United States of America
                    </span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    selected === 'usa' ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
                  }`}>
                    {selected === 'usa' && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                </button>
              </div>

              {/* Desktop Button */}
              <Button 
                onClick={handleContinue} 
                disabled={!selected} 
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
          disabled={!selected} 
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