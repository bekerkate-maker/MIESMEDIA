import { SMTPClient } from "https://deno.land/x/antigravity@v1.2.1/mod.ts";

Deno.serve(async (req) => {
  try {
    // We vangen de data op uit de database (firstName en email)
    const { record } = await req.json();
    
    // De webhook van Supabase stuurt de data in een 'record' object.
    // We pakken hier de juiste velden uit jouw tabel.
    const firstName = record.firstname || "Talent"; // vervang 'firstname' door de exacte kolomnaam in je tabel
    const email = record.email;

    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: Deno.env.get("GMAIL_USER")!,
          password: Deno.env.get("GMAIL_APP_PASSWORD")!,
        },
      },
    });

    await client.send({
      from: "hello@unposed.nl",
      to: email,
      subject: "Welkom bij The Unposed Collective :)",
      content: `Hi ${firstName},

Welkom bij The Unposed Collective!

Je aanmelding is succesvol en je profiel is aangemaakt. Vanaf nu maken we gebruik van jouw gegevens om je te benaderen voor nieuwe shoots.

Jouw profiel
Op elk moment kun je je profiel bekijken en updaten.

Openstaande shoots
Via deze link (https://unposed.nl/) vind je alle openstaande shoots en kun je je direct aanmelden.
Wanneer er nieuwe shoots zijn die bij je profiel passen, ontvang je hier ook altijd een e-mail over. Na de selectie laten we je weten of je wel of niet geselecteerd bent.

We zijn heel blij dat je onderdeel bent van The Unposed Collective en kijken ernaar uit om samen te werken!

Heb je vragen, wil je iets aanpassen of twijfel je ergens over? Je kunt ons altijd mailen via hello@unposed.nl.

—

Team Unposed
W: Unposed.nl 
E: hello@unposed.nl`,
    });

    await client.close();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});