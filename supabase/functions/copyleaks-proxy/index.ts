import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';

// Copyleaks API credentials
const COPYLEAKS_API_KEY = 'e293a98f-acaf-442b-8947-134a1d5653b8';
const COPYLEAKS_EMAIL = 'your-email@example.com'; // You must register your email with Copyleaks

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    if (!text) {
      return new Response(JSON.stringify({ error: 'No text provided.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Authenticate with Copyleaks to get an access token
    const authRes = await fetch('https://id.copyleaks.com/v3/account/login/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: COPYLEAKS_EMAIL,
        key: COPYLEAKS_API_KEY,
      }),
    });
    if (!authRes.ok) {
      const errorText = await authRes.text();
      throw new Error('Copyleaks Auth Error: ' + errorText);
    }
    const { access_token } = await authRes.json();

    // 2. Submit the text for plagiarism scanning
    // Generate a unique scan ID
    const scanId = crypto.randomUUID();
    const submitRes = await fetch(`https://api.copyleaks.com/v3/education/submit/${COPYLEAKS_EMAIL}/${scanId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        base64: btoa(unescape(encodeURIComponent(text))),
        filename: 'document.txt',
        properties: { webhooks: { status: '' } },
      }),
    });
    if (!submitRes.ok) {
      const errorText = await submitRes.text();
      throw new Error('Copyleaks Submit Error: ' + errorText);
    }

    // 3. Return scan ID to frontend (frontend will need to poll for results)
    return new Response(
      JSON.stringify({ scanId, success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}); 