import { HopIcon } from 'lucide-react'
import React from 'react'
// # HopIcon 
export default function Dashboard() {
  return (
    <main style={{ fontFamily: 'system-ui, Arial', padding: 24 }}>
      <h1>The Unposed Collective — Lokale dev</h1>
      <p>
        Dit is een lichte placeholder-versie van je dashboard zodat de dev-server zonder
        extra dependencies kan draaien. Je originele `Dashboard (1).tsx` staat in
        <code>/public/original-Dashboard.tsx</code> en kan bekeken worden.
      </p>
      <p>
        Als je wilt dat de volledige originele component (met Supabase, custom UI
        components en routing) draait, laat het me weten — ik kan die dependencies
        toevoegen en de imports fixen.
      </p>
      <a href="/original-Dashboard.tsx" target="_blank" rel="noreferrer">Bekijk originele Dashboard bron</a>
    </main>
  )
}
