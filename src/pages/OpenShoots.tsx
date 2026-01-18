import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import MiesLogo from '@/components/MiesLogo';
import logoCasu from '@/components/logo_klanten/logo_casu.png';
import logoKoekela from '@/components/logo_klanten/logo-koekela-winkels-denieuwebinnenweg.png';
import logoJordys from '@/components/logo_klanten/JORDYS_LOGO.png';
import logoMorganMees from '@/components/logo_klanten/morganmees_logo.png';
import logoDudok from '@/components/logo_klanten/dudok_logo.png';

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
  }, []);

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Laden...</div>;
  }
  if (error) {
    return <div style={{ padding: 40, color: '#DC2626', textAlign: 'center' }}>{error}</div>;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#E5DDD5', fontFamily: 'system-ui, -apple-system, sans-serif', display: 'flex', flexDirection: 'column' }}>
      {/* Banner bovenaan met scrollende logos */}
      <div>
        <div className="logo-banner">
          <div className="logo-banner-inner">
            <div className="logo-scroll">
              <img src={logoCasu} alt="La Cazuela" className="logo-normal" />
              <img src={logoKoekela} alt="Koekela" className="logo-small" />
              <img src={logoJordys} alt="Jordys" className="logo-normal" />
              <img src={logoMorganMees} alt="Morgan & Mees" className="logo-normal" />
              <img src={logoDudok} alt="Dudok" className="logo-xlarge" />
              <img src={logoCasu} alt="La Cazuela" className="logo-normal" />
              <img src={logoKoekela} alt="Koekela" className="logo-small" />
              <img src={logoJordys} alt="Jordys" className="logo-normal" />
              <img src={logoMorganMees} alt="Morgan & Mees" className="logo-normal" />
              <img src={logoDudok} alt="Dudok" className="logo-xlarge" />
              <img src={logoCasu} alt="La Cazuela" className="logo-normal" />
              <img src={logoKoekela} alt="Koekela" className="logo-small" />
              <img src={logoJordys} alt="Jordys" className="logo-normal" />
              <img src={logoMorganMees} alt="Morgan & Mees" className="logo-normal" />
              <img src={logoDudok} alt="Dudok" className="logo-xlarge" />
            </div>
          </div>
        </div>
        <style>{`.logo-banner{background:#fff;padding:12px 0;overflow:hidden;position:relative;box-shadow:0 2px 4px rgba(0,0,0,0.05);min-height:60px}.logo-banner-inner{position:absolute;top:0;left:0;right:0;bottom:0;overflow:hidden;display:flex;align-items:center}.logo-scroll{display:flex;gap:60px;align-items:center;padding-right:60px;animation:scroll 30s linear infinite;will-change:transform}.logo-scroll img{width:auto;object-fit:contain;filter:grayscale(100%)}.logo-small{height:25px}.logo-normal{height:40px}.logo-large{height:50px}.logo-xlarge{height:60px}@keyframes scroll{0%{transform:translateX(0)}100%{transform:translateX(calc(-100% / 3))}}@media(max-width:768px){.logo-banner{min-height:45px}.logo-scroll{gap:30px}.logo-small{height:18px}.logo-normal{height:28px}.logo-xlarge{height:42px}}`}</style>
      </div>
      {/* Hoofdcontent */}
      <div className="content-section">
        <div className="header-section">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16 }}>
            <MiesLogo size={110} />
            <div className="button-wrapper" style={{ marginTop: 12 }}>
              <button onClick={() => window.location.href = '/register-model'} className="primary-btn">
                Registreer als nieuw model
              </button>
            </div>
          </div>
          <h1 className="main-title">Openstaande shoots</h1>
          <p className="subtitle">Bekijk alle beschikbare shoots en meld je aan voor jouw volgende opdracht</p>
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
                  <div style={{ fontSize: 14, color: '#6B7280', display: 'grid', gridTemplateColumns: '32px 1fr', rowGap: '2px' }}>
                    <span key="date-emoji" style={{ textAlign: 'center', height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📅</span>
                    <span key="date" style={{ height: 24, display: 'flex', alignItems: 'center' }}>{formatDateNL(shoot.shoot_date || shoot.date)}</span>
                    <span key="time-emoji" style={{ textAlign: 'center', height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🕒</span>
                    <span key="time" style={{ height: 24, display: 'flex', alignItems: 'center' }}>{(() => {
                      if (shoot.start_time && shoot.end_time) {
                        return `${shoot.start_time.substring(0,5)} - ${shoot.end_time.substring(0,5)}`;
                      }
                      if (shoot.start_time) {
                        return shoot.start_time.substring(0,5);
                      }
                      if (shoot.shoot_time && shoot.shoot_time.trim() !== '') {
                        return shoot.shoot_time;
                      }
                      return 'Tijd onbekend';
                    })()}</span>
                    {shoot.location && (
                      <>
                        <span key="loc-emoji" style={{ textAlign: 'center', height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📍</span>
                        <span key="loc" style={{ height: 24, display: 'flex', alignItems: 'center' }}>{shoot.location}</span>
                      </>
                    )}
                    <span key="comp-emoji" style={{ textAlign: 'center', height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{(() => {
                      if (shoot.compensation_type === 'bedrag') return '💰';
                      if (shoot.compensation_type === 'eten') return '🍽️';
                      if (shoot.compensation_type === 'cadeaubon') return '🎁';
                      if (shoot.compensation_type === 'geen') return '❌';
                      return '';
                    })()}</span>
                    <span key="comp" style={{ height: 24, display: 'flex', alignItems: 'center' }}>{(() => {
                      if (shoot.compensation_type === 'bedrag') return `€${shoot.compensation_amount}`;
                      if (shoot.compensation_type === 'eten') return `Eten betaald`;
                      if (shoot.compensation_type === 'cadeaubon') return `Cadeaubon${shoot.compensation_amount ? ` €${shoot.compensation_amount}` : ''}`;
                      if (shoot.compensation_type === 'geen') return `Geen vergoeding`;
                      return 'Geen vergoeding ingevuld';
                    })()}</span>
                    <span key="spots-emoji" style={{ textAlign: 'center', height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👥</span>
                    <span key="spots" style={{ height: 24, display: 'flex', alignItems: 'center' }}>{typeof shoot.spots !== 'undefined' ? `${shoot.spots} plekken beschikbaar` : 'Aantal plekken onbekend'}</span>
                  </div>
                </div>
                {shoot.spots_available !== undefined && (
                  <div style={{ fontSize: 14, color: '#1F2B4A', fontWeight: 600, marginTop: 2 }}>
                    {shoot.spots_available} plekken beschikbaar
                  </div>
                )}
                {shoot.description && (
                  <p style={{ fontSize: 14, color: '#4B5563', lineHeight: 1.6 }}>
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
                <div style={{ marginTop: 12, marginBottom: 12 }}>
                  {shoot.moodboard_link && (
                    <a
                      href={shoot.moodboard_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'block',
                        fontSize: 15,
                        color: '#2563eb', // blue-600
                        textDecoration: 'none',
                        fontWeight: 500,
                        marginBottom: 6
                      }}
                    >
                      🖼️ Bekijk moodboard →
                    </a>
                  )}
                  {shoot.client_website && (
                    <a
                      href={shoot.client_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'block',
                        fontSize: 15,
                        color: '#2563EB',
                        textDecoration: 'none',
                        fontWeight: 500,
                        marginBottom: 6
                      }}
                    >
                      🌐 Bezoek website van {shoot.client_name || shoot.client}
                    </a>
                  )}
                  {shoot.client_instagram && (
                    <a
                      href={`https://instagram.com/${shoot.client_instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 15,
                        color: '#2563EB',
                        marginBottom: 6,
                        textDecoration: 'none',
                        cursor: 'pointer',
                        transition: 'color 0.2s, text-decoration 0.2s'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.textDecoration = 'underline';
                        e.currentTarget.style.color = '#2B3E72';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.textDecoration = 'none';
                        e.currentTarget.style.color = '#2563EB';
                      }}
                    >
                      📷 @{shoot.client_instagram}
                    </a>
                  )}
                </div>
                <div style={{ marginTop: 'auto' }}>
                  <button
                    className="primary-btn"
                    style={{ width: '100%', marginTop: 8 }}
                    onClick={() => window.location.href = `/register-model?shoot_id=${shoot.id}`}
                  >
                    ✨ Meld je aan!
                  </button>
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
      <style>{`.content-section{padding:60px 20px}.header-section{text-align:center;margin-bottom:40px}.button-wrapper{margin-bottom:24px}.primary-btn{padding:12px 24px;background:#2B3E72;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:15px;font-weight:600;font-family:inherit;box-shadow:0 2px 8px rgba(0,0,0,0.1);transition:all 0.3s ease}.primary-btn:hover{background:#1F2B4A;transform:translateY(-2px)}.main-title{font-size:42px;font-weight:700;margin:0 0 8px 0;color:#1F2B4A}.subtitle{font-size:16px;color:#6B7280;margin:0}.shoots-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:32px;max-width:1200px;margin:0 auto}.shoot-card{background:#fff;border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,0.08);padding:0 0 24px 0;display:flex;flex-direction:column;overflow:hidden;transition:box-shadow 0.2s;min-width:0}.shoot-card:hover{box-shadow:0 4px 16px rgba(0,0,0,0.13)}.shoot-banner img{width:100%;height:180px;object-fit:cover;display:block}.shoot-card-content{padding:24px;display:flex;flex-direction:column;flex:1}.shoot-client{font-size:13px;color:#2B3E72;font-weight:600;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px}.shoot-title{font-size:22px;font-weight:700;color:#1F2B4A;margin-bottom:8px}.primary-btn{margin-top:auto}.shoot-card .primary-btn{margin-top:16px}.shoot-card .primary-btn:active{background:#1F2B4A}.shoot-card .primary-btn:focus{outline:2px solid #1F2B4A}.shoot-card .primary-btn.disabled{background:#9CA3AF;cursor:not-allowed;opacity:0.6}@media(max-width:1024px){.shoots-grid{grid-template-columns:1fr 1fr}}@media(max-width:768px){.content-section{padding:20px 12px}.header-section{margin-bottom:24px}.main-title{font-size:24px;line-height:1.3}.subtitle{font-size:14px}.primary-btn{padding:10px 18px;font-size:13px}.shoots-grid{grid-template-columns:1fr}.shoot-card-content{padding:16px}.shoot-title{font-size:18px}.shoot-banner img{height:120px}}`}</style>
    </div>
  );
};

export default OpenShoots;
