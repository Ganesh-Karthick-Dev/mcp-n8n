import { z } from "zod"
import { createMcpHandler } from "@vercel/mcp-adapter"

// n8n API client
class N8nClient {
  private baseUrl: string
  private apiKey: string

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "")
    this.apiKey = apiKey
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}/api/v1${endpoint}`
    console.log(`Making request to: ${url}`)
    
    const response = await fetch(url, {
      ...options,
      headers: {
        "X-N8N-API-KEY": this.apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`n8n API error: ${response.status} ${response.statusText}`, errorText)
      throw new Error(`n8n API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async createWorkflow(workflow: any) {
    return this.request("/workflows", {
      method: "POST",
      body: JSON.stringify(workflow),
    })
  }

  async getWorkflows() {
    return this.request("/workflows")
  }

  async activateWorkflow(workflowId: string) {
    return this.request(`/workflows/${workflowId}/activate`, {
      method: "POST",
    })
  }

  async getCredentials() {
    return this.request("/credentials")
  }
}

const handler = createMcpHandler(
  (server) => {
    console.log('MCP Handler initialized with:', {
      baseUrl: process.env.N8N_BASE_URL || "NOT_SET",
      apiKeySet: !!process.env.N8N_API_KEY
    })
    const n8nClient = new N8nClient(process.env.N8N_BASE_URL || "http://localhost:5678", process.env.N8N_API_KEY || "")

    // Tool to create a simple webhook to HTTP request workflow
    server.tool(
      "create_webhook_workflow",
      "Creates a basic webhook to HTTP request workflow in n8n",
      {
        name: z.string().describe("Name of the workflow"),
        webhookPath: z.string().describe('Webhook path (e.g., "my-webhook")'),
        targetUrl: z.string().url().describe("Target URL to send HTTP request to"),
        method: z.enum(["GET", "POST", "PUT", "DELETE"]).default("POST"),
        description: z.string().optional().describe("Workflow description"),
      },
      async ({ name, webhookPath, targetUrl, method, description }) => {
        try {
          const webhookId = crypto.randomUUID()
          
          const workflow = {
            name,
            nodes: [
              {
                parameters: {
                  path: webhookPath,
                  options: {},
                },
                id: webhookId,
                name: "Webhook",
                type: "n8n-nodes-base.webhook",
                typeVersion: 1,
                position: [240, 300],
                webhookId: webhookId,
              },
              {
                parameters: {
                  url: targetUrl,
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
              "Webhook": {
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

          if (description) {
            workflow.nodes.push({
              parameters: {
                content: description,
                height: 80,
                width: 150
              },
              id: crypto.randomUUID(),
              name: "Sticky Note",
              type: "n8n-nodes-base.stickyNote",
              typeVersion: 1,
              position: [240, 200],
            })
          }

          const result = await n8nClient.createWorkflow(workflow)

          return {
            content: [
              {
                type: "text",
                text: `✅ Workflow "${name}" created successfully!\n\nWorkflow ID: ${result.id}\nWebhook URL: ${process.env.N8N_BASE_URL}/webhook/${webhookPath}\n\nThe workflow will receive webhooks and forward them to: ${targetUrl}`,
              },
            ],
          }
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `❌ Failed to create workflow: ${error instanceof Error ? error.message : "Unknown error"}`,
              },
            ],
          }
        }
      },
    )

    // Tool to create a scheduled workflow
    server.tool(
      "create_scheduled_workflow",
      "Creates a scheduled workflow that runs at specified intervals",
      {
        name: z.string().describe("Name of the workflow"),
        cronExpression: z.string().describe('Cron expression for scheduling (e.g., "0 9 * * *" for daily at 9 AM)'),
        targetUrl: z.string().url().describe("URL to call on schedule"),
        method: z.enum(["GET", "POST", "PUT", "DELETE"]).default("GET"),
        description: z.string().optional().describe("Workflow description"),
      },
      async ({ name, cronExpression, targetUrl, method, description }) => {
        try {
          console.log('Creating scheduled workflow:', { name, cronExpression, targetUrl, method, description })
          const workflow = {
            name,
            nodes: [
              {
                parameters: {
                  rule: {
                    interval: [
                      {
                        field: "cronExpression",
                        cronExpression,
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
                  url: targetUrl,
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

          if (description) {
            workflow.nodes.push({
              parameters: {
                content: description,
                height: 80,
                width: 150
              },
              id: crypto.randomUUID(),
              name: "Sticky Note",
              type: "n8n-nodes-base.stickyNote",
              typeVersion: 1,
              position: [240, 200],
            })
          }

          const result = await n8nClient.createWorkflow(workflow)

          return {
            content: [
              {
                type: "text",
                text: `✅ Scheduled workflow "${name}" created successfully!\n\nWorkflow ID: ${result.id}\nSchedule: ${cronExpression}\nTarget URL: ${targetUrl}\n\n⚠️ Remember to activate the workflow to start the schedule.`,
              },
            ],
          }
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `❌ Failed to create scheduled workflow: ${error instanceof Error ? error.message : "Unknown error"}`,
              },
            ],
          }
        }
      },
    )

    // Tool to list existing workflows
    server.tool("list_workflows", "Lists all workflows in the n8n instance", {
      random_string: z.string().describe("Dummy parameter for no-parameter tools")
    }, async () => {
      try {
        const workflows = await n8nClient.getWorkflows()

        const workflowList = workflows.data
          .map(
            (workflow: any) =>
              `• ${workflow.name} (ID: ${workflow.id}) - ${workflow.active ? "🟢 Active" : "🔴 Inactive"}`,
          )
          .join("\n")

        return {
          content: [
            {
              type: "text",
              text: `📋 Your n8n Workflows:\n\n${workflowList || "No workflows found."}`,
            },
          ],
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Failed to fetch workflows: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
        }
      }
    })

    // Tool to activate a workflow
    server.tool(
      "activate_workflow",
      "Activates a workflow by ID",
      {
        workflowId: z.string().describe("The ID of the workflow to activate"),
      },
      async ({ workflowId }) => {
        try {
          await n8nClient.activateWorkflow(workflowId)

          return {
            content: [
              {
                type: "text",
                text: `✅ Workflow ${workflowId} has been activated successfully!`,
              },
            ],
          }
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `❌ Failed to activate workflow: ${error instanceof Error ? error.message : "Unknown error"}`,
              },
            ],
          }
        }
      },
    )
  },
  {},
  { basePath: "/api" },
)

export { handler as GET, handler as POST, handler as DELETE }
