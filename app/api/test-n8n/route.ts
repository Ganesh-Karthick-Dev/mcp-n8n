import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.N8N_BASE_URL
  const apiKey = process.env.N8N_API_KEY
  
  // Test basic connection
  try {
    const response = await fetch(`${baseUrl}/api/v1/workflows`, {
      headers: {
        'X-N8N-API-KEY': apiKey || '',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
    
    const data = await response.json()
    
    return NextResponse.json({
      status: 'success',
      baseUrl: baseUrl || 'NOT_SET',
      apiKeySet: !!apiKey,
      apiResponse: response.status,
      workflowCount: data?.data?.length || 0,
      error: response.ok ? null : `${response.status} ${response.statusText}`
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      baseUrl: baseUrl || 'NOT_SET',
      apiKeySet: !!apiKey,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 