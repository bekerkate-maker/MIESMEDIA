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
    console.log('Edge function called - send-email');
    const { name, email, code, type } = await req.json()
    console.log('Request data:', { name, email, code, type });

    // Create a Transporter using SMTP credentials
    const smtpUser = Deno.env.get('SMTP_USER') || Deno.env.get('GMAIL_USER');
    const smtpPass = Deno.env.get('SMTP_PASS') || Deno.env.get('GMAIL_APP_PASSWORD');

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

    const senderEmail = smtpUser || 'hello@unposed.nl'

    let subject = "";
    let htmlContent = "";
    let toEmail = email;

    if (type === 'verification') {
      toEmail = 'hello@unposed.nl';
      subject = `Nieuwe collega registratie aanvraag: ${name}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #000000; line-height: 1.6;">
          <h2 style="color: #402e27;">Nieuwe aanvraag voor collega account</h2>
          <p>Hi Team Unposed,</p>
          <p>Er probeert een nieuwe collega zich te registreren op de website:</p>
          <div style="background: #f8f7f2; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>Naam:</strong> ${name}</p>
            <p><strong>E-mail:</strong> ${email}</p>
          </div>
          <p>De unieke verificatiecode voor deze collega is:</p>
          <div style="background: #402e27; color: #f8f7f2; padding: 20px; font-size: 32px; font-weight: bold; text-align: center; border-radius: 8px; margin: 20px 0; letter-spacing: 5px;">
            ${code}
          </div>
          <p><strong>Actie vereist:</strong> Stuur deze code (of deze e-mail) door naar de nieuwe collega. Pas als zij deze code invoeren op de website, kan hun account worden aangemaakt.</p>
          <p>—<br>Unposed Systeem</p>
        </div>
      `;
    } else {
      // Standaard: Welkomstmail naar de nieuwe collega
      subject = "Je beheerdersaccount is succesvol aangemaakt!";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #000000; line-height: 1.6;">
          <p>Hi ${name},</p>
          
          <p>Je account is succesvol aangemaakt.<br>
          Je bent vanaf nu beheerder van The Unposed Collective.</p>
          
          <p>Dit betekent dat je toegang hebt tot de omgeving waarin we aanmeldingen beheren, talenten bekijken en shoots coördineren.</p>
          
          <p>Inloggen kan via <a href="https://unposed.nl/login" style="color: #2B3E72; text-decoration: underline;">deze link</a>.</p>
          
          <p>Welkom bij The Unposed Collective.</p>
          
          <p>—</p>
          
          <p>
            Team Unposed<br>
            W: <a href="https://Unposed.nl" style="color: #2B3E72; text-decoration: none;">Unposed.nl</a><br>
            E: <a href="mailto:hello@unposed.nl" style="color: #2B3E72; text-decoration: none;">hello@unposed.nl</a>
          </p>
        </div>
      `;
    }

    // Send email
    const info = await transporter.sendMail({
      from: `"Unposed" <${senderEmail}>`,
      to: toEmail,
      subject: subject,
      html: htmlContent,
    })

    console.log("Email sent: %s", info.messageId)

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
