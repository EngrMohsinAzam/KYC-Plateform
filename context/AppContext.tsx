import { createContext, useContext } from 'react'

export interface User {
  id: string
  email?: string
  name?: string
  verificationStatus: 'unverified' | 'pending' | 'verified'
  anonymousId?: string
}

export interface AppState {
  user: User | null
  theme: 'light' | 'dark'
  isSidebarOpen: boolean
  verificationStep: number
  selectedCountry?: string
  selectedCity?: string
  selectedIssuingCountry?: string
  selectedIdType?: string
  isResidentUSA?: boolean
  connectedWallet?: string
  idNumber?: string
  estimatedGasFee?: string
  blockchain?: string
  documentImage?: string
  documentImageFront?: string
  documentImageBack?: string
  selfieImage?: string
  personalInfo?: {
    firstName: string
    lastName: string
    fatherName: string
    idNumber: string
    email: string
    phone: string
  }
}

export type Action =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'SET_VERIFICATION_STEP'; payload: number }
  | { type: 'SET_COUNTRY'; payload: string }
  | { type: 'SET_CITY'; payload: string }
  | { type: 'SET_ISSUING_COUNTRY'; payload: string }
  | { type: 'SET_ID_TYPE'; payload: string }
  | { type: 'SET_RESIDENT_USA'; payload: boolean }
  | { type: 'SET_WALLET'; payload: string }
  | { type: 'SET_ID_DETAILS'; payload: { idNumber: string; gasFee: string; blockchain: string } }
  | { type: 'SET_DOCUMENT_IMAGE'; payload: string }
  | { type: 'SET_DOCUMENT_IMAGE_FRONT'; payload: string }
  | { type: 'SET_DOCUMENT_IMAGE_BACK'; payload: string }
  | { type: 'SET_SELFIE_IMAGE'; payload: string }
  | { type: 'SET_PERSONAL_INFO'; payload: { firstName: string; lastName: string; fatherName: string; idNumber: string; email: string; phone: string } }

export const initialState: AppState = {
  user: null,
  theme: 'light',
  isSidebarOpen: false,
  verificationStep: 0,
}

export const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<Action>
} | undefined>(undefined)

export function useAppContext() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}

