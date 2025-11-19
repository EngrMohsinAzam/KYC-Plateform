'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useAppContext } from '@/context/useAppContext'
import { getCountryByValue, getCountryOptions } from '@/lib/countries'

// Simulated OCR/NLP extraction - in production, this would call an OCR API
const extractDocumentInfo = async (frontImage: string, backImage: string | null, idType: string) => {
  // Simulate OCR extraction delay with NLP processing
  return new Promise<{ 
    firstName: string
    lastName: string
    fatherName: string
    idNumber: string
  }>((resolve) => {
    setTimeout(() => {
      // In production, this would:
      // 1. Send images to OCR API (Google Vision, AWS Textract, Azure Form Recognizer, etc.)
      // 2. Extract all text from the document
      // 3. Use NLP/ML to identify and parse structured fields
      // 4. Return extracted data
      
      // For now, we'll extract from the image data URL to simulate
      // In real implementation, you would do:
      // const response = await fetch('/api/ocr', {
      //   method: 'POST',
      //   body: JSON.stringify({ frontImage, backImage, idType })
      // })
      // const data = await response.json()
      
      // Simulated extraction based on document type
      let extractedData = {
        firstName: '',
        lastName: '',
        fatherName: '',
        idNumber: '',
      }

      // Try to extract from image (simulated - in production use real OCR)
      // For CNIC/National ID, typically has: Name, Father's Name, CNIC Number
      // For Passport: Name, Passport Number
      // For License: Name, License Number
      
      // Simulated extraction - replace with real OCR API call
      if (idType === 'national-id' || idType === 'drivers-license') {
        extractedData = {
          firstName: 'Muhammad', // Extracted from document
          lastName: 'Ahmed', // Extracted from document
          fatherName: 'Ali Ahmed', // Extracted from document
          idNumber: '12345-1234567-1', // Extracted CNIC/License number
        }
      } else if (idType === 'passport') {
        extractedData = {
          firstName: 'John',
          lastName: 'Smith',
          fatherName: 'Robert Smith',
          idNumber: 'AB1234567', // Passport number
        }
      }

      resolve(extractedData)
    }, 2000) // Simulate processing time
  })
}

export default function PersonalInfo() {
  const router = useRouter()
  const { state, dispatch } = useAppContext()
  const [loading, setLoading] = useState(true)
  const [extractedData, setExtractedData] = useState<{
    firstName: string
    lastName: string
    fatherName: string
    idNumber: string
  } | null>(null)
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    fatherName: '',
    idNumber: '',
    email: '',
    phone: '',
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Debug: Log selected country and ID type on mount
  useEffect(() => {
    console.log('🔍 ========== PERSONAL INFO PAGE STATE DEBUG ==========')
    console.log('🌍 Selected Country:', state.selectedCountry)
    console.log('🆔 Selected ID Type:', state.selectedIdType)
    console.log('📧 Email in state:', state.personalInfo?.email)
    console.log('📋 Full state:', {
      selectedCountry: state.selectedCountry,
      selectedIdType: state.selectedIdType,
      personalInfo: state.personalInfo
    })
    
    if (state.selectedCountry) {
      const countryOption = getCountryOptions().find(c => c.value === state.selectedCountry)
      console.log('🌍 Country details:', {
        value: state.selectedCountry,
        label: countryOption?.label || 'Not found',
      })
    } else {
      console.warn('⚠️ No country selected in state!')
    }
    
    if (state.selectedIdType) {
      const idTypeLabels: Record<string, string> = {
        'national-id': 'National Identity Card (CNIC)',
        'passport': 'Passport',
        'drivers-license': "Driver's License"
      }
      console.log('🆔 ID Type details:', {
        value: state.selectedIdType,
        label: idTypeLabels[state.selectedIdType] || 'Unknown'
      })
    } else {
      console.error('❌ No ID type selected in state! This is a problem!')
    }
    console.log('🔍 ====================================================')
  }, [state.selectedCountry, state.selectedIdType, state.personalInfo?.email])

  // Initialize email from state when component mounts or when state changes
  useEffect(() => {
    const emailFromState = state.personalInfo?.email || ''
    if (emailFromState) {
      console.log('📧 Setting email from state:', emailFromState)
      setFormData((prev) => {
        // Only update if email is different to avoid unnecessary re-renders
        if (prev.email !== emailFromState) {
          return {
            ...prev,
            email: emailFromState
          }
        }
        return prev
      })
    }
  }, [state.personalInfo?.email])

  useEffect(() => {
    // Simulate OCR/NLP extraction when component mounts
    // Use front image (required) and back image (if available)
    const frontImage = state.documentImageFront || state.documentImage
    const backImage = state.documentImageBack
    
    if (frontImage && state.selectedIdType) {
      extractDocumentInfo(frontImage, backImage || null, state.selectedIdType).then((data) => {
        setExtractedData(data)
        setFormData((prev) => ({
          ...prev,
          firstName: data.firstName,
          lastName: data.lastName,
          fatherName: data.fatherName,
          idNumber: data.idNumber,
        }))
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [state.documentImage, state.documentImageFront, state.documentImageBack, state.selectedIdType])

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone: string) => {
    // Remove all formatting
    const digitsOnly = phone.replace(/\D/g, '')
    const countryCode = getCountryCode()
    const countryCodeDigits = countryCode.replace('+', '')
    
    // Remove country code if included
    const phoneDigits = digitsOnly.startsWith(countryCodeDigits) 
      ? digitsOnly.slice(countryCodeDigits.length)
      : digitsOnly
    
    // Validate based on country
    const error = validatePhoneByCountry(phone, state.selectedCountry || '')
    return error === null
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {}

    // Validate required fields
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }
    if (!formData.fatherName.trim()) {
      newErrors.fatherName = 'Father\'s name is required'
    }
    if (!formData.idNumber.trim()) {
      newErrors.idNumber = 'ID number is required'
    } else {
      // Validate ID number format based on type
      if (state.selectedIdType === 'national-id') {
        // CNIC format: XXXXX-XXXXXXX-X
        const cnicRegex = /^\d{5}-\d{7}-\d{1}$/
        if (!cnicRegex.test(formData.idNumber)) {
          newErrors.idNumber = 'Please enter a valid CNIC number (format: XXXXX-XXXXXXX-X)'
        }
      } else if (state.selectedIdType === 'passport') {
        // Passport format varies, but typically alphanumeric
        if (formData.idNumber.length < 6) {
          newErrors.idNumber = 'Please enter a valid passport number'
        }
      } else if (state.selectedIdType === 'drivers-license') {
        // License format varies
        if (formData.idNumber.length < 5) {
          newErrors.idNumber = 'Please enter a valid license number'
        }
      }
    }
    // Email is read-only, but still validate it exists
    const emailToValidate = formData.email || state.personalInfo?.email || ''
    if (!emailToValidate.trim()) {
      newErrors.email = 'Email is required. Please go back and enter your email.'
    } else if (!validateEmail(emailToValidate)) {
      newErrors.email = 'Please enter a valid email address'
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else {
      const phoneError = validatePhoneByCountry(formData.phone, state.selectedCountry || '')
      if (phoneError) {
        newErrors.phone = phoneError
      } else if (!validatePhone(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number'
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Format phone number with country code for storage
    const phoneDigits = formData.phone.replace(/\D/g, '')
    const countryCode = getCountryCode()
    const countryCodeDigits = countryCode.replace('+', '')
    const phoneWithoutCountryCode = phoneDigits.startsWith(countryCodeDigits)
      ? phoneDigits.slice(countryCodeDigits.length)
      : phoneDigits
    const fullPhoneNumber = countryCode + phoneWithoutCountryCode

    // Save to context - use email from state if formData email is empty (read-only field)
    const emailToSave = formData.email.trim() || state.personalInfo?.email || ''
    dispatch({
      type: 'SET_PERSONAL_INFO',
      payload: {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        fatherName: formData.fatherName.trim(),
        idNumber: formData.idNumber.trim(),
        email: emailToSave,
        phone: fullPhoneNumber, // Store with country code
      },
    })
    
    router.push('/verify/otp-verification')
  }

  // Get country code based on selected country
  const getCountryCode = () => {
    // Extended country code mapping
    const countryCodes: Record<string, string> = {
      // North America
      'us': '+1',
      'ca': '+1',
      'mx': '+52',
      // Europe
      'uk': '+44',
      'de': '+49',
      'fr': '+33',
      'it': '+39',
      'es': '+34',
      'nl': '+31',
      'pl': '+48',
      'ru': '+7',
      // Asia
      'cn': '+86',
      'in': '+91',
      'jp': '+81',
      'kr': '+82',
      'pk': '+92',
      'bd': '+880',
      'id': '+62',
      'th': '+66',
      'vn': '+84',
      'ph': '+63',
      'my': '+60',
      'sg': '+65',
      'ae': '+971',
      'sa': '+966',
      'tr': '+90',
      // Oceania
      'au': '+61',
      'nz': '+64',
      // South America
      'br': '+55',
      'ar': '+54',
      'co': '+57',
      'cl': '+56',
      // Africa
      'eg': '+20',
      'za': '+27',
      'ng': '+234',
      'ke': '+254',
    }
    return countryCodes[state.selectedCountry || ''] || '+1'
  }

  const formatPhoneNumber = (value: string, countryCode: string) => {
    // Remove all non-digit characters (only allow numbers) - STRICT validation
    const digitsOnly = value.replace(/\D/g, '')
    
    // If empty, return empty
    if (!digitsOnly) return ''
    
    // Remove country code from the input if user typed it
    const countryCodeDigits = countryCode.replace('+', '')
    let phoneDigits = digitsOnly
    
    // If user included country code, remove it
    if (digitsOnly.startsWith(countryCodeDigits)) {
      phoneDigits = digitsOnly.slice(countryCodeDigits.length)
    }
    
    // Get max length based on country - STRICT LIMIT
    const maxLength = getMaxPhoneLength(state.selectedCountry || '')
    
    // STRICT: Limit to max length - no more digits allowed
    phoneDigits = phoneDigits.slice(0, maxLength)
    
    // Format based on country
    return formatByCountry(phoneDigits, state.selectedCountry || '')
  }

  const handlePhoneChange = (value: string) => {
    // Only allow digits and formatting characters (spaces, dashes, parentheses)
    const cleaned = value.replace(/[^\d\s\-()]/g, '')
    
    // Get max digits allowed for this country
    const maxDigits = getMaxPhoneLength(state.selectedCountry || '')
    
    // Count actual digits (not formatting characters)
    const digitsOnly = cleaned.replace(/\D/g, '')
    
    // STRICT: If user tries to enter more digits than allowed, reject the extra digits
    if (digitsOnly.length > maxDigits) {
      // User tried to enter too many digits - keep only the allowed amount
      const countryCode = getCountryCode()
      const limitedDigits = digitsOnly.slice(0, maxDigits)
      const formatted = formatByCountry(limitedDigits, state.selectedCountry || '')
      handleChange('phone', formatted)
      
      // Show error if trying to exceed limit
      setErrors((prev) => ({ 
        ...prev, 
        phone: `Phone number cannot exceed ${maxDigits} digits` 
      }))
      return
    }
    
    const countryCode = getCountryCode()
    const formatted = formatPhoneNumber(cleaned, countryCode)
    
    // Real-time validation
    if (formatted) {
      const phoneError = validatePhoneByCountry(formatted, state.selectedCountry || '')
      if (phoneError) {
        setErrors((prev) => ({ ...prev, phone: phoneError }))
      } else {
        setErrors((prev) => ({ ...prev, phone: '' }))
      }
    } else {
      // Clear error if field is empty
      setErrors((prev) => ({ ...prev, phone: '' }))
    }
    
    handleChange('phone', formatted)
  }

  const getMaxPhoneLength = (country: string) => {
    // Maximum phone number length (without country code) by country
    const lengths: Record<string, number> = {
      // North America
      'us': 10, 'ca': 10, 'mx': 10,
      // Europe
      'uk': 10, 'de': 11, 'fr': 9, 'it': 10, 'es': 9, 'nl': 9, 'pl': 9, 'ru': 10,
      // Asia
      'cn': 11, 'in': 10, 'jp': 10, 'kr': 10, 'pk': 10, 'bd': 10, 'id': 10, 'th': 9,
      'vn': 10, 'ph': 10, 'my': 10, 'sg': 8, 'ae': 9, 'sa': 9, 'tr': 10,
      // Oceania
      'au': 9, 'nz': 9,
      // South America
      'br': 11, 'ar': 10, 'co': 10, 'cl': 9,
      // Africa
      'eg': 10, 'za': 9, 'ng': 10, 'ke': 9,
    }
    return lengths[country] || 15 // Default max length
  }

  const formatByCountry = (digits: string, country: string) => {
    // Format phone number based on country format
    if (country === 'us' || country === 'ca') {
      // US/Canada: (XXX) XXX-XXXX
      if (digits.length <= 3) return digits
      if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    } else if (country === 'uk') {
      // UK: XXXX XXX XXX
      if (digits.length <= 4) return digits
      if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`
      return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
    } else if (country === 'pk') {
      // Pakistan: XXXX-XXXXXXX
      if (digits.length <= 4) return digits
      return `${digits.slice(0, 4)}-${digits.slice(4)}`
    } else if (country === 'in') {
      // India: XXXXX XXXXX
      if (digits.length <= 5) return digits
      return `${digits.slice(0, 5)} ${digits.slice(5)}`
    } else if (country === 'br') {
      // Brazil: (XX) XXXXX-XXXX
      if (digits.length <= 2) return digits
      if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
    } else if (country === 'de') {
      // Germany: XXXX XXXXXXX
      if (digits.length <= 4) return digits
      return `${digits.slice(0, 4)} ${digits.slice(4)}`
    } else if (country === 'fr') {
      // France: XX XX XX XX XX
      if (digits.length <= 2) return digits
      if (digits.length <= 4) return `${digits.slice(0, 2)} ${digits.slice(2)}`
      if (digits.length <= 6) return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4)}`
      if (digits.length <= 8) return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6)}`
      return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`
    } else if (country === 'au') {
      // Australia: XXXX XXX XXX
      if (digits.length <= 4) return digits
      if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`
      return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
    } else if (country === 'cn') {
      // China: XXX XXXX XXXX
      if (digits.length <= 3) return digits
      if (digits.length <= 7) return `${digits.slice(0, 3)} ${digits.slice(3)}`
      return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`
    } else if (country === 'jp') {
      // Japan: XX-XXXX-XXXX
      if (digits.length <= 2) return digits
      if (digits.length <= 6) return `${digits.slice(0, 2)}-${digits.slice(2)}`
      return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`
    }
    // Default: just return digits (no formatting)
    return digits
  }

  const validatePhoneByCountry = (phone: string, country: string) => {
    // Remove formatting to get just digits
    const digitsOnly = phone.replace(/\D/g, '')
    const countryCode = getCountryCode()
    const countryCodeDigits = countryCode.replace('+', '')
    
    // Remove country code if included
    const phoneDigits = digitsOnly.startsWith(countryCodeDigits) 
      ? digitsOnly.slice(countryCodeDigits.length)
      : digitsOnly
    
    const minLength = getMinPhoneLength(country)
    const maxLength = getMaxPhoneLength(country)
    
    if (phoneDigits.length < minLength) {
      return `Phone number must be at least ${minLength} digits`
    }
    if (phoneDigits.length > maxLength) {
      return `Phone number must be at most ${maxLength} digits`
    }
    
    return null
  }

  const getMinPhoneLength = (country: string) => {
    // Minimum phone number length by country
    const lengths: Record<string, number> = {
      // North America
      'us': 10, 'ca': 10, 'mx': 10,
      // Europe
      'uk': 10, 'de': 10, 'fr': 9, 'it': 9, 'es': 9, 'nl': 9, 'pl': 9, 'ru': 10,
      // Asia
      'cn': 11, 'in': 10, 'jp': 10, 'kr': 9, 'pk': 10, 'bd': 10, 'id': 9, 'th': 9,
      'vn': 9, 'ph': 10, 'my': 9, 'sg': 8, 'ae': 9, 'sa': 9, 'tr': 10,
      // Oceania
      'au': 9, 'nz': 8,
      // South America
      'br': 10, 'ar': 10, 'co': 10, 'cl': 9,
      // Africa
      'eg': 10, 'za': 9, 'ng': 10, 'ke': 9,
    }
    return lengths[country] || 7
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white md:bg-surface-gray flex flex-col">
        <Header showBack showClose />
        <ProgressBar currentStep={4} totalSteps={5} />
        <main className="flex-1 px-4 md:px-0 pt-6 pb-24 md:flex md:items-center md:justify-center">
          <div className="w-full max-w-md lg:max-w-3xl md:bg-white md:rounded-lg md:shadow-md md:p-6 md:my-8 py-24">
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-accent-blue rounded-full flex items-center justify-center animate-pulse">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-text-secondary">Extracting information from document...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white md:bg-surface-gray flex flex-col">
      <Header showBack showClose />
      <ProgressBar currentStep={4} totalSteps={5} />
      <main className="flex-1 px-4 md:px-0 pt-6 pb-24 md:flex md:items-center md:justify-center">
        <div className="w-full max-w-2xl md:bg-white md:rounded-2xl md:p-6 md:my-8 md:border-[2px] md:border-grey-400">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              Personal Information
            </h1>
            <p className="text-sm text-text-light">
              Please verify and complete your information
            </p>
          </div>

          {/* Selected ID Type Display - Always show, even if empty for debugging */}
          <div className="mt-3 p-3 rounded-md bg-yellow-100 border border-yellow-300 mb-8">
                      <p className="text-xs text-yellow-900 font-medium flex items-start gap-2">
                        <span className="text-base">⚠️</span>
                        <span>
                          <strong>Important:</strong> You selected <strong>{state.selectedIdType === 'national-id' ? 'National Identity Card' : state.selectedIdType === 'passport' ? 'Passport' : "Driver's License"}</strong>. 
                          Please ensure all information you enter matches exactly with this document. 
                          <strong className="text-red-600"> Any mismatch will result in KYC rejection.</strong>
                        </span>
                      </p>
                    </div>
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <Input
                label="First Name"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                error={errors.firstName}
                placeholder="First name"
                required
              />
              <Input
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                error={errors.lastName}
                placeholder="Last name"
                required
              />
            </div>

            <Input
              label="Father's Name"
              value={formData.fatherName}
              onChange={(e) => handleChange('fatherName', e.target.value)}
              error={errors.fatherName}
              placeholder="Father's name"
              required
            />

            <Input
              label={
                state.selectedIdType === 'national-id' ? 'CNIC Number' :
                state.selectedIdType === 'passport' ? 'Passport Number' :
                state.selectedIdType === 'drivers-license' ? "Driver's License Number" :
                'ID Number'
              }
              value={formData.idNumber}
              onChange={(e) => handleChange('idNumber', e.target.value)}
              error={errors.idNumber}
              placeholder={
                state.selectedIdType === 'national-id' ? '12345-1234567-1' :
                state.selectedIdType === 'passport' ? 'AB1234567' :
                state.selectedIdType === 'drivers-license' ? 'DL123456789' :
                'Enter ID number'
              }
              required
            />

            {/* Email Display (Read-only) - Pre-filled from previous step */}
            <div className="w-full">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="px-4 py-3 rounded-lg border-2 border-gray-300 bg-gray-50 text-text-primary w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg"></span>
                    <span className="font-medium text-base text-gray-900">
                      {formData.email || state.personalInfo?.email || 'No email provided'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-600 bg-gray-200 px-2 py-1 rounded-full font-semibold">
                    ✓ Locked
                  </span>
                </div>
              </div>
              
           
            </div>

            {/* Country Display (Read-only) - Show where user lives */}
            <div className="w-full">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Country/Region (Where you live)
              </label>
              {state.selectedCountry ? (
                <>
                  <div className="px-4 py-3 rounded-lg  border-2 border-gray-300 bg-gray-50 text-text-primary w-full">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg"></span>
                        <span className="font-semibold text-base text-gray-900">
                          {(() => {
                            const countryOption = getCountryOptions().find(c => c.value === state.selectedCountry)
                            const countryName = countryOption?.label || state.selectedCountry.toUpperCase()
                            console.log('🌍 Displaying country:', state.selectedCountry, '→', countryName)
                            return countryName
                          })()}
                        </span>
                      </div>
                      <span className="text-xs text-green-700 bg-green-200 px-3 py-1 rounded-full font-semibold">
                        ✓ Selected
                      </span>
                    </div>
                  </div>
                  
                </>
              ) : (
                <div className="px-4 py-3 rounded-lg border-2 border-yellow-300 bg-yellow-50 text-text-primary w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⚠️</span>
                    <p className="text-sm text-yellow-800 font-medium">No country selected. Please go back and select your country.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 w-full">
                <div className="w-20 md:w-24 flex-shrink-0">
                  <div className="px-3 py-3 rounded-lg border border-gray-300 bg-gray-50 text-text-primary text-sm font-medium text-center">
                    {getCountryCode()}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-center">Fixed</p>
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onKeyDown={(e) => {
                      // Prevent non-numeric keys (except backspace, delete, arrow keys, tab)
                      const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Home', 'End']
                      const isNumber = /[0-9]/.test(e.key)
                      const isAllowedKey = allowedKeys.includes(e.key)
                      const isModifier = e.ctrlKey || e.metaKey || e.altKey
                      
                      // STRICT: Check if user is trying to enter more digits than allowed
                      if (isNumber) {
                        const currentDigits = formData.phone.replace(/\D/g, '')
                        const maxDigits = getMaxPhoneLength(state.selectedCountry || '')
                        
                        // If already at max digits, prevent entering more
                        if (currentDigits.length >= maxDigits && !isModifier) {
                          e.preventDefault()
                          setErrors((prev) => ({ 
                            ...prev, 
                            phone: `Phone number cannot exceed ${maxDigits} digits` 
                          }))
                          return
                        }
                      }
                      
                      // Allow numbers, allowed keys, and copy/paste shortcuts
                      if (!isNumber && !isAllowedKey && !isModifier) {
                        e.preventDefault()
                      }
                    }}
                    onPaste={(e) => {
                      // Handle paste - validate and limit digits
                      e.preventDefault()
                      const pastedText = e.clipboardData.getData('text')
                      const digitsOnly = pastedText.replace(/\D/g, '')
                      const maxDigits = getMaxPhoneLength(state.selectedCountry || '')
                      const limitedDigits = digitsOnly.slice(0, maxDigits)
                      
                      if (limitedDigits) {
                        const countryCode = getCountryCode()
                        const formatted = formatByCountry(limitedDigits, state.selectedCountry || '')
                        handlePhoneChange(formatted)
                      }
                    }}
                    placeholder={
                      state.selectedCountry === 'us' || state.selectedCountry === 'ca' 
                        ? '(123) 456-7890'
                        : state.selectedCountry === 'uk'
                        ? '1234 567 890'
                        : state.selectedCountry === 'pk'
                        ? '1234-5678901'
                        : '1234567890'
                    }
                    maxLength={getMaxPhoneLength(state.selectedCountry || '') + 10} // Extra space for formatting chars
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    } bg-white text-text-primary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300`}
                  />
                </div>
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
              )}
              {!errors.phone && formData.phone && (
                <p className="mt-1 text-xs text-green-600">
                  ✓ Valid phone number format
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Country: {state.selectedCountry?.toUpperCase() || 'N/A'} • Format: {getCountryCode()} + {getMaxPhoneLength(state.selectedCountry || '')} digits • Numbers only
              </p>
            </div>
          </div>

          <Button onClick={handleSubmit} className="w-full">
            Continue
          </Button>
        </div>
      </main>
    </div>
  )
}

