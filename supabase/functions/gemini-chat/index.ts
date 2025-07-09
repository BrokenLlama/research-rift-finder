
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages, papers } = await req.json()
    
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not found')
    }

    // Create context from papers
    const papersContext = papers.map((paper: any, index: number) => `
${index + 1}. Title: ${paper.title}
   Authors: ${paper.authors?.join(', ') || 'Unknown'}
   ${paper.publication_year ? `Year: ${paper.publication_year}` : ''}
   ${paper.journal ? `Journal: ${paper.journal}` : ''}
   Abstract: ${paper.abstract || 'No abstract available'}
   ${paper.summary ? `Summary: ${JSON.stringify(paper.summary)}` : ''}
`).join('\n')

    // Get the last user message
    const lastUserMessage = messages[messages.length - 1]?.content || ''

    const prompt = `You are an academic research assistant. Answer questions only using the provided paper summaries and abstracts. If the answer is not found in these papers, reply 'I don't have enough information from the selected papers.'

Papers available for context:
${papersContext}

Question: ${lastUserMessage}`

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ]
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', errorText)
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const assistantMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.'

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
    console.error('Error in gemini-chat function:', error)
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
