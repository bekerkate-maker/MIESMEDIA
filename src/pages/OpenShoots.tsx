import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import MiesLogo from '@/components/MiesLogo';
import logoCasu from '@/components/logo_klanten/logo_casu.png';
import logoKoekela from '@/components/logo_klanten/logo-koekela-winkels-denieuwebinnenweg.png';
import logoJordys from '@/components/logo_klanten/JORDYS_LOGO.png';
import logoMorganMees from '@/components/logo_klanten/morganmees_logo.png';
import logoDudok from '@/components/logo_klanten/dudok_logo.png';

export default function OpenShoots() {
  const [selectedShoot, setSelectedShoot] = useState<number | null>(null);
  const [loginStep, setLoginStep] = useState<'choice' | 'login' | 'confirmed'>('choice');
  const [loginData, setLoginData] = useState({ email: '', birthdate: '' });
  const [loggedInModel, setLoggedInModel] = useState<any>(null);
  const [loginError, setLoginError] = useState('');
  const [message, setMessage] = useState('');
  const [openShoots, setOpenShoots] = useState<any[]>([]);

  // Haal shoots op uit database
  useEffect(() => {
    fetchShoots();
  }, []);

  const fetchShoots = async () => {
    try {
      const { data, error } = await supabase
        .from('shoots')
        .select('*')
        .eq('status', 'open')
        .order('shoot_date', { ascending: true });

      if (error) throw error;
      setOpenShoots(data || []);
    } catch (error) {
      console.error('Error fetching shoots:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      const { data, error } = await supabase
        .from('models')
        .select('*')
        .eq('email', loginData.email.toLowerCase().trim())
        .eq('birthdate', loginData.birthdate)
        .single();

      if (error || !data) {
        setLoginError('Geen model gevonden met deze gegevens. Registreer je eerst als model.');
        return;
      }

      setLoggedInModel(data);
      setLoginStep('confirmed');
      setLoginError('');
    } catch (err) {
      console.error('Login error:', err);
      setLoginError('Er ging iets mis. Probeer het opnieuw.');
    }
  };

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const fullName = `${loggedInModel.first_name} ${loggedInModel.last_name}`;
      
      const { error } = await supabase
        .from('shoot_registrations')
        .insert([{
          shoot_id: selectedShoot,
          model_id: loggedInModel.id,
          name: fullName,
          email: loggedInModel.email,
          phone: loggedInModel.phone,
          instagram: loggedInModel.instagram || '',
          message: message
        }]);

      if (error) {
        console.error('Fout bij opslaan aanmelding:', error);
        alert('❌ Er ging iets mis. Probeer het opnieuw.');
        return;
      }

      alert(`✅ Aanmelding ontvangen!\n\n${fullName}, je bent aangemeld voor deze shoot!\n\nWe nemen zo snel mogelijk contact met je op!`);
      handleReset();
    } catch (err) {
      console.error('Error:', err);
      alert('❌ Er ging iets mis. Probeer het opnieuw.');
    }
  };

  const handleReset = () => {
    setSelectedShoot(null);
    setLoginStep('choice');
    setLoggedInModel(null);
    setLoginData({ email: '', birthdate: '' });
    setLoginError('');
    setMessage('');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#E5DDD5',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      
      {/* Banner bovenaan met scrollende logos */}
      <div style={{ 
        background: '#fff',
        padding: '12px 0',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        minHeight: '60px'
      }}>
        <div style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center'
        }}>
          <div className="logo-scroll" style={{
            display: 'flex',
            gap: 60,
            alignItems: 'center',
            paddingRight: '60px'
          }}>
            {[...Array(3)].map((_, setIndex) => (
              <div key={setIndex} style={{ display: 'flex', gap: 60, alignItems: 'center' }}>
                <img src={logoCasu} alt="La Cazuela" className="logo-normal" />
                <img src={logoKoekela} alt="Koekela" className="logo-small" />
                <img src={logoJordys} alt="Jordys" className="logo-normal" />
                <img src={logoMorganMees} alt="Morgan & Mees" className="logo-normal" />
                <img src={logoDudok} alt="Dudok" className="logo-xlarge" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hoofdcontent */}
      <div style={{ padding: '60px 20px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <MiesLogo size={110} />
          </div>
          <h1 style={{ 
            fontSize: 32, 
            fontWeight: 700, 
            color: '#1F2B4A', 
            marginBottom: 12 
          }}>
            Openstaande Shoots
          </h1>
          <p style={{ 
            fontSize: 16, 
            color: '#6B7280', 
            maxWidth: 600, 
            margin: '0 auto 16px' 
          }}>
            Bekijk alle beschikbare shoots en meld je aan voor jouw volgende opdracht
          </p>
          
          {/* Registreer als model knop */}
          <div style={{ marginTop: 24 }}>
            <button
              onClick={() => window.location.href = '/register-model'}
              style={{
                padding: '12px 24px',
                background: '#2B3E72',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: 'inherit',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#1F2B4A';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#2B3E72';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              }}
            >
              Registreer als nieuw model
            </button>
          </div>
        </div>

        {/* Aanmeldformulier */}
        {selectedShoot && (
          <div style={{
            maxWidth: 600,
            margin: '0 auto 40px',
            background: '#fff',
            borderRadius: 12,
            padding: 32,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            border: '2px solid #2B3E72'
          }}>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ 
                fontSize: 24, 
                fontWeight: 600, 
                color: '#1F2B4A',
                marginBottom: 8
              }}>
                Aanmelden voor: {openShoots.find(s => s.id === selectedShoot)?.title}
              </h2>
              <p style={{ fontSize: 14, color: '#6B7280' }}>
                {openShoots.find(s => s.id === selectedShoot)?.client}
              </p>
            </div>

            {/* Stap 1: Keuze */}
            {loginStep === 'choice' && (
              <div>
                <p style={{ fontSize: 15, color: '#4B5563', marginBottom: 24, textAlign: 'center' }}>
                  Ben je al geregistreerd als model bij Mies Media?
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setLoginStep('login')}
                    style={{
                      padding: '16px',
                      background: '#2B3E72',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      fontFamily: 'inherit'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#1F2B4A'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#2B3E72'}
                  >
                    ✓ Ja, ik ben al geregistreerd
                  </button>
                  <button
                    type="button"
                    onClick={() => window.location.href = '/register-model'}
                    style={{
                      padding: '16px',
                      background: '#E5DDD5',
                      color: '#1F2B4A',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      fontFamily: 'inherit'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#D1C7BB'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#E5DDD5'}
                  >
                    → Nee, registreer mij als nieuw model
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    style={{
                      marginTop: 8,
                      padding: '8px',
                      background: 'transparent',
                      color: '#6B7280',
                      border: 'none',
                      fontSize: 13,
                      cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >
                    Annuleren
                  </button>
                </div>
              </div>
            )}

            {/* Stap 2: Login */}
            {loginStep === 'login' && (
              <form onSubmit={handleLogin}>
                <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 20, textAlign: 'center' }}>
                  Log in met je geregistreerde gegevens
                </p>
                
                {loginError && (
                  <div style={{
                    padding: '12px',
                    background: '#FEE2E2',
                    color: '#DC2626',
                    borderRadius: 6,
                    fontSize: 13,
                    marginBottom: 16
                  }}>
                    {loginError}
                  </div>
                )}

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#1F2B4A', fontWeight: 500 }}>
                    Email *
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="jouw@email.nl"
                    value={loginData.email}
                    onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                    style={{ width: '100%', padding: '12px', background: '#E5DDD5', border: 'none', borderRadius: 8, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#1F2B4A', fontWeight: 500 }}>
                    Geboortedatum *
                  </label>
                  <input
                    required
                    type="date"
                    value={loginData.birthdate}
                    onChange={(e) => setLoginData({...loginData, birthdate: e.target.value})}
                    style={{ width: '100%', padding: '12px', background: '#E5DDD5', border: 'none', borderRadius: 8, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginStep('choice');
                      setLoginError('');
                      setLoginData({ email: '', birthdate: '' });
                    }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#E5DDD5',
                      color: '#1F2B4A',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >
                    ← Terug
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 2,
                      padding: '12px',
                      background: '#2B3E72',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      fontFamily: 'inherit'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#1F2B4A'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#2B3E72'}
                  >
                    Inloggen
                  </button>
                </div>
              </form>
            )}

            {/* Stap 3: Bevestiging & Aanmelding */}
            {loginStep === 'confirmed' && loggedInModel && (
              <form onSubmit={handleSubmitRegistration}>
                <div style={{
                  padding: '12px 16px',
                  background: '#D1FAE5',
                  color: '#065F46',
                  borderRadius: 8,
                  fontSize: 13,
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <span>✓</span>
                  <span>Ingelogd als <strong>{loggedInModel.first_name} {loggedInModel.last_name}</strong></span>
                </div>
                
                <div style={{ marginBottom: 20, padding: 16, background: '#F9FAFB', borderRadius: 8 }}>
                  <p style={{ fontSize: 14, color: '#4B5563', marginBottom: 12 }}>
                    <strong>Je gegevens:</strong>
                  </p>
                  <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.8 }}>
                    <div>📧 {loggedInModel.email}</div>
                    <div>📱 {loggedInModel.phone}</div>
                    {loggedInModel.instagram && <div>📷 @{loggedInModel.instagram}</div>}
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#1F2B4A', fontWeight: 500 }}>
                    Motivatie (optioneel)
                  </label>
                  <textarea
                    placeholder="Waarom wil je graag meedoen aan deze shoot?"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    style={{ width: '100%', padding: '12px', background: '#E5DDD5', border: 'none', borderRadius: 8, fontSize: 15, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    onClick={handleReset}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#E5DDD5',
                      color: '#1F2B4A',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 2,
                      padding: '12px',
                      background: '#2B3E72',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      fontFamily: 'inherit'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#1F2B4A'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#2B3E72'}
                  >
                    ✓ Bevestig Aanmelding
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Shoots Grid */}
        <div style={{ 
          maxWidth: 1000, 
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 24
        }}>
          {openShoots.map(shoot => (
            <div key={shoot.id} style={{
              background: '#fff',
              borderRadius: 12,
              padding: 24,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
            }}
            >
              <div style={{ flex: '1' }}>
              <div style={{ 
                fontSize: 12, 
                fontWeight: 600, 
                color: '#2B3E72',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: 8
              }}>
                {shoot.client_name || shoot.client}
              </div>
              <h3 style={{ 
                fontSize: 20, 
                fontWeight: 600, 
                color: '#1F2B4A',
                marginBottom: 12
              }}>
                {shoot.description?.split('\n\n')[0] || shoot.title}
              </h3>
              <div style={{ marginBottom: 16 }}>
                <div style={{ 
                  fontSize: 14, 
                  color: '#6B7280',
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <span>📅</span> {shoot.shoot_date || shoot.date}
                </div>
                <div style={{ 
                  fontSize: 14, 
                  color: '#6B7280',
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <span>📍</span> {shoot.location}
                </div>
                <div style={{ 
                  fontSize: 14, 
                  color: '#6B7280',
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <span>👥</span> {shoot.spots || 'Onbeperkt'} plekken beschikbaar
                </div>
                {shoot.compensation_type && (
                  <div style={{ 
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#2B3E72',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    {shoot.compensation_type === 'bedrag' && `💰 Vergoeding: €${shoot.compensation_amount}`}
                    {shoot.compensation_type === 'eten' && '🍽️ Eten wordt betaald'}
                    {shoot.compensation_type === 'cadeaubon' && `🎁 Cadeaubon: €${shoot.compensation_amount}`}
                    {shoot.compensation_type === 'geen' && '❌ Geen vergoeding'}
                  </div>
                )}
              </div>
              <p style={{ 
                fontSize: 14, 
                color: '#4B5563',
                lineHeight: 1.6,
                marginBottom: 16
              }}>
                {shoot.description?.split('\n\n').slice(1).join('\n\n') || shoot.description}
              </p>
              {(shoot.client_website || shoot.clientWebsite) && (
                <a
                  href={shoot.client_website || shoot.clientWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    fontSize: 13,
                    color: '#2B3E72',
                    textDecoration: 'none',
                    fontWeight: 500,
                    marginBottom: 16
                  }}
                >
                  🌐 Bezoek website van {shoot.client_name || shoot.client}
                </a>
              )}
              </div>
              <button
                onClick={() => {
                  setSelectedShoot(shoot.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#2B3E72',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontFamily: 'inherit',
                  marginTop: 'auto',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#1F2B4A';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#2B3E72';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                ✨ Meld je aan!
              </button>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-100% / 3));
          }
        }
        
        .logo-scroll {
          animation: scroll 30s linear infinite;
          will-change: transform;
        }

        .logo-scroll img {
          width: auto;
          object-fit: contain;
          filter: grayscale(100%);
        }

        .logo-small {
          height: 25px;
        }

        .logo-normal {
          height: 40px;
        }

        .logo-large {
          height: 50px;
        }

        .logo-xlarge {
          height: 60px;
        }
      `}</style>
    </div>
  );
}
