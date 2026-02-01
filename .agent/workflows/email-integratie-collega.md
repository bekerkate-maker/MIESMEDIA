---
description: Email integratie voor nieuwe collega registraties
---

# Email Integratie voor Nieuwe Collega's 📧

Deze workflow beschrijft hoe de email integratie werkt wanneer een nieuwe collega een account aanmaakt bij `/register-employee`.

## Overzicht van de Integratie

De email integratie bestaat uit 3 hoofdcomponenten:

1. **Supabase Edge Function** (`send-email`) - Verstuurt de emails
2. **RegisterEmployee.tsx** - Triggert de email na registratie
3. **Gmail SMTP** - Verstuurt emails via `hello@unposed.nl`

---

## Stap 1: Controleer Supabase Secrets

De email functie heeft Gmail credentials nodig. Deze moeten in Supabase staan als secrets.

### 1.1 Controleer of secrets bestaan

```bash
cd /Users/katebeker/Documents/👩🏼‍🎨EIGEN\ PROJECTJES/VIBE\ CODING/MIES_MEDIA
npx supabase secrets list
```

### 1.2 Vereiste secrets

Je hebt de volgende secrets nodig:
- `SMTP_USER` of `GMAIL_USER` → `hello@unposed.nl`
- `SMTP_PASS` of `GMAIL_APP_PASSWORD` → Gmail app password
- `SMTP_HOST` → `smtp.gmail.com` (optioneel, default is al ingesteld)
- `SMTP_PORT` → `587` (optioneel, default is al ingesteld)

### 1.3 Secrets toevoegen (indien nodig)

Als secrets ontbreken, voeg ze toe:

```bash
npx supabase secrets set GMAIL_USER=hello@unposed.nl
npx supabase secrets set GMAIL_APP_PASSWORD=jouw_app_password_hier
```

**Let op:** Vervang `jouw_app_password_hier` met het echte Gmail app password.

---

## Stap 2: Deploy de Edge Function

De `send-email` functie moet gedeployed zijn naar Supabase.

### 2.1 Check of de functie lokaal werkt

```bash
cd /Users/katebeker/Documents/👩🏼‍🎨EIGEN\ PROJECTJES/VIBE\ CODING/MIES_MEDIA
npx supabase functions serve send-email
```

### 2.2 Deploy naar Supabase

```bash
npx supabase functions deploy send-email
```

---

## Stap 3: Test de Registratie Flow

### 3.1 Start de development server

```bash
cd /Users/katebeker/Documents/👩🏼‍🎨EIGEN\ PROJECTJES/VIBE\ CODING/MIES_MEDIA
npm run dev
```

### 3.2 Navigeer naar registratie pagina

Open in je browser: `http://localhost:5173/register-employee`

### 3.3 Vul het formulier in

- **Naam:** Test Collega
- **Email:** jouw.test@email.nl
- **Wachtwoord:** minimaal 6 karakters

### 3.4 Controleer de console logs

Na het indienen, check de browser console voor:
- ✅ "Auth user created: [user-id]"
- ✅ "Attempting to send welcome email to: [email]"
- ✅ "✅ Welkomstmail verstuurd naar: [email]"

### 3.5 Controleer je inbox

De nieuwe collega ontvangt een email met:
- **Onderwerp:** "Je beheerdersaccount is succesvol aangemaakt!"
- **Inhoud:** Welkomstbericht met login link
- **Van:** Unposed <hello@unposed.nl>

---

## Stap 4: Troubleshooting

### Probleem: Email wordt niet verstuurd

**Mogelijke oorzaken:**

1. **Secrets niet ingesteld**
   - Controleer: `npx supabase secrets list`
   - Oplossing: Voeg secrets toe (zie Stap 1.3)

2. **Edge function niet gedeployed**
   - Controleer: `npx supabase functions list`
   - Oplossing: Deploy functie (zie Stap 2.2)

3. **Gmail app password incorrect**
   - Controleer: Login bij Gmail en genereer nieuw app password
   - Oplossing: Update secret met nieuw password

4. **CORS errors**
   - Check browser console voor CORS errors
   - Oplossing: Edge function heeft al CORS headers, maar check of URL klopt

### Probleem: "Invalid login credentials" na registratie

Dit kan gebeuren als email confirmatie vereist is.

**Oplossing:**

1. Ga naar Supabase Dashboard → Authentication → Email Templates
2. Zet "Enable email confirmations" uit (voor development)
3. Of: Implementeer email confirmatie flow

### Probleem: Email komt aan in spam

**Oplossing:**

1. Voeg SPF record toe aan je domein
2. Voeg DKIM toe via Gmail
3. Gebruik een dedicated email service (SendGrid, Resend, etc.)

---

## Stap 5: Email Template Aanpassen

Als je de email inhoud wilt aanpassen:

### 5.1 Open de edge function

```bash
code /Users/katebeker/Documents/👩🏼‍🎨EIGEN\ PROJECTJES/VIBE\ CODING/MIES_MEDIA/supabase/functions/send-email/index.ts
```

### 5.2 Pas de HTML template aan

Zoek naar regel 36-59 waar de `htmlContent` staat.

Voorbeelden van aanpassingen:
- Wijzig de tekst
- Voeg extra links toe
- Pas styling aan
- Voeg afbeeldingen toe

### 5.3 Redeploy na wijzigingen

```bash
npx supabase functions deploy send-email
```

---

## Stap 6: Monitoring & Logs

### 6.1 Bekijk function logs

```bash
npx supabase functions logs send-email
```

### 6.2 Bekijk realtime logs

```bash
npx supabase functions logs send-email --follow
```

Dit toont live logs terwijl emails verstuurd worden.

---

## Extra: Email Verificatie Toevoegen

Als je wilt dat collega's hun email moeten verifiëren:

### 6.1 Enable email confirmation in Supabase

1. Ga naar Supabase Dashboard
2. Authentication → Settings
3. Enable "Enable email confirmations"

### 6.2 Pas RegisterEmployee.tsx aan

De code moet aangepast worden om te wachten op email verificatie voordat de gebruiker kan inloggen.

Dit vereist extra logica in de registratie flow.

---

## Checklist ✅

Gebruik deze checklist om te verifiëren dat alles werkt:

- [ ] Supabase secrets zijn ingesteld (GMAIL_USER, GMAIL_APP_PASSWORD)
- [ ] Edge function `send-email` is gedeployed
- [ ] Development server draait (`npm run dev`)
- [ ] Registratie pagina is bereikbaar op `/register-employee`
- [ ] Test registratie werkt zonder errors
- [ ] Welkomstmail komt aan in inbox
- [ ] Login link in email werkt
- [ ] Nieuwe collega kan inloggen na registratie

---

## Nuttige Commando's

```bash
# Check Supabase status
npx supabase status

# List all functions
npx supabase functions list

# List all secrets
npx supabase secrets list

# Deploy specific function
npx supabase functions deploy send-email

# View function logs
npx supabase functions logs send-email

# Start local development
npm run dev
```

---

## Contactgegevens in Email

De email bevat momenteel:
- **Website:** Unposed.nl
- **Email:** hello@unposed.nl
- **Login URL:** https://unposed.nl/login

Als je deze wilt aanpassen, edit de `htmlContent` in `send-email/index.ts`.
