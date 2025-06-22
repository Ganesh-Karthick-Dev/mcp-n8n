import { NextResponse } from 'next/server'

export async function POST() {
  const baseUrl = process.env.N8N_BASE_URL
  const apiKey = process.env.N8N_API_KEY
  
  // Create workflow with exact MCP structure  
  const workflow = {
    name: "ganeshTestMCP",
    nodes: [
      {
        parameters: {
          rule: {
            interval: [
              {
                field: "cronExpression",
                cronExpression: "*/5 * * * *",
              },
            ],
          },
        },
        id: crypto.randomUUID(),
        name: "Schedule Trigger",
        type: "n8n-nodes-base.scheduleTrigger",
        typeVersion: 1,
        position: [240, 300],
      },
      {
        parameters: {
          url: "https://httpbin.org/get",
          sendQuery: false,
          sendHeaders: false,
          sendBody: false,
          options: {}
        },
        id: crypto.randomUUID(),
        name: "HTTP Request",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4,
        position: [460, 300],
      },
    ],
    connections: {
      "Schedule Trigger": {
        main: [
          [
            {
              node: "HTTP Request",
              type: "main",
              index: 0,
            },
          ],
        ],
      },
    },
    settings: {
      executionOrder: "v1",
    },
    staticData: {},
  }
  
  try {
    console.log('Creating MCP-style workflow:', JSON.stringify(workflow, null, 2))
    
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
    console.log('MCP test response:', response.status, responseText)
    
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
    console.error('Error creating MCP-style workflow:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 