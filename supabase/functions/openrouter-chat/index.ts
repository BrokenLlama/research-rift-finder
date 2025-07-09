
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages, papers } = await req.json()

    // Create system message with paper context
    const systemMessage = {
      role: "system",
      content: `You are a helpful academic assistant. Answer questions only using the paper summaries and abstracts provided below. Do not use any outside information. If the answer is not found in these papers, reply 'I don't have enough information from the selected papers.'

Papers available for context:
${papers.map((paper: any, index: number) => `
${index + 1}. Title: ${paper.title}
   Authors: ${paper.authors?.join(', ') || 'Unknown'}
   ${paper.publication_year ? `Year: ${paper.publication_year}` : ''}
   ${paper.journal ? `Journal: ${paper.journal}` : ''}
   Abstract: ${paper.abstract || 'No abstract available'}
   ${paper.summary ? `Summary: ${JSON.stringify(paper.summary)}` : ''}
`).join('\n')}`
    }

    // Prepare messages for API
    const apiMessages = [systemMessage, ...messages]

    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENROUTER_API_KEY')}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://your-app.com', // Optional
        'X-Title': 'Research Paper Chat', // Optional
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet', // You can change this to any OpenRouter model
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenRouter API error:', response.status, errorText)
      throw new Error(`OpenRouter API error: ${response.status}`)
    }

    const data = await response.json()
    const assistantMessage = data.choices[0].message.content

    return new Response(
      JSON.stringify({ 
        message: assistantMessage,
        success: true 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in openrouter-chat function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
