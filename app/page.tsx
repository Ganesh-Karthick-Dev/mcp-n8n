export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">n8n MCP Server</h1>
          <p className="text-xl text-gray-600 mb-8">
            Model Context Protocol server for automating n8n workflow creation
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">🚀 Quick Setup</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">1. Environment Variables</h3>
                <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                  N8N_BASE_URL=https://your-n8n-instance.com
                  <br />
                  N8N_API_KEY=your-api-key
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-700 mb-2">2. Deploy to Vercel</h3>
                <p className="text-gray-600 text-sm">Deploy this project to get your MCP server URL</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">⚙️ Cursor Configuration</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Add to Cursor Settings</h3>
                <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                  {`{
  "mcpServers": {
    "n8n-automation": {
      "url": "https://your-app.vercel.app/api/mcp"
    }
  }
}`}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">🛠️ Available Tools</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-gray-800">create_webhook_workflow</h3>
                <p className="text-gray-600 text-sm">Create a simple webhook to HTTP request workflow</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-semibold text-gray-800">create_scheduled_workflow</h3>
                <p className="text-gray-600 text-sm">Create workflows that run on a schedule</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="border-l-4 border-orange-500 pl-4">
                <h3 className="font-semibold text-gray-800">list_workflows</h3>
                <p className="text-gray-600 text-sm">List all existing workflows in your n8n instance</p>
              </div>
              <div className="border-l-4 border-red-500 pl-4">
                <h3 className="font-semibold text-gray-800">activate_workflow</h3>
                <p className="text-gray-600 text-sm">Activate workflows by ID</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">💡 Example Usage in Cursor</h2>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-gray-700 mb-2">
                <strong>Simple request:</strong>
              </p>
              <p className="text-gray-600 italic">
                "Create a webhook workflow called 'Contact Form' that receives form submissions and sends them to my
                email service at https://api.emailservice.com/send"
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-gray-700 mb-2">
                <strong>Scheduled task:</strong>
              </p>
              <p className="text-gray-600 italic">
                "Create a daily workflow that checks my website status at 9 AM every day"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
