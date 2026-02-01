---
description: Email integratie voor shoot aanmeldingen
---

# Email Integratie voor Shoot Aanmeldingen 📧

Deze workflow beschrijft hoe de email integratie werkt wanneer een model zich aanmeldt voor een openstaande shoot.

## Overzicht van de Integratie

De email integratie bestaat uit 3 hoofdcomponenten:

1. **Supabase Edge Function** (`send-shoot-application-email`) - Verstuurt de emails
2. **ShootRegistration.tsx** - Triggert de email na aanmelding
3. **Gmail SMTP** - Verstuurt emails via `hello@unposed.nl`

---

## Stap 1: Controleer Supabase Secrets

De email functie heeft Gmail credentials nodig. Deze moeten in Supabase staan als secrets.

### 1.1 Controleer of secrets bestaan

// turbo
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

De `send-shoot-application-email` functie moet gedeployed zijn naar Supabase.

### 2.1 Check of de functie lokaal werkt

```bash
cd /Users/katebeker/Documents/👩🏼‍🎨EIGEN\ PROJECTJES/VIBE\ CODING/MIES_MEDIA
npx supabase functions serve send-shoot-application-email
```

### 2.2 Deploy naar Supabase

// turbo
```bash
npx supabase functions deploy send-shoot-application-email
```

---

## Stap 3: Test de Shoot Aanmelding Flow

### 3.1 Start de development server

// turbo
```bash
cd /Users/katebeker/Documents/👩🏼‍🎨EIGEN\ PROJECTJES/VIBE\ CODING/MIES_MEDIA
npm run dev
```

### 3.2 Navigeer naar een shoot aanmelding pagina

Open in je browser: `http://localhost:5173/shoot-registration?shoot_id=[SHOOT_ID]`

**Let op:** Vervang `[SHOOT_ID]` met een bestaande shoot ID uit je database.

### 3.3 Meld je aan als bestaand talent

- Log in met je talent account
- Vul eventueel een motivatie in
- Klik op "Inloggen & Aanmelden"

### 3.4 Controleer de console logs

Na het indienen, check de browser console voor:
- ✅ "Email notification sent successfully"

### 3.5 Controleer de inbox van hello@unposed.nl

De email naar `hello@unposed.nl` bevat:
- **Onderwerp:** "Er is een nieuwe aanmelding voor een shoot!"
- **Inhoud:** 
  - Naam van het talent
  - Shoot titel
  - Datum, tijd en locatie
  - Vergoeding
  - Link naar inlog
- **Van:** Unposed <hello@unposed.nl>

---

## Stap 4: Email Layout

De email bevat de volgende informatie:

### Email Structuur

```
Onderwerp: Er is een nieuwe aanmelding voor een shoot!

Hi,

Er is zojuist een nieuwe aanmelding binnengekomen voor een Unposed shoot.

Talent: [Naam van het talent]
Shoot: [Shoot titel]
Datum: [Datum]
Tijd: [Tijd]
Locatie: [Locatie]
Vergoeding: [Vergoeding type en bedrag]

Log in om te zien wie zich heeft aangemeld, het profiel te bekijken 
en de aanmelding te beoordelen.

—

Team Unposed
W: Unposed.nl
E: hello@unposed.nl
```

### Automatisch ingevulde velden

De volgende velden worden **automatisch** ingevuld vanuit de database:

1. **Talent naam** - Voornaam + achternaam van het model
2. **Shoot titel** - Titel van de shoot
3. **Datum** - Shoot datum (geformatteerd als "1 februari 2026")
4. **Tijd** - Start- en eindtijd (bijv. "14:00 - 16:00 uur")
5. **Locatie** - Locatie van de shoot
6. **Vergoeding** - Automatisch geformatteerd op basis van type:
   - Betaald: "Financiële vergoeding t.w.v. €15"
   - TFP: "TFP (Time for Print)"
   - Zakelijk: "[Bedrijfsnaam]"

---

## Stap 5: Troubleshooting

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

### Probleem: Email komt aan maar velden zijn leeg

**Oplossing:**

1. Check of de shoot alle vereiste velden heeft in de database
2. Controleer de console logs voor waarschuwingen
3. Bekijk de function logs: `npx supabase functions logs send-shoot-application-email`

### Probleem: Email komt aan in spam

**Oplossing:**

1. Voeg SPF record toe aan je domein
2. Voeg DKIM toe via Gmail
3. Gebruik een dedicated email service (SendGrid, Resend, etc.)

---

## Stap 6: Email Template Aanpassen

Als je de email inhoud wilt aanpassen:

### 6.1 Open de edge function

```bash
code /Users/katebeker/Documents/👩🏼‍🎨EIGEN\ PROJECTJES/VIBE\ CODING/MIES_MEDIA/supabase/functions/send-shoot-application-email/index.ts
```

### 6.2 Pas de HTML template aan

Zoek naar de `htmlContent` variabele (rond regel 50).

Voorbeelden van aanpassingen:
- Wijzig de tekst
- Voeg extra informatie toe
- Pas styling aan
- Voeg afbeeldingen toe

### 6.3 Redeploy na wijzigingen

```bash
npx supabase functions deploy send-shoot-application-email
```

---

## Stap 7: Monitoring & Logs

### 7.1 Bekijk function logs

```bash
npx supabase functions logs send-shoot-application-email
```

### 7.2 Bekijk realtime logs

```bash
npx supabase functions logs send-shoot-application-email --follow
```

Dit toont live logs terwijl emails verstuurd worden.

---

## Checklist ✅

Gebruik deze checklist om te verifiëren dat alles werkt:

- [ ] Supabase secrets zijn ingesteld (GMAIL_USER, GMAIL_APP_PASSWORD)
- [ ] Edge function `send-shoot-application-email` is gedeployed
- [ ] Development server draait (`npm run dev`)
- [ ] Shoot aanmelding pagina is bereikbaar
- [ ] Test aanmelding werkt zonder errors
- [ ] Email komt aan bij hello@unposed.nl
- [ ] Alle velden zijn correct ingevuld (naam, shoot, datum, etc.)
- [ ] Login link in email werkt

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
npx supabase functions deploy send-shoot-application-email

# View function logs
npx supabase functions logs send-shoot-application-email

# View realtime logs
npx supabase functions logs send-shoot-application-email --follow

# Start local development
npm run dev
```

---

## Verschil met Collega Email Integratie

Deze shoot aanmelding email integratie verschilt van de collega email integratie:

| Aspect | Collega Email | Shoot Aanmelding Email |
|--------|---------------|------------------------|
| **Ontvanger** | Nieuwe collega | hello@unposed.nl |
| **Trigger** | Account aanmaken | Aanmelden voor shoot |
| **Doel** | Welkom nieuwe collega | Notificatie nieuwe aanmelding |
| **Inhoud** | Welkomstbericht + login | Talent info + shoot details |
| **Edge Function** | `send-email` | `send-shoot-application-email` |

---

## Toekomstige Uitbreidingen

Mogelijke verbeteringen voor de toekomst:

1. **Email naar talent** - Bevestigingsmail naar het talent dat zich heeft aangemeld
2. **Status updates** - Email wanneer aanmelding wordt geaccepteerd/afgewezen
3. **Reminder emails** - Herinnering voor shoot dag
4. **Batch notifications** - Dagelijkse samenvatting van alle aanmeldingen
5. **Email templates** - Herbruikbare templates voor verschillende email types

---

## Contactgegevens in Email

De email bevat momenteel:
- **Website:** Unposed.nl
- **Email:** hello@unposed.nl
- **Login URL:** https://unposed.nl/login (nog toe te voegen als hyperlink)

Als je deze wilt aanpassen, edit de `htmlContent` in `send-shoot-application-email/index.ts`.
