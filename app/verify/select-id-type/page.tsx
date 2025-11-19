'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { Header } from '@/components/layout/Header'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Footer } from '@/components/layout/Footer'
import { useAppContext } from '@/context/useAppContext'
import { getCountryOptions, getCitiesForCountry } from '@/lib/countries'

const idTypes = [
  { value: 'passport', label: 'Passport' },
  { value: 'national-id', label: 'National ID Card' },
  { value: 'drivers-license', label: "Driver's License" },
]

export default function SelectIdType() {
  const router = useRouter()
  const { state, dispatch } = useAppContext()
  const [country, setCountry] = useState(state.selectedCountry || '')
  const [city, setCity] = useState(state.selectedCity || '')
  const [idType, setIdType] = useState(state.selectedIdType || '')

  const countryOptions = getCountryOptions()
  const cityOptions = country ? getCitiesForCountry(country) : []

  // Reset city when country changes
  useEffect(() => {
    if (country && country !== state.selectedCountry) {
      setCity('')
      dispatch({ type: 'SET_COUNTRY', payload: country })
    }
  }, [country, state.selectedCountry, dispatch])

  // Update city in context when it changes
  useEffect(() => {
    if (city) {
      dispatch({ type: 'SET_CITY', payload: city })
    }
  }, [city, dispatch])

  const handleNext = () => {
    dispatch({ type: 'SET_COUNTRY', payload: country })
    if (city) {
      dispatch({ type: 'SET_CITY', payload: city })
    }
    dispatch({ type: 'SET_ID_TYPE', payload: idType })
    router.push('/verify/resident-selection')
  }

  const canProceed = country && city && idType

  return (
    <div className="min-h-screen h-screen bg-white flex flex-col overflow-hidden">
      {/* Mobile Header - Simple back and close */}
      <div className="md:hidden">
        <Header showBack showClose />
      </div>
      
      {/* Desktop Header - with progress bar */}
      <div className="hidden md:block">
        <Header showBack showClose />
        <ProgressBar currentStep={1} totalSteps={5} />
      </div>
      
      {/* Scrollable main content area */}
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full md:flex md:items-center md:justify-center md:py-8">
          {/* Mobile Design - Full screen, no card */}
          <div className="md:hidden h-full flex flex-col px-4 pt-6 pb-24">
            {/* Title */}
            <h1 className="text-2xl font-semibold text-gray-900 mb-8">
              Select ID type
            </h1>

            {/* Form Fields */}
            <div className="flex-1 space-y-6">
              {/* Country/region of residence */}
              <div>
                <label className="block text-sm font-normal text-gray-700 mb-2">
                  Country/region of residence
                </label>
                <Select
                  placeholder="Select country/region"
                  options={countryOptions}
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full"
                />
              </div>

               {/* City/Region - Shows when country is selected */}
              {country && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-normal text-gray-700 mb-2">
                    City/Region
                  </label>
                  <Select
                    placeholder="Select city/region"
                    options={cityOptions}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={!country}
                    className="w-full"
                  />
                </div>
              )}

              {/* ID type with red asterisk */}
              <div>
                <label className="block text-sm font-normal text-gray-700 mb-2">
                  ID type
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <Select
                  placeholder="Select ID type"
                  options={idTypes}
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Desktop Design - Card with all fields */}
          <div className="hidden md:block w-full max-w-md lg:max-w-2xl px-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
              {/* Title - Desktop */}
              <div className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                  Select ID type
                </h1>
                <p className="text-gray-600 text-sm">
                  Choose your country, city, and the type of ID you&apos;ll be verifying
                </p>
              </div>

              <div className="space-y-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Country/region of residence
                  </label>
                  <Select
                    placeholder="Select country/region"
                    options={countryOptions}
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                </div>

                 {country && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      City/Region
                    </label>
                    <Select
                      placeholder="Select city/region"
                      options={cityOptions}
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      disabled={!country}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    ID type
                  </label>
                  <Select
                    placeholder="Select ID type"
                    options={idTypes}
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                  />
                </div>
              </div>

              {/* Desktop button */}
              <Button
                onClick={handleNext}
                disabled={!canProceed}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full py-3 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile fixed button at bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <Button
          onClick={handleNext}
          disabled={!canProceed}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full py-3 font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Next
        </Button>
      </div>
    </div>
  )
}