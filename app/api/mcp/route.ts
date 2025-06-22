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
    const response = await fetch(url, {
      ...options,
      headers: {
        "X-N8N-API-KEY": this.apiKey,
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    if (!response.ok) {
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
          const workflow = {
            name,
            nodes: [
              {
                parameters: {
                  path: webhookPath,
                  options: {},
                },
                id: "webhook-node",
                name: "Webhook",
                type: "n8n-nodes-base.webhook",
                typeVersion: 1,
                position: [240, 300],
                webhookId: crypto.randomUUID(),
              },
              {
                parameters: {
                  url: targetUrl,
                  options: {},
                  requestMethod: method,
                },
                id: "http-request-node",
                name: "HTTP Request",
                type: "n8n-nodes-base.httpRequest",
                typeVersion: 4.1,
                position: [460, 300],
              },
            ],
            connections: {
              Webhook: {
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
            active: false,
            settings: {
              executionOrder: "v1",
            },
            meta: {
              templateCredsSetupCompleted: true,
            },
            ...(description && { notes: description }),
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
                id: "schedule-trigger",
                name: "Schedule Trigger",
                type: "n8n-nodes-base.scheduleTrigger",
                typeVersion: 1.1,
                position: [240, 300],
              },
              {
                parameters: {
                  url: targetUrl,
                  options: {},
                  requestMethod: method,
                },
                id: "http-request-node",
                name: "HTTP Request",
                type: "n8n-nodes-base.httpRequest",
                typeVersion: 4.1,
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
            active: false,
            settings: {
              executionOrder: "v1",
            },
            meta: {
              templateCredsSetupCompleted: true,
            },
            ...(description && { notes: description }),
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
    server.tool("list_workflows", "Lists all workflows in the n8n instance", {}, async () => {
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

    // Tool to create a complex workflow with multiple nodes
    server.tool(
      "create_complex_workflow",
      "Creates a more complex workflow with multiple processing steps",
      {
        name: z.string().describe("Name of the workflow"),
        triggerType: z.enum(["webhook", "schedule", "manual"]).describe("Type of trigger"),
        webhookPath: z.string().optional().describe("Webhook path (required if triggerType is webhook)"),
        cronExpression: z.string().optional().describe("Cron expression (required if triggerType is schedule)"),
        steps: z
          .array(
            z.object({
              type: z.enum(["http", "code", "filter", "set"]),
              name: z.string(),
              config: z.record(z.any()),
            }),
          )
          .describe("Array of processing steps"),
        description: z.string().optional().describe("Workflow description"),
      },
      async ({ name, triggerType, webhookPath, cronExpression, steps, description }) => {
        try {
          const nodes: any[] = []
          const connections: any = {}
          let nodeCounter = 0

          // Create trigger node
          let triggerNode: any
          if (triggerType === "webhook") {
            if (!webhookPath) throw new Error("webhookPath is required for webhook trigger")
            triggerNode = {
              parameters: {
                path: webhookPath,
                options: {},
              },
              id: "trigger-node",
              name: "Webhook Trigger",
              type: "n8n-nodes-base.webhook",
              typeVersion: 1,
              position: [240, 300],
              webhookId: crypto.randomUUID(),
            }
          } else if (triggerType === "schedule") {
            if (!cronExpression) throw new Error("cronExpression is required for schedule trigger")
            triggerNode = {
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
              id: "trigger-node",
              name: "Schedule Trigger",
              type: "n8n-nodes-base.scheduleTrigger",
              typeVersion: 1.1,
              position: [240, 300],
            }
          } else {
            triggerNode = {
              parameters: {},
              id: "trigger-node",
              name: "Manual Trigger",
              type: "n8n-nodes-base.manualTrigger",
              typeVersion: 1,
              position: [240, 300],
            }
          }

          nodes.push(triggerNode)
          let previousNodeName = triggerNode.name

          // Create processing nodes
          steps.forEach((step, index) => {
            nodeCounter++
            const nodeId = `node-${nodeCounter}`
            let node: any

            switch (step.type) {
              case "http":
                node = {
                  parameters: {
                    url: step.config.url || "",
                    requestMethod: step.config.method || "GET",
                    options: step.config.options || {},
                  },
                  id: nodeId,
                  name: step.name,
                  type: "n8n-nodes-base.httpRequest",
                  typeVersion: 4.1,
                  position: [240 + (index + 1) * 220, 300],
                }
                break
              case "code":
                node = {
                  parameters: {
                    jsCode: step.config.code || "return items;",
                  },
                  id: nodeId,
                  name: step.name,
                  type: "n8n-nodes-base.code",
                  typeVersion: 2,
                  position: [240 + (index + 1) * 220, 300],
                }
                break
              case "filter":
                node = {
                  parameters: {
                    conditions: {
                      options: {
                        caseSensitive: true,
                        leftValue: "",
                        typeValidation: "strict",
                      },
                      conditions: step.config.conditions || [],
                      combinator: step.config.combinator || "and",
                    },
                  },
                  id: nodeId,
                  name: step.name,
                  type: "n8n-nodes-base.filter",
                  typeVersion: 2,
                  position: [240 + (index + 1) * 220, 300],
                }
                break
              case "set":
                node = {
                  parameters: {
                    assignments: {
                      assignments: step.config.assignments || [],
                    },
                    options: {},
                  },
                  id: nodeId,
                  name: step.name,
                  type: "n8n-nodes-base.set",
                  typeVersion: 3.3,
                  position: [240 + (index + 1) * 220, 300],
                }
                break
              default:
                throw new Error(`Unsupported step type: ${step.type}`)
            }

            nodes.push(node)

            // Create connection from previous node
            if (!connections[previousNodeName]) {
              connections[previousNodeName] = { main: [[]] }
            }
            connections[previousNodeName].main[0].push({
              node: step.name,
              type: "main",
              index: 0,
            })

            previousNodeName = step.name
          })

          const workflow = {
            name,
            nodes,
            connections,
            active: false,
            settings: {
              executionOrder: "v1",
            },
            meta: {
              templateCredsSetupCompleted: true,
            },
            ...(description && { notes: description }),
          }

          const result = await n8nClient.createWorkflow(workflow)

          return {
            content: [
              {
                type: "text",
                text: `✅ Complex workflow "${name}" created successfully!\n\nWorkflow ID: ${result.id}\nTrigger: ${triggerType}\nSteps: ${steps.length}\n\n${triggerType === "webhook" ? `Webhook URL: ${process.env.N8N_BASE_URL}/webhook/${webhookPath}` : ""}\n\n⚠️ Remember to activate the workflow if needed.`,
              },
            ],
          }
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `❌ Failed to create complex workflow: ${error instanceof Error ? error.message : "Unknown error"}`,
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
