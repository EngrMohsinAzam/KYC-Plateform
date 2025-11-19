'use client'

import { useReducer, ReactNode } from 'react'
import { AppContext, initialState, AppState, Action } from './AppContext'

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload }
    case 'TOGGLE_SIDEBAR':
      return { ...state, isSidebarOpen: !state.isSidebarOpen }
    case 'SET_THEME':
      return { ...state, theme: action.payload }
    case 'SET_VERIFICATION_STEP':
      return { ...state, verificationStep: action.payload }
    case 'SET_COUNTRY':
      return { ...state, selectedCountry: action.payload, selectedCity: undefined } // Reset city when country changes
    case 'SET_CITY':
      return { ...state, selectedCity: action.payload }
    case 'SET_ISSUING_COUNTRY':
      return { ...state, selectedIssuingCountry: action.payload }
    case 'SET_ID_TYPE':
      return { ...state, selectedIdType: action.payload }
    case 'SET_RESIDENT_USA':
      return { ...state, isResidentUSA: action.payload }
    case 'SET_WALLET':
      return { ...state, connectedWallet: action.payload }
    case 'SET_ID_DETAILS':
      return {
        ...state,
        idNumber: action.payload.idNumber,
        estimatedGasFee: action.payload.gasFee,
        blockchain: action.payload.blockchain,
      }
    case 'SET_DOCUMENT_IMAGE':
      return { ...state, documentImage: action.payload }
    case 'SET_DOCUMENT_IMAGE_FRONT':
      return { ...state, documentImageFront: action.payload }
    case 'SET_DOCUMENT_IMAGE_BACK':
      return { ...state, documentImageBack: action.payload }
    case 'SET_SELFIE_IMAGE':
      return { ...state, selfieImage: action.payload }
    case 'SET_PERSONAL_INFO':
      return { ...state, personalInfo: action.payload }
    default:
      return state
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

