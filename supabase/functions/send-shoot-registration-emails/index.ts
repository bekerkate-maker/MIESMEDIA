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
    const { record } = await req.json()

    // Create a Transporter using SMTP credentials
    const smtpUser = Deno.env.get('SMTP_USER') || Deno.env.get('GMAIL_USER');
    const smtpPass = Deno.env.get('SMTP_PASS') || Deno.env.get('GMAIL_APP_PASSWORD');

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

    const subject = "Een nieuw talent heeft zich aangemeld!";

    // HTML content for the email
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <p>Hi Collega,</p>
        <p>Er heeft zich zojuist een nieuw talent aangemeld voor The Unposed Collective.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Naam:</strong> ${record.first_name} ${record.last_name}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${record.email}</p>
          <p style="margin: 5px 0;"><strong>Telefoon:</strong> ${record.phone}</p>
          <p style="margin: 5px 0;"><strong>Plaats:</strong> ${record.city}</p>
          <p style="margin: 5px 0;"><strong>Geboortedatum:</strong> ${record.birthdate}</p>
          <p style="margin: 5px 0;"><strong>Instagram:</strong> ${record.instagram}</p>
          <p style="margin: 5px 0;"><strong>Geslacht:</strong> ${record.gender}</p>
          ${record.photo_url ? `<p style="margin: 5px 0;"><strong>Hoofdfoto:</strong> <a href="${record.photo_url}" target="_blank">Bekijk foto</a></p>` : ''}
          ${record.extra_photos && record.extra_photos.length > 0 ? `<p style="margin: 5px 0;"><strong>Extra foto's:</strong> ${record.extra_photos.length} extra foto('s) geüpload</p>` : ''}
        </div>

        <p><a href="https://unposed.nl/login" style="color: #2B3E72; font-weight: bold; text-decoration: underline;">Log in</a> om het nieuwe talent te bekijken.</p>

        <p>—</p>
        <p>
          <strong>Team Unposed</strong><br>
          W: <a href="https://unposed.nl" style="color: #333; text-decoration: none;">Unposed.nl</a><br>
          E: <a href="mailto:hello@unposed.nl" style="color: #333; text-decoration: none;">hello@unposed.nl</a>
        </p>
      </div>
    `;

    // Send the email
    const info = await transporter.sendMail({
      from: `"Unposed System" <${senderEmail}>`,
      to: senderEmail,
      subject: subject,
      html: htmlContent,
    })

    console.log("Message sent: %s", info.messageId)

    return new Response(
      JSON.stringify({ message: "Email sent successfully", id: info.messageId }),
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
