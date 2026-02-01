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

    // EMAIL 1: Notificatie naar het team (hello@unposed.nl)
    const teamSubject = `Nieuw talent aangemeld: ${record.first_name} ${record.last_name}`;
    const teamHtmlContent = `
      <div style="font-family: Arial, sans-serif; color: #000000; line-height: 1.6;">
        <p>Hi Collega,</p>
        <p style="margin-bottom: 24px;">Er heeft zich zojuist een nieuw talent aangemeld voor The Unposed Collective.</p>
        
        <div style="background-color: #f4f4f4; padding: 20px; border-radius: 8px; margin: 24px 0;">
          <p style="margin: 8px 0;"><strong>Naam:</strong> ${record.first_name} ${record.last_name}</p>
          <p style="margin: 8px 0;"><strong>Email:</strong> ${record.email}</p>
          <p style="margin: 8px 0;"><strong>Telefoon:</strong> ${record.phone}</p>
          <p style="margin: 8px 0;"><strong>Plaats:</strong> ${record.city}</p>
          <p style="margin: 8px 0;"><strong>Geboortedatum:</strong> ${record.birthdate}</p>
          <p style="margin: 8px 0;"><strong>Instagram:</strong> ${record.instagram}</p>
          <p style="margin: 8px 0;"><strong>Geslacht:</strong> ${record.gender}</p>
          ${record.photo_url ? `<p style="margin: 8px 0;"><strong>Hoofdfoto:</strong> <a href="${record.photo_url}" target="_blank">Bekijk foto</a></p>` : ''}
          ${record.extra_photos && record.extra_photos.length > 0 ? `<p style="margin: 8px 0;"><strong>Extra foto's:</strong> ${record.extra_photos.length} extra foto('s) geüpload</p>` : ''}
        </div>

        <p style="margin-top: 24px;"><a href="https://unposed.nl/login" style="color: #2B3E72; font-weight: normal; text-decoration: underline;">Log hier in</a> om het nieuwe talent te bekijken.</p>

        <p>—</p>
        <p>
          Team Unposed<br>
          W: Unposed.nl<br>
          E: hello@unposed.nl
        </p>
      </div>
    `;

    // EMAIL 2: Bevestigingsmail naar het talent
    const talentSubject = "Welkom bij The Unposed Collective :)";
    const talentHtmlContent = `
      <div style="font-family: Arial, sans-serif; color: #000000; line-height: 1.6;">
        <p>Hi ${record.first_name},</p>
        
        <p style="margin-bottom: 16px;">Welkom bij The Unposed Collective!</p>
        
        <p style="margin-bottom: 16px;">Je aanmelding is succesvol en je profiel is aangemaakt. Vanaf nu maken we gebruik van jouw gegevens om je te benaderen voor nieuwe shoots.</p>
        
        <div style="background-color: #f4f4f4; padding: 20px; border-radius: 8px; margin: 24px 0;">
          <p style="margin: 8px 0;"><strong>Jouw profiel</strong></p>
          <p style="margin: 8px 0;">Op elk moment kun je je profiel bekijken en updaten via <a href="https://unposed.nl/account" style="color: #2B3E72;">unposed.nl/account</a></p>
          
          <p style="margin: 24px 0 8px 0;"><strong>Openstaande shoots</strong></p>
          <p style="margin: 8px 0;">Via <a href="https://unposed.nl/" style="color: #2B3E72;">deze link</a> vind je alle openstaande shoots en kun je je direct aanmelden.</p>
          <p style="margin: 8px 0;">Wanneer er nieuwe shoots zijn die bij je profiel passen, ontvang je hier ook altijd een e-mail over. Na de selectie laten we je weten of je wel of niet geselecteerd bent.</p>
        </div>
        
        <p style="margin-bottom: 16px;">We zijn heel blij dat je onderdeel bent van The Unposed Collective en kijken ernaar uit om samen te werken!</p>
        
        <p style="margin-bottom: 16px;">Heb je vragen, wil je iets aanpassen of twijfel je ergens over? Je kunt ons altijd mailen via hello@unposed.nl.</p>
        
        <p>—</p>
        <p>
          Team Unposed<br>
          W: Unposed.nl<br>
          E: hello@unposed.nl
        </p>
      </div>
    `;

    // Send email to team
    const teamInfo = await transporter.sendMail({
      from: `"Unposed System" <${senderEmail}>`,
      to: senderEmail, // hello@unposed.nl
      subject: teamSubject,
      html: teamHtmlContent,
    })

    console.log("Team notification sent: %s", teamInfo.messageId)

    // Send email to talent
    const talentInfo = await transporter.sendMail({
      from: `"Unposed" <${senderEmail}>`,
      to: record.email, // Het email adres van het talent
      subject: talentSubject,
      html: talentHtmlContent,
    })

    console.log("Talent confirmation sent: %s", talentInfo.messageId)

    return new Response(
      JSON.stringify({ 
        message: "Emails sent successfully", 
        teamEmailId: teamInfo.messageId,
        talentEmailId: talentInfo.messageId
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
