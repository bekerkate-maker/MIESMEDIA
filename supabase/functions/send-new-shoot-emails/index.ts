import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import nodemailer from "nodemailer"
import { createClient } from 'jsr:@supabase/supabase-js@2'

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
    console.log('Edge function called - send-new-shoot-emails');
    const { shootId, shootTitle, shootDate, shootTime, shootLocation } = await req.json()
    console.log('Request data:', { shootId, shootTitle, shootDate, shootTime, shootLocation });

    // Create Supabase client to fetch all models
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch all models from the database
    const { data: models, error: modelsError } = await supabase
      .from('models')
      .select('email, first_name')

    if (modelsError) {
      console.error('Error fetching models:', modelsError)
      throw new Error('Could not fetch models: ' + modelsError.message)
    }

    if (!models || models.length === 0) {
      console.log('No models found in database')
      return new Response(
        JSON.stringify({ message: "No models to send emails to" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      )
    }

    // Email validation function
    const isValidEmail = (email: string): boolean => {
      if (!email || typeof email !== 'string') return false;
      
      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) return false;
      
      // Filter out known problematic domains
      const blockedDomains = [
        'lokasoft.nl',
        'example.com',
        'test.com',
        'localhost',
        'invalid',
      ];
      
      const domain = email.split('@')[1]?.toLowerCase();
      if (blockedDomains.includes(domain)) return false;
      
      return true;
    };

    // Remove duplicate email addresses and filter invalid ones
    const uniqueModels = models.reduce((acc, model) => {
      // Skip if email is invalid
      if (!isValidEmail(model.email)) {
        console.log(`Skipping invalid email: ${model.email}`);
        return acc;
      }
      
      // Skip if email already exists in accumulator
      if (!acc.find(m => m.email === model.email)) {
        acc.push(model);
      }
      return acc;
    }, [] as typeof models);

    console.log(`Found ${models.length} models, ${uniqueModels.length} valid unique email addresses`);

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

    // Email subject and content
    const subject = "Nieuwe Unposed shoot – meld je aan!";
    
    // Send email to each unique model
    let successCount = 0;
    let failCount = 0;

    for (const model of uniqueModels) {
      try {
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; color: #000000; line-height: 1.6;">
            <p>Hi,</p>
            
            <p>Er staat een nieuwe Unposed shoot voor je klaar!</p>
            
            <br>
            
            <p><strong>Shoot details:</strong></p>
            <p><strong>Titel:</strong> ${shootTitle || '[shoot titel]'}</p>
            <p><strong>Datum:</strong> ${shootDate || '[datum]'}</p>
            <p><strong>Tijd:</strong> ${shootTime || '[tijd]'}</p>
            <p><strong>Locatie:</strong> ${shootLocation || '[locatie]'}</p>
            <br>
            
            <p><a href="https://unposed.nl/" style="color: #2B3E72; text-decoration: underline;">Log in</a> om alle details van de shoot te zien en je aan te melden.</p>
            
            <p>Na je aanmelding houden we je per mail op de hoogte van de selectie.</p>
            
            <br>
            
            <p>Hopelijk tot snel op set! :)</p>
            
            <p>—</p>
            
            <p>
              Team Unposed<br>
              W: <a href="https://Unposed.nl" style="color: #2B3E72; text-decoration: none;">Unposed.nl</a><br>
              E: <a href="mailto:hello@unposed.nl" style="color: #2B3E72; text-decoration: none;">hello@unposed.nl</a>
            </p>
          </div>
        `;

        await transporter.sendMail({
          from: `"Unposed" <${senderEmail}>`,
          to: model.email,
          subject: subject,
          html: htmlContent,
          headers: {
            'Return-Path': '<>',  // Suppress bounce emails
            'X-Auto-Response-Suppress': 'OOF, DR, RN, NRN, AutoReply',
          },
        })

        console.log(`Email sent to ${model.email}`);
        successCount++;
      } catch (emailError) {
        console.error(`Failed to send email to ${model.email}:`, emailError);
        failCount++;
      }
    }

    console.log(`Email sending complete. Success: ${successCount}, Failed: ${failCount}`);

    return new Response(
      JSON.stringify({ 
        message: "Emails sent successfully", 
        successCount,
        failCount,
        totalModels: models.length
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    )
  } catch (error) {
    console.error("Error sending emails:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    )
  }
})
