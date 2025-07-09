
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

    // Call Groq API with updated model
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('GROQ_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192', // Updated to use llama3-8b-8192
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `Groq API error: ${response.status}`
      
      try {
        const errorJson = JSON.parse(errorText)
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message
        }
      } catch {
        // If parsing fails, use the raw error text
        errorMessage = errorText || errorMessage
      }
      
      console.error('Groq API error:', response.status, errorText)
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          success: false 
        }),
        { 
          status: response.status,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
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
    console.error('Error in groq-chat function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
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
