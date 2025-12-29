import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'

const app = new Hono()
const port = 3031

// Enable CORS
app.use('/*', cors())

// Ollama configuration
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:8b'

// Health check endpoint
app.get('/health', async (c) => {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`)
    const isHealthy = response.ok
    
    return c.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      ollamaUrl: OLLAMA_BASE_URL,
      model: DEFAULT_MODEL,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return c.json({
      status: 'unhealthy',
      error: error.message,
      ollamaUrl: OLLAMA_BASE_URL,
      timestamp: new Date().toISOString()
    }, 503)
  }
})

// Generate completion
app.post('/generate', async (c) => {
  try {
    const { prompt, model = DEFAULT_MODEL, options = {} } = await c.req.json()

    if (!prompt) {
      return c.json({ error: 'Prompt is required' }, 400)
    }

    const ollamaResponse = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2048,
          ...options
        }
      })
    })

    if (!ollamaResponse.ok) {
      const errorData = await ollamaResponse.text()
      throw new Error(`Ollama API error: ${errorData}`)
    }

    const result = await ollamaResponse.json()
    
    return c.json({
      response: result.response,
      model: result.model,
      created_at: result.created_at,
      done: result.done,
      total_duration: result.total_duration,
      prompt_eval_count: result.prompt_eval_count,
      eval_count: result.eval_count
    })
  } catch (error) {
    console.error('Generation error:', error)
    return c.json({ 
      error: 'Failed to generate completion',
      details: error.message 
    }, 500)
  }
})

// Generate chat completion
app.post('/chat', async (c) => {
  try {
    const { messages, model = DEFAULT_MODEL, options = {} } = await c.req.json()

    if (!messages || !Array.isArray(messages)) {
      return c.json({ error: 'Messages array is required' }, 400)
    }

    const ollamaResponse = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2048,
          ...options
        }
      })
    })

    if (!ollamaResponse.ok) {
      const errorData = await ollamaResponse.text()
      throw new Error(`Ollama API error: ${errorData}`)
    }

    const result = await ollamaResponse.json()
    
    return c.json({
      message: result.message,
      model: result.model,
      created_at: result.created_at,
      done: result.done,
      total_duration: result.total_duration,
      prompt_eval_count: result.prompt_eval_count,
      eval_count: result.eval_count
    })
  } catch (error) {
    console.error('Chat error:', error)
    return c.json({ 
      error: 'Failed to generate chat completion',
      details: error.message 
    }, 500)
  }
})

// List available models
app.get('/models', async (c) => {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`)
    const result = await response.json()
    
    return c.json({
      models: result.models || []
    })
  } catch (error) {
    console.error('Models error:', error)
    return c.json({ 
      error: 'Failed to fetch models',
      details: error.message 
    }, 500)
  }
})

// Get model info
app.get('/models/:model', async (c) => {
  try {
    const model = c.req.param('model')
    
    const response = await fetch(`${OLLAMA_BASE_URL}/api/show`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: model })
    })

    if (!response.ok) {
      throw new Error(`Model ${model} not found`)
    }

    const result = await response.json()
    return c.json(result)
  } catch (error) {
    console.error('Model info error:', error)
    return c.json({ 
      error: 'Failed to get model info',
      details: error.message 
    }, 500)
  }
})

// Pull a model
app.post('/models/:model/pull', async (c) => {
  try {
    const model = c.req.param('model')
    
    // This would be a long-running operation
    // For now, we'll just initiate the pull
    const response = await fetch(`${OLLAMA_BASE_URL}/api/pull`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: model })
    })

    if (!response.ok) {
      throw new Error(`Failed to pull model ${model}`)
    }

    return c.json({
      message: `Model ${model} pull initiated`,
      status: 'pulling'
    })
  } catch (error) {
    console.error('Pull error:', error)
    return c.json({ 
      error: 'Failed to pull model',
      details: error.message 
    }, 500)
  }
})

// Specialized endpoint for issue resolution generation
app.post('/generate-resolution', async (c) => {
  try {
    const { issue, relevantContent = [], model = DEFAULT_MODEL } = await c.req.json()

    if (!issue) {
      return c.json({ error: 'Issue data is required' }, 400)
    }

    // Construct the prompt for issue resolution
    let contextPrompt = `You are an expert IT operations specialist. Generate a comprehensive resolution plan for the following issue:

ISSUE DETAILS:
Title: ${issue.title}
Category: ${issue.category}
Severity: ${issue.severity}
Environment: ${issue.environment}
System Affected: ${issue.systemAffected}
Description: ${issue.description}

`

    if (relevantContent.length > 0) {
      contextPrompt += `
RELEVANT SIMILAR ISSUES AND RESOLUTIONS:
${relevantContent.map((content: any, index: number) => `
Similar Issue ${index + 1} (Rating: ${content.averageRating}/5):
${content.content.substring(0, 800)}...
`).join('\n')}

Based on the above similar issues, identify patterns and successful strategies.
`
    }

    contextPrompt += `
Generate a detailed, step-by-step resolution plan that includes:
1. Initial assessment and impact analysis
2. Immediate containment actions if needed
3. Root cause investigation steps
4. Specific resolution procedures
5. Verification and testing steps
6. Prevention measures to avoid recurrence

Make the plan specific, actionable, and tailored to the ${issue.category} category.
Focus on practical steps that can be implemented in a ${issue.environment} environment.
`

    const ollamaResponse = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt: contextPrompt,
        stream: false,
        options: {
          temperature: 0.3, // Lower temperature for more consistent technical responses
          top_p: 0.8,
          max_tokens: 3000,
        }
      })
    })

    if (!ollamaResponse.ok) {
      const errorData = await ollamaResponse.text()
      throw new Error(`Ollama API error: ${errorData}`)
    }

    const result = await ollamaResponse.json()
    
    return c.json({
      resolution: result.response,
      model: result.model,
      contextUsed: relevantContent.length,
      created_at: result.created_at
    })
  } catch (error) {
    console.error('Resolution generation error:', error)
    return c.json({ 
      error: 'Failed to generate resolution',
      details: error.message 
    }, 500)
  }
})

// Specialized endpoint for SOP generation
app.post('/generate-sop', async (c) => {
  try {
    const { issue, resolution, model = DEFAULT_MODEL } = await c.req.json()

    if (!issue || !resolution) {
      return c.json({ error: 'Issue and resolution data are required' }, 400)
    }

    const sopPrompt = `You are an expert technical writer specializing in Standard Operating Procedures (SOPs). Based on the following resolved issue, generate a comprehensive SOP:

ISSUE DETAILS:
Title: ${issue.title}
Category: ${issue.category}
Severity: ${issue.severity}
Environment: ${issue.environment}
System Affected: ${issue.systemAffected}
Description: ${issue.description}

SUCCESSFUL RESOLUTION:
${resolution}

Generate a formal SOP that includes:
1. TITLE - Clear, descriptive title
2. PURPOSE - What this SOP accomplishes
3. SCOPE - What systems/environments this applies to
4. PRECONDITIONS - Required tools, access, and preparations
5. STEP-BY-STEP PROCEDURE - Detailed, numbered steps
6. VALIDATION CHECKS - How to verify successful completion
7. ROLLBACK PLAN - What to do if things go wrong

Format the SOP professionally with clear headings and actionable steps. Make it suitable for IT operations teams to follow consistently.
`

    const ollamaResponse = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt: sopPrompt,
        stream: false,
        options: {
          temperature: 0.2, // Very low temperature for consistent SOP format
          top_p: 0.7,
          max_tokens: 4000,
        }
      })
    })

    if (!ollamaResponse.ok) {
      const errorData = await ollamaResponse.text()
      throw new Error(`Ollama API error: ${errorData}`)
    }

    const result = await ollamaResponse.json()
    
    return c.json({
      sop: result.response,
      model: result.model,
      created_at: result.created_at
    })
  } catch (error) {
    console.error('SOP generation error:', error)
    return c.json({ 
      error: 'Failed to generate SOP',
      details: error.message 
    }, 500)
  }
})

console.log(`🦙 Ollama service starting on port ${port}`)
console.log(`🔗 Connecting to Ollama at: ${OLLAMA_BASE_URL}`)
console.log(`🤖 Default model: ${DEFAULT_MODEL}`)

serve({
  fetch: app.fetch,
  port
})