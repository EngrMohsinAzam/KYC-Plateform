import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL =  'https://xzfjrnv9-3099.asse.devtunnels.ms'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      )
    }

    const response = await fetch(`${API_BASE_URL}/api/kyc/check-status-by-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('Error in check-status-by-email proxy:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to check status' },
      { status: 500 }
    )
  }
}

