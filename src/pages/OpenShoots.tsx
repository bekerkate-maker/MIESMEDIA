import React, { useEffect, useState } from 'react';
// import { supabase } from '@/integrations/supabase/client';
import { supabase } from '@/integrations/supabase/client';
import MiesLogo from '@/components/MiesLogo';
import ClientLogoBanner from '@/components/ClientLogoBanner';

function formatDateNL(dateString?: string, long: boolean = false): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  if (long) {
    return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  return date.toLocaleDateString('nl-NL');
}

const OpenShoots: React.FC = () => {

  const [shoots, setShoots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const fetchShoots = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('shoots')
          .select('*')
          .order('shoot_date', { ascending: false });
        if (error) throw error;
        console.log('Supabase shoots data:', data); // Debug: log alle data
        if (data && data.length > 0) {
          console.log('Eerste shoot object:', data[0]);
          console.log('Keys van eerste shoot:', Object.keys(data[0]));
        }
        setShoots(data || []);
      } catch (e: any) {
        setError(e.message || 'Fout bij ophalen van shoots.');
      }
      setLoading(false);
    };
    fetchShoots();
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Laden...</div>;
  }
  if (error) {
    return <div style={{ padding: 40, color: '#DC2626', textAlign: 'center' }}>{error}</div>;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#E5DDD5', fontFamily: 'system-ui, -apple-system, sans-serif', display: 'flex', flexDirection: 'column' }}>
      {/* Banner helemaal bovenaan, tegen de rand */}
      <div style={{ margin: 0, padding: 0, position: 'relative', top: 0, left: 0, right: 0, zIndex: 20 }}>
        <ClientLogoBanner />
      </div>
      {/* Account icon direct onder de banner */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', padding: '12px 0 0 0' }}>
        <button
          onClick={() => window.location.href = '/account'}
          style={{
            background: 'transparent',
            border: 'none',
            width: 44,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            marginRight: 24,
          }}
          aria-label={session ? 'Account wijzigen' : 'Inloggen'}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 2px 8px rgba(44,62,80,0.18))' }}>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-2.5 3.5-4 8-4s8 1.5 8 4" />
          </svg>
        </button>
      </div>
      {/* Hoofdcontent */}
      <div className="content-section">
        <div className="header-section">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 0, marginTop: 0 }}>
            <MiesLogo size={110} />
            <div className="button-wrapper" style={{ marginTop: 6, display: 'flex', gap: 12 }}>
              <button onClick={() => window.location.href = '/register-model'} className="primary-btn">
                Meld je aan als nieuw talent
              </button>
            </div>
          </div>
          <h1 className="main-title">Openstaande shoots</h1>
          <p className="subtitle">Bekijk alle openstaande shoots en meld je aan</p>
        </div>
        <div className="shoots-grid">
          {shoots.map(shoot => (
            <div key={shoot.id} className="shoot-card" style={{ opacity: shoot.shoot_date && new Date(shoot.shoot_date) < new Date() ? 0.7 : 1 }}>
              {shoot.banner_photo_url && (
                <div className="shoot-banner">
                  <img src={shoot.banner_photo_url} alt="Banner shoot" />
                </div>
              )}
              <div className="shoot-card-content">
                <div className="shoot-client">{shoot.client_name || shoot.client}</div>
                {/* Status indicator: 'verlopen' in red or 'open' in green below client name */}
                <div style={{ fontSize: 12, color: (shoot.shoot_date && new Date(shoot.shoot_date) < new Date()) ? '#DC2626' : '#16A34A', fontWeight: 500, marginBottom: 4 }}>
                  {shoot.shoot_date && new Date(shoot.shoot_date) < new Date() ? 'Verlopen' : 'Open'}
                </div>
                <h3 className="shoot-title">{shoot.title}</h3>
                <div style={{ marginBottom: 12 }}>
                  <div className="shoot-metadata">
                    <span className="metadata-icon">•</span>
                    <span className="metadata-text">{formatDateNL(shoot.shoot_date || shoot.date)}</span>
                    <span className="metadata-icon">•</span>
                    <span className="metadata-text">{(() => {
                      if (shoot.start_time && shoot.end_time) {
                        return `${shoot.start_time.substring(0, 5)} - ${shoot.end_time.substring(0, 5)}`;
                      }
                      if (shoot.start_time) {
                        return shoot.start_time.substring(0, 5);
                      }
                      if (shoot.shoot_time && shoot.shoot_time.trim() !== '') {
                        return shoot.shoot_time;
                      }
                      return 'Tijd onbekend';
                    })()}</span>
                    {shoot.location && (
                      <>
                        <span className="metadata-icon">•</span>
                        <span className="metadata-text">{shoot.location}</span>
                      </>
                    )}
                    <span className="metadata-icon">•</span>
                    <span className="metadata-text">{(() => {
                      if (shoot.compensation_type === 'financiële vergoeding') return `Financiële vergoeding t.w.v. €${shoot.compensation_amount}`;
                      if (shoot.compensation_type === 'cadeaubon') return `Cadeaubon t.w.v. €${shoot.compensation_amount}${shoot.compensation_business_name ? ` bij ${shoot.compensation_business_name}` : ''}`;
                      if (shoot.compensation_type === 'geen') return `Geen vergoeding`;
                      // Fallback voor oude data
                      if (shoot.compensation_type === 'bedrag') return `€${shoot.compensation_amount}`;
                      if (shoot.compensation_type === 'eten') return `Eten betaald`;
                      return 'Geen vergoeding ingevuld';
                    })()}</span>
                    <span className="metadata-icon">•</span>
                    <span className="metadata-text">{typeof shoot.spots !== 'undefined' ? `${shoot.spots} plekken beschikbaar` : 'Aantal plekken onbekend'}</span>
                  </div>
                </div>
                {shoot.spots_available !== undefined && (
                  <div style={{ fontSize: 14, color: '#1F2B4A', fontWeight: 600, marginTop: 2 }}>
                    {shoot.spots_available} plekken beschikbaar
                  </div>
                )}
                {shoot.description && (
                  <p className="shoot-description">
                    {(() => {
                      // Verwijder de titel uit de beschrijving als die voorkomt
                      if (shoot.description && shoot.title && shoot.description.toLowerCase().startsWith(shoot.title.toLowerCase())) {
                        // Verwijder de titel en eventuele spaties/komma's erna
                        return shoot.description.slice(shoot.title.length).replace(/^\s*[,-:\.]?\s*/, '');
                      }
                      return shoot.description;
                    })()}
                  </p>
                )}
                <div className="shoot-links">
                  {shoot.moodboard_link && (
                    <a
                      href={shoot.moodboard_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shoot-link"
                    >
                      <span className="link-icon">•</span> Bekijk moodboard →
                    </a>
                  )}
                  {shoot.client_website && (
                    <a
                      href={shoot.client_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shoot-link"
                    >
                      <span className="link-icon">•</span> Bekijk website →
                    </a>
                  )}
                  {shoot.client_instagram && (
                    <a
                      href={`https://instagram.com/${shoot.client_instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shoot-link instagram-link"
                    >
                      <span className="link-icon">•</span> {shoot.client_instagram.startsWith('@') ? shoot.client_instagram : '@' + shoot.client_instagram}
                    </a>
                  )}
                </div>
                <div>
                  {(() => {
                    const isExpired = shoot.shoot_date && new Date(shoot.shoot_date) < new Date();
                    return (
                      <button
                        className={`primary-btn ${isExpired ? 'disabled' : ''}`}
                        style={{ width: '100%', marginTop: 8 }}
                        onClick={() => !isExpired && (window.location.href = `/shoot-registration?shoot_id=${shoot.id}`)}
                        disabled={isExpired}
                      >
                        {isExpired ? 'Shoot verlopen' : 'Meld je aan!'}
                      </button>
                    );
                  })()}
                </div>
              </div>
            </div>
          ))}
        </div>
        {shoots.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF' }}>
            <p style={{ fontSize: 18 }}>Geen shoots gevonden</p>
          </div>
        )}
      </div>
      <style>{`.content-section{padding:60px 20px}.header-section{text-align:center;margin-bottom:40px}.button-wrapper{margin-bottom:24px}.primary-btn{padding:12px 24px;background:#2B3E72;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:15px;font-weight:600;font-family:inherit;box-shadow:0 2px 8px rgba(0,0,0,0.1);transition:all 0.3s ease}.primary-btn:hover:not(.disabled){background:#1F2B4A;transform:translateY(-2px)}.primary-btn.disabled{background:#9CA3AF;cursor:not-allowed;opacity:0.6;transform:none !important}.primary-btn.disabled:hover{background:#9CA3AF;transform:none}.main-title{font-size:42px;font-weight:700;margin:0 0 8px 0;color:#1F2B4A}.subtitle{font-size:16px;color:#6B7280;margin:0}.shoots-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:32px;max-width:1200px;margin:0 auto}.shoot-card{background:#fff;border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,0.08);padding:0 0 24px 0;display:flex;flex-direction:column;overflow:hidden;transition:box-shadow 0.2s;min-width:0}.shoot-card:hover{box-shadow:0 4px 16px rgba(0,0,0,0.13)}.shoot-banner img{width:100%;height:180px;object-fit:cover;display:block}.shoot-card-content{padding:24px;display:flex;flex-direction:column;flex:1}.shoot-client{font-size:13px;color:#2B3E72;font-weight:600;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px}.shoot-title{font-size:22px;font-weight:700;color:#1F2B4A;margin-bottom:8px}
      
      /* Metadata Styles */
      .shoot-metadata { font-size: 14px; color: #6B7280; display: grid; grid-template-columns: 32px 1fr; row-gap: 2px; }
      .metadata-icon { text-align: center; min-height: 24px; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #1F2B4A; }
      .metadata-text { min-height: 24px; display: flex; align-items: center; line-height: 1.3; }
      .shoot-description { font-size: 14px; color: #4B5563; line-height: 1.6; }
      .shoot-links { margin-top: auto; margin-bottom: 12px; padding-top: 12px; }
      .shoot-link { display: block; fontSize: 15px; color: #2563eb; text-decoration: none; font-weight: 500; margin-bottom: 6px; }
      .link-icon { font-size: 18px; color: #1F2B4A; margin-right: 8px; }
      .instagram-link { transition: color 0.2s, text-decoration 0.2s; cursor: pointer; }
      .instagram-link:hover { text-decoration: underline; color: #2B3E72; }

      .primary-btn{margin-top:auto}.shoot-card .primary-btn{margin-top:16px}.shoot-card .primary-btn:active:not(.disabled){background:#1F2B4A}.shoot-card .primary-btn:focus:not(.disabled){outline:2px solid #1F2B4A}
      
      @media(max-width:1024px){.shoots-grid{grid-template-columns:1fr 1fr}}
      
      @media(max-width:768px){
        .content-section{padding:20px 16px}
        .header-section{margin-bottom:24px}
        .main-title{font-size:24px;line-height:1.3}
        .subtitle{font-size:14px}
        .primary-btn{padding:8px 12px;font-size:12px; width: 100% !important;}
        .shoots-grid{grid-template-columns:1fr 1fr; gap: 16px}
        .shoot-card{border-radius: 12px;}
        .shoot-card-content{padding:10px}
        .shoot-title{font-size:15px; margin-bottom: 4px; line-height: 1.2}
        .shoot-client{font-size: 10px; margin-bottom: 4px;}
        .shoot-banner img{height:110px}
        
        /* Compact Metadata for Mobile */
        .shoot-metadata { font-size: 11px; grid-template-columns: 16px 1fr; row-gap: 0; }
        .metadata-icon { font-size: 14px; min-height: 18px; }
        .metadata-text { min-height: 18px; }
        .shoot-description { font-size: 11px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .shoot-links { margin-bottom: 8px; padding-top: 8px; }
        .shoot-link { font-size: 11px; margin-bottom: 2px; }
        .link-icon { font-size: 12px; margin-right: 4px; }
      }
      `}</style>
    </div>
  );
};

export default OpenShoots;
