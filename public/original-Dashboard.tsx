// supabase/functions/send-registration-email/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  try {
    const { modelName, shootName, email, phone, instagram } = await req.json()

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
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})// Origineel bestand: `Dashboard (1).tsx`
// Plaatsing in /public zodat je de bron in de browser kunt bekijken zonder dat
// Vite probeert te compileren of te linken naar ontbrekende dependencies.

/*
Plak de originele inhoud hieronder om die als referentie te bekijken in de browser.
*/

// Begin originele file

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Mail, Instagram } from "lucide-react";
import logo from "@/assets/mies-media-logo.png";

type Model = {
  id: string;
  first_name: string;
  last_name: string;
  gender: string;
  age: number;
  instagram: string;
  email: string;
  phone: string;
  photo_url: string | null;
};

export default function Dashboard() {
  // ...originele inhoud weggelaten in public kopie voor leesbaarheid
}

// Einde originele file
