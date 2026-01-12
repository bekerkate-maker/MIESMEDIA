import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { modelName, shootName, email, phone, instagram } = await req.json()

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not set')
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Mies Media <onboarding@resend.dev>',
        to: ['bekerkate@gmail.com'],
        subject: `🎬 Nieuwe aanmelding: ${modelName} voor ${shootName}`,
        html: `
          <h2>Nieuwe Shoot Aanmelding!</h2>
          <p><strong>Model:</strong> ${modelName}</p>
          <p><strong>Shoot:</strong> ${shootName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Telefoon:</strong> ${phone}</p>
          ${instagram ? `<p><strong>Instagram:</strong> @${instagram}</p>` : ''}
          <p>Bekijk de aanmelding in je dashboard!</p>
        `
      })
    })

    const data = await res.json()
    
    // CORS headers in response
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
