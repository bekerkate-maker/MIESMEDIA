import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import nodemailer from "nodemailer"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Edge function called - send-shoot-application-email');
    const { talentName, shootTitle, shootDate, shootTime, shootLocation, motivation } = await req.json()
    console.log('Request data:', { talentName, shootTitle, shootDate, shootTime, shootLocation, motivation });

    // Create a Transporter using SMTP credentials
    const smtpUser = Deno.env.get('SMTP_USER') || Deno.env.get('GMAIL_USER');
    const smtpPass = Deno.env.get('SMTP_PASS') || Deno.env.get('GMAIL_APP_PASSWORD');

    console.log('SMTP credentials check:', {
      hasUser: !!smtpUser,
      hasPass: !!smtpPass,
      userLength: smtpUser?.length || 0
    });

    if (!smtpUser || !smtpPass) {
      throw new Error('SMTP credentials not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD secrets.');
    }

    const transporter = nodemailer.createTransport({
      host: Deno.env.get('SMTP_HOST') || 'smtp.gmail.com',
      port: parseInt(Deno.env.get('SMTP_PORT') || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })

    console.log('Transporter created successfully');

    const senderEmail = smtpUser || 'hello@unposed.nl'

    // Email naar hello@unposed.nl over nieuwe shoot aanmelding
    const subject = "Er is een nieuwe aanmelding voor een shoot!";
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #000000; line-height: 1.6;">
        <p>Hi,</p>
        
        <p>Er is zojuist een nieuwe aanmelding binnengekomen voor een Unposed shoot.</p>
        <br>
        <p><strong>Talent:</strong> ${talentName || '[naam]'}</p>
        <p><strong>Shoot:</strong> ${shootTitle || '[shoot titel]'}</p>
        <p><strong>Datum:</strong> ${shootDate || '[datum]'}</p>
        <p><strong>Tijd:</strong> ${shootTime || '[tijd]'}</p>
        <p><strong>Locatie:</strong> ${shootLocation || '[locatie]'}</p>
        ${motivation ? `<p><strong>Motivatie:</strong> ${motivation}</p><br>` : ''}
        
        <p><a href="https://unposed.nl/login" style="color: #2B3E72; text-decoration: underline;">Log in</a> om te zien wie zich heeft aangemeld, het profiel te bekijken en de aanmelding te beoordelen.</p>
        
        <p>—</p>
        
        <p>
          Team Unposed<br>
          W: <a href="https://Unposed.nl" style="color: #2B3E72; text-decoration: none;">Unposed.nl</a><br>
          E: <a href="mailto:hello@unposed.nl" style="color: #2B3E72; text-decoration: none;">hello@unposed.nl</a>
        </p>
      </div>
    `;

    // Send email to hello@unposed.nl
    const info = await transporter.sendMail({
      from: `"Unposed" <${senderEmail}>`,
      to: 'hello@unposed.nl',
      subject: subject,
      html: htmlContent,
    })

    console.log("Shoot application email sent: %s", info.messageId)

    return new Response(
      JSON.stringify({ 
        message: "Email sent successfully", 
        emailId: info.messageId
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    )
  } catch (error) {
    console.error("Error sending email:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    )
  }
})
