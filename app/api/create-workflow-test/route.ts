import { NextResponse } from 'next/server'

export async function POST() {
  const baseUrl = process.env.N8N_BASE_URL
  const apiKey = process.env.N8N_API_KEY
  
  // Create minimal test workflow
  const workflow = {
    name: "ganeshTest",
    nodes: [
      {
        parameters: {
          rule: {
            interval: [
              {
                field: "cronExpression",
                cronExpression: "*/5 * * * *"
              }
            ]
          }
        },
        id: "schedule-trigger-" + Date.now(),
        name: "Schedule Trigger",
        type: "n8n-nodes-base.scheduleTrigger",
        typeVersion: 1,
        position: [240, 300]
      },
      {
        parameters: {
          url: "https://httpbin.org/get",
          options: {}
        },
        id: "http-request-" + Date.now(),
        name: "HTTP Request",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4,
        position: [460, 300]
      }
    ],
    connections: {
      "Schedule Trigger": {
        main: [
          [
            {
              node: "HTTP Request",
              type: "main",
              index: 0
            }
          ]
        ]
      }
    },
    settings: {
      executionOrder: "v1"
    },
    staticData: {}
  }
  
  try {
    console.log('Attempting to create workflow:', JSON.stringify(workflow, null, 2))
    
    const response = await fetch(`${baseUrl}/api/v1/workflows`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': apiKey || '',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(workflow)
    })
    
    const responseText = await response.text()
    console.log('Response status:', response.status)
    console.log('Response text:', responseText)
    
    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = responseText
    }
    
    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      response: responseData,
      workflow: workflow
    })
  } catch (error) {
    console.error('Error creating workflow:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 