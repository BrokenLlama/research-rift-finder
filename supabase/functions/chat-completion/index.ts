
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
        'Authorization': 'Bearer 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',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistralai/mixtral-8x7b-instruct',
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
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
    console.error('Error in chat-completion function:', error)
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
