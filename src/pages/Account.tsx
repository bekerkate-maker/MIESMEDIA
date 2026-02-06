import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import UnposedLogo from '@/components/UnposedLogo';
import { useNavigate } from 'react-router-dom';
import ClientLogoBanner from '@/components/ClientLogoBanner';

function formatDateNL(dateString?: string, long: boolean = false): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  if (long) {
    return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

const Account: React.FC = () => {
  const navigate = useNavigate();
  // Auth state
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Profile state
  const [profile, setProfile] = useState<any>(null);


  // Shoots state
  const [myShoots, setMyShoots] = useState<any[]>([]);
  const [shootsLoading, setShootsLoading] = useState(false);
  const [openShoots, setOpenShoots] = useState<any[]>([]);
  const [selectedShoot, setSelectedShoot] = useState<any>(null);

  // Collapsible sections state
  const [isAgendaOpen, setIsAgendaOpen] = useState(false);
  const [isPendingOpen, setIsPendingOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    checkUser();
    fetchOpenShoots();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        fetchProfile(session.user);
      } else {
        setUser(null);
        setProfile(null);
        setMyShoots([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await fetchProfile(user);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (currentUser: any) => {
    try {
      // Probeer eerst op ID
      let { data, error } = await supabase
        .from('models')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      // Als niet gevonden op ID, probeer op email (fallback voor legacy accounts)
      if (!data || error) {
        const { data: emailData, error: emailError } = await supabase
          .from('models')
          .select('*')
          .eq('email', currentUser.email)
          .single();

        if (emailData) {
          data = emailData;
          error = null;
        }
      }

      if (data) {
        setProfile(data);
        // Haal ook de shoots op
        fetchMyShoots(data.id);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const fetchMyShoots = async (modelId: string) => {
    setShootsLoading(true);
    try {
      const { data, error } = await supabase
        .from('shoot_registrations')
        .select(`
          *,
          shoots (
            *
          )
        `)
        .eq('model_id', modelId);

      if (error) throw error;
      setMyShoots(data || []);
    } catch (err) {
      console.error('Error fetching shoots:', err);
    } finally {
      setShootsLoading(false);
    }
  };

  const fetchOpenShoots = async () => {
    try {
      const { data, error } = await supabase
        .from('shoots')
        .select('*')
        .order('shoot_date', { ascending: true });

      if (error) throw error;

      if (data) {
        const now = new Date();
        const future = data.filter(s => new Date(s.shoot_date) >= now);
        const past = data.filter(s => new Date(s.shoot_date) < now);

        // Future: ascending (already sorted by SQL)
        // Past: descending (most recent first)
        past.sort((a, b) => new Date(b.shoot_date).getTime() - new Date(a.shoot_date).getTime());

        setOpenShoots([...future, ...past]);
      } else {
        setOpenShoots([]);
      }
    } catch (err) {
      console.error('Error fetching open shoots:', err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      // Auth listener pikt de rest op
    } catch (err: any) {
      setLoginError('Inloggen mislukt. Controleer je gegevens');
    } finally {
      setLoggingIn(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMessage(null);

    try {
      // Validate email
      if (!resetEmail || !resetEmail.includes('@')) {
        throw new Error('Vul een geldig e-mailadres in');
      }

      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setResetMessage({
        type: 'success',
        text: 'Als dit e-mailadres bij ons bekend is, ontvang je binnen enkele minuten een e-mail met instructies om je wachtwoord te herstellen'
      });
      setResetEmail('');
    } catch (err: any) {
      console.error('Password reset error:', err);
      setResetMessage({
        type: 'error',
        text: 'Er ging iets mis bij het aanvragen van het wachtwoordherstel. Probeer het later opnieuw'
      });
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleCancelRegistration = async (registrationId: string, shootTitle: string, isRejection: boolean = false) => {
    const message = isRejection
      ? `Weet je zeker dat je "${shootTitle}" uit je geschiedenis wilt verwijderen?`
      : `Weet je zeker dat je je wilt afmelden voor "${shootTitle}"?`;

    if (!confirm(message)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('shoot_registrations')
        .delete()
        .eq('id', registrationId);

      if (error) throw error;

      // Refresh de shoots lijst
      if (profile?.id) {
        await fetchMyShoots(profile.id);
      }

      alert(isRejection ? 'Shoot succesvol verwijderd uit geschiedenis' : 'Je bent succesvol afgemeld voor deze shoot');
    } catch (err) {
      console.error('Error canceling registration:', err);
      alert('Er ging iets mis. Probeer het opnieuw');
    }
  };




  if (loading && !user) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#E5DDD5' }}>Laden...</div>;

  // LOGIN SCREEN
  if (!user) {
    return (
      <>
        <style>
          {`
            input:-webkit-autofill,
            input:-webkit-autofill:hover,
            input:-webkit-autofill:focus,
            input:-webkit-autofill:active {
              -webkit-box-shadow: 0 0 0 30px #E5DDD5 inset !important;
              -webkit-text-fill-color: #050606 !important;
            }
          `}
        </style>
        <div style={{
          minHeight: '100vh',
          background: '#E5DDD5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{ width: '100%', maxWidth: 480 }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                <UnposedLogo size={90} />
              </div>
              <h1 style={{ fontSize: 42, fontWeight: 700, margin: 0, color: '#050606', marginBottom: 8 }}>
                The Unposed Collective
              </h1>
              <p style={{ fontSize: 16, color: '#050606', margin: 0 }}>
                Log in met je accountgegevens
              </p>
            </div>

            {!showForgotPassword ? (
              <form onSubmit={handleLogin} style={{ background: '#f8f7f2', padding: 48, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 15, color: '#050606', fontWeight: 500 }}>
                    E-mailadres
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="naam@voorbeeld.nl"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      background: '#E5DDD5',
                      color: '#050606',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 15,
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: 32 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 15, color: '#050606', fontWeight: 500 }}>
                    Wachtwoord
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      background: '#E5DDD5',
                      color: '#050606',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 15,
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ textAlign: 'right', marginTop: 6 }}>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        fontSize: 13,
                        color: '#050606',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        fontFamily: 'inherit'
                      }}
                    >
                      Wachtwoord vergeten?
                    </button>
                  </div>
                </div>

                {loginError && (
                  <div style={{
                    background: '#FEF2F2',
                    color: '#DC2626',
                    padding: 12,
                    borderRadius: 8,
                    fontSize: 14,
                    marginBottom: 20,
                    textAlign: 'center'
                  }}>
                    {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loggingIn}
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: '#402e27',
                    color: '#f8f7f2',
                    fontSize: 16,
                    fontWeight: 600,
                    border: 'none',
                    borderRadius: 8,
                    cursor: loggingIn ? 'not-allowed' : 'pointer',
                    opacity: loggingIn ? 0.6 : 1,
                    fontFamily: 'inherit',
                    marginBottom: 20,
                    boxSizing: 'border-box'
                  }}
                >
                  {loggingIn ? 'Even geduld...' : 'Inloggen'}
                </button>

                <div style={{ textAlign: 'center', fontSize: 14, color: '#050606', margin: 0 }}>
                  Nog niet aangemeld als talent? <a href="/register-model" style={{ color: '#050606', textDecoration: 'underline' }}>Meld je hier aan</a>
                </div>
              </form>
            ) : (
              <form onSubmit={handlePasswordReset} style={{ background: '#f8f7f2', padding: 48, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 16px 0', color: '#050606' }}>
                    Wachtwoord herstellen
                  </h2>
                  <p style={{ fontSize: 15, color: '#050606', margin: '0 0 24px 0', lineHeight: 1.5 }}>
                    Vul hieronder je e-mailadres in. We sturen je een link om een nieuw wachtwoord in te stellen
                  </p>

                  <label style={{ display: 'block', marginBottom: 8, fontSize: 15, color: '#050606', fontWeight: 500 }}>
                    E-mailadres
                  </label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="naam@voorbeeld.nl"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      background: '#E5DDD5',
                      color: '#050606',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 15,
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {resetMessage && (
                  <div style={{
                    background: resetMessage.type === 'success' ? '#DCFCE7' : '#FEF2F2',
                    color: resetMessage.type === 'success' ? '#16A34A' : '#DC2626',
                    padding: 12,
                    borderRadius: 8,
                    fontSize: 14,
                    marginBottom: 20,
                    lineHeight: 1.4
                  }}>
                    {resetMessage.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={resetLoading}
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: '#402e27',
                    color: '#f8f7f2',
                    fontSize: 16,
                    fontWeight: 600,
                    border: 'none',
                    borderRadius: 8,
                    cursor: resetLoading ? 'not-allowed' : 'pointer',
                    opacity: resetLoading ? 0.6 : 1,
                    fontFamily: 'inherit',
                    marginBottom: 16,
                    boxSizing: 'border-box'
                  }}
                >
                  {resetLoading ? 'Bezig...' : 'Verstuur link'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetMessage(null);
                    setResetEmail('');
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'transparent',
                    color: '#050606',
                    fontSize: 15,
                    fontWeight: 500,
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  Terug naar inloggen
                </button>
              </form>
            )}
          </div>
        </div>
      </>
    );
  }

  // DASHBOARD SCREEN
  const futureShoots = myShoots.filter(s => {
    const shootDate = s.shoots?.shoot_date ? new Date(s.shoots.shoot_date) : null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (!shootDate) return false;
    const targetDate = new Date(shootDate);
    targetDate.setHours(0, 0, 0, 0);
    return targetDate >= now && s.status === 'accepted';
  });

  const pendingShoots = myShoots.filter(s => {
    const shootDate = s.shoots?.shoot_date ? new Date(s.shoots.shoot_date) : null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (!shootDate) return ['pending', 'selected', 'rejected_draft'].includes(s.status);
    const targetDate = new Date(shootDate);
    targetDate.setHours(0, 0, 0, 0);
    return ['pending', 'selected', 'rejected_draft'].includes(s.status) && targetDate >= now;
  });

  const pastShoots = myShoots.filter(s => {
    const shootDate = s.shoots?.shoot_date ? new Date(s.shoots.shoot_date) : null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Altijd in historie als weigeren of voltooid
    if (s.status === 'completed' || s.status === 'rejected') return true;

    // Anders alleen als de datum verstreken is
    if (!shootDate) return false;
    const targetDate = new Date(shootDate);
    targetDate.setHours(0, 0, 0, 0);
    return targetDate < now;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#E5DDD5', fontFamily: 'system-ui, -apple-system, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <ClientLogoBanner />
      <div className="account-header-container" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '32px 40px 16px 40px', position: 'relative', zIndex: 50, boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 13, color: '#050606', fontWeight: 500, textTransform: 'capitalize' }}>
            {formatDateNL(new Date().toISOString())}
          </div>
          <h2 style={{ fontSize: 24, color: '#050606', margin: 0, fontWeight: 700 }}>
            {profile?.first_name ? `Welkom ${profile.first_name}!` : 'Mijn account'}
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#050606', fontSize: 15 }}>
            Hier vind je al jouw aankomende shoots en aanvragen
          </p>
        </div>

        <div ref={menuRef} style={{ position: 'relative', marginTop: 4 }}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="account-icon-btn"
            style={{
              background: 'transparent',
              border: 'none',
              padding: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#050606'
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="account-icon-svg">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-2.5 3.5-4 8-4s8 1.5 8 4" />
            </svg>
          </button>

          {showMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 8,
              background: '#f8f7f2',
              borderRadius: 12,
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              minWidth: 200,
              overflow: 'hidden',
              padding: '8px 0',
              zIndex: 100
            }}>
              <button
                onClick={() => {
                  navigate('/edit-profile');
                  setShowMenu(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: '12px 20px',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: 15,
                  color: '#050606',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Profiel bewerken
              </button>

              <div style={{ height: 1, background: '#E5E7EB', margin: '4px 0' }}></div>

              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: '12px 20px',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: 15,
                  color: '#050606',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Uitloggen
              </button>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: '0 40px' }}>
        <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', width: '100%' }} />
      </div>
      <main style={{ maxWidth: '100%', margin: 0, padding: '40px 40px', width: '100%', boxSizing: 'border-box', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>


        {/* RECHTERKOLOM: Shoots */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Title container - can add filters or other header items here later */}
            <h2 style={{ fontSize: 28, color: '#050606', margin: 0 }}>Mijn shoots</h2>
          </div>



          <div className="shoots-grid">
            {/* Bevestigd / Toekomstig (Agenda) - Nu bovenaan */}
            <div className="section-card">
              <h3
                onClick={() => setIsAgendaOpen(!isAgendaOpen)}
                className="section-title"
                style={{ marginBottom: isAgendaOpen ? 16 : 0 }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#050606" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                Agenda ({futureShoots.length})
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ marginLeft: 'auto', transform: isAgendaOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </h3>
              {isAgendaOpen && (
                <>
                  {futureShoots.length === 0 ? (
                    <p style={{ color: '#050606', fontStyle: 'italic', fontSize: 14 }}>Geen shoots op de planning</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {futureShoots.map(reg => (
                        <div
                          key={reg.id}
                          className="account-shoot-card"
                          onClick={() => setSelectedShoot(reg.shoots)}
                        >
                          <div className="card-content">
                            {reg.shoots?.banner_photo_url ? (
                              <img
                                src={reg.shoots.banner_photo_url}
                                alt={reg.shoots.title}
                                className="card-image"
                              />
                            ) : (
                              <div className="card-image-placeholder" />
                            )}
                            <div>
                              <div className="card-title">{reg.shoots?.title}</div>
                              <div className="card-date">
                                {reg.shoots?.shoot_date ? formatDateNL(reg.shoots.shoot_date) : 'Datum onbekend'}
                                {reg.shoots?.time && ` • ${reg.shoots.time}`}
                              </div>
                              <div className="card-location">{reg.shoots?.location}</div>
                            </div>
                          </div>
                          <span className="status-badge confirmed">Bevestigd</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Aangemeld (In afwachting) */}
            <div className="section-card">
              <h3
                onClick={() => setIsPendingOpen(!isPendingOpen)}
                className="section-title"
                style={{ marginBottom: isPendingOpen ? 16 : 0 }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#050606" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                In afwachting ({pendingShoots.length})
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ marginLeft: 'auto', transform: isPendingOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </h3>
              {isPendingOpen && (
                <>
                  {pendingShoots.length === 0 ? (
                    <p style={{ color: '#050606', fontStyle: 'italic', fontSize: 14 }}>Geen openstaande aanmeldingen</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {pendingShoots.map(reg => (
                        <div
                          key={reg.id}
                          className="account-shoot-card"
                          onClick={() => setSelectedShoot(reg.shoots)}
                        >
                          <div className="card-content">
                            {reg.shoots?.banner_photo_url ? (
                              <img
                                src={reg.shoots.banner_photo_url}
                                alt={reg.shoots.title}
                                className="card-image"
                              />
                            ) : (
                              <div className="card-image-placeholder" />
                            )}
                            <div>
                              <div className="card-title">{reg.shoots?.title || 'Naamloze shoot'}</div>
                              <div className="card-date">
                                {reg.shoots?.shoot_date ? formatDateNL(reg.shoots.shoot_date) : 'Datum onbekend'}
                                {reg.shoots?.time && ` • ${reg.shoots.time}`}
                              </div>
                              <div className="card-location">{reg.shoots?.location}</div>
                            </div>
                          </div>

                          <div className="status-badge-container">
                            <span className="status-badge pending">Aangemeld</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelRegistration(reg.id, reg.shoots?.title || 'deze shoot');
                              }}
                              className="cancel-btn"
                              title="Meld je af"
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Afgerond */}
            <div className="section-card" style={{ opacity: 0.8 }}>
              <h3
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                className="section-title"
                style={{ marginBottom: isHistoryOpen ? 16 : 0 }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#050606" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                Afgerond / Historie ({pastShoots.length})
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ marginLeft: 'auto', transform: isHistoryOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </h3>
              {isHistoryOpen && (
                <>
                  {pastShoots.length === 0 ? (
                    <p style={{ color: '#050606', fontStyle: 'italic', fontSize: 14 }}>Nog geen historie</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {pastShoots.map(reg => (
                        <div
                          key={reg.id}
                          className="account-shoot-card"
                          onClick={() => setSelectedShoot(reg.shoots)}
                        >
                          <div className="card-content">
                            {reg.shoots?.banner_photo_url ? (
                              <img
                                src={reg.shoots.banner_photo_url}
                                alt={reg.shoots.title}
                                className="card-image"
                              />
                            ) : (
                              <div className="card-image-placeholder" />
                            )}
                            <div>
                              <div className="card-title">{reg.shoots?.title}</div>
                              <div style={{ fontSize: 13, color: '#050606' }}>
                                {reg.shoots?.shoot_date ? new Date(reg.shoots.shoot_date).toLocaleDateString('nl-NL') : 'Datum onbekend'}
                              </div>
                            </div>
                          </div>

                          {reg.status === 'rejected' ? (
                            <div className="status-badge-container">
                              <span className="status-badge rejected">
                                Niet geselecteerd
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelRegistration(reg.id, reg.shoots?.title || 'deze shoot', true);
                                }}
                                className="cancel-btn"
                                title="Verwijder uit geschiedenis"
                              >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="18" y1="6" x2="6" y2="18"></line>
                                  <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                              </button>
                            </div>
                          ) : (
                            /* For non-rejected history items (completed/expired), just show the badge, possibly wrapped so layout is consistent if needed or just absolute/flexed as per css */
                            <span
                              className={`status-badge ${reg.status === 'rejected' ? 'rejected' : 'expired'}`}
                            >
                              {reg.status === 'completed' ? 'Afgerond' : (reg.status === 'rejected' ? 'Niet geselecteerd' : 'Verlopen')}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

          </div>
        </div>
      </main >

      {/* FOOTER BANNER: OPEN SHOOTS */}
      {
        openShoots.length > 0 && (
          <div style={{ width: '100%', padding: '20px 0 0 0', marginTop: 'auto' }}>
            <h3 style={{ fontSize: 20, color: '#050606', marginBottom: 8, paddingLeft: 20 }}>
              Bekijk openstaande shoots
            </h3>
            <div style={{ height: 1, background: 'rgba(0,0,0,0.1)', margin: '0 20px 24px 20px' }} />
            <div
              style={{
                display: 'flex',
                gap: 16,
                overflowX: 'auto',
                paddingLeft: 20,
                paddingRight: 20,
                paddingBottom: 24,
                paddingTop: 10,
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none', // Firefox
                msOverflowStyle: 'none'  // IE/Edge
              }}
              className="hide-scrollbar"
            >
              {openShoots.map(shoot => {
                const isExpired = new Date(shoot.shoot_date) < new Date();
                return (
                  <div
                    key={shoot.id}
                    onClick={() => navigate('/open-shoots')}
                    style={{
                      minWidth: 280,
                      maxWidth: 280,
                      background: '#f8f7f2',
                      borderRadius: 12,
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 -5px 15px -5px rgba(0, 0, 0, 0.04)',
                      padding: 16,
                      cursor: isExpired ? 'default' : 'pointer',
                      transition: 'all 0.2s ease',
                      flexShrink: 0,
                      opacity: isExpired ? 0.6 : 1,
                      filter: isExpired ? 'grayscale(100%)' : 'none'
                    }}
                    onMouseEnter={e => !isExpired && (e.currentTarget.style.transform = 'translateY(-4px)')}
                    onMouseLeave={e => !isExpired && (e.currentTarget.style.transform = 'none')}
                  >
                    {shoot.banner_photo_url && (
                      <div style={{ height: 120, overflow: 'hidden', borderTopLeftRadius: 12, borderTopRightRadius: 12, marginBottom: 12, margin: '-16px -16px 12px -16px', position: 'relative' }}>
                        <img
                          src={shoot.banner_photo_url}
                          alt={shoot.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        {isExpired && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ background: 'rgba(0,0,0,0.6)', color: '#f8f7f2', padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>Verlopen</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div style={{ fontWeight: 600, color: '#050606', marginBottom: 4 }}>
                      {shoot.title}
                    </div>
                    <div style={{ fontSize: 13, color: '#050606', marginBottom: 8 }}>
                      {shoot.shoot_date ? new Date(shoot.shoot_date).toLocaleDateString('nl-NL') : 'Datum onbekend'}
                      {shoot.time ? ` • ${shoot.time}` : ''}
                    </div>
                    <div style={{ fontSize: 13, color: '#050606', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      {shoot.location || 'Locatie onbekend'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      }

      {
        selectedShoot && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(248, 247, 242, 0.4)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }} onClick={() => setSelectedShoot(null)}>
            <div style={{
              background: '#f8f7f2',
              borderRadius: 16,
              maxWidth: 500,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              position: 'relative'
            }} onClick={e => e.stopPropagation()} className="hide-scrollbar">
              <button
                onClick={() => setSelectedShoot(null)}
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  background: 'rgba(0,0,0,0.5)',
                  border: 'none',
                  color: '#f8f7f2',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>

              {selectedShoot.banner_photo_url && (
                <div style={{ height: 200, width: '100%' }}>
                  <img src={selectedShoot.banner_photo_url} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              <div style={{ padding: 24 }}>
                <div style={{ fontSize: 13, color: '#050606', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                  {selectedShoot.client_name || selectedShoot.client}
                </div>

                <div style={{ fontSize: 12, color: (selectedShoot.shoot_date && new Date(selectedShoot.shoot_date) < new Date()) ? '#DC2626' : '#16A34A', fontWeight: 500, marginBottom: 4 }}>
                  {selectedShoot.shoot_date && new Date(selectedShoot.shoot_date) < new Date() ? 'Verlopen' : 'Open'}
                </div>

                <h3 style={{ fontSize: 22, fontWeight: 700, color: '#050606', marginBottom: 16, marginTop: 0 }}>
                  {selectedShoot.title}
                </h3>

                <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#050606' }}>
                    <span style={{ fontSize: 18, color: '#050606', width: 20, textAlign: 'center' }}>•</span>
                    {formatDateNL(selectedShoot.shoot_date)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#050606' }}>
                    <span style={{ fontSize: 18, color: '#050606', width: 20, textAlign: 'center' }}>•</span>
                    {(() => {
                      if (selectedShoot.start_time && selectedShoot.end_time) {
                        return `${selectedShoot.start_time.substring(0, 5)} - ${selectedShoot.end_time.substring(0, 5)}`;
                      }
                      if (selectedShoot.start_time) {
                        return selectedShoot.start_time.substring(0, 5);
                      }
                      if (selectedShoot.shoot_time && selectedShoot.shoot_time.trim() !== '') {
                        return selectedShoot.shoot_time;
                      }
                      return 'Tijd onbekend';
                    })()}
                  </div>
                  {selectedShoot.location && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#050606' }}>
                      <span style={{ fontSize: 18, color: '#050606', width: 20, textAlign: 'center' }}>•</span>
                      {selectedShoot.location}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#050606' }}>
                    <span style={{ fontSize: 18, color: '#050606', width: 20, textAlign: 'center' }}>•</span>
                    {(() => {
                      if (selectedShoot.compensation_type === 'financiële vergoeding') return `Financiële vergoeding t.w.v. €${selectedShoot.compensation_amount}`;
                      if (selectedShoot.compensation_type === 'cadeaubon') return `Cadeaubon t.w.v. €${selectedShoot.compensation_amount}${selectedShoot.compensation_business_name ? ` bij ${selectedShoot.compensation_business_name}` : ''}`;
                      if (selectedShoot.compensation_type === 'geen') return `Geen vergoeding`;
                      // Fallback voor oude data
                      if (selectedShoot.compensation_type === 'bedrag') return `€${selectedShoot.compensation_amount}`;
                      if (selectedShoot.compensation_type === 'eten') return `Eten betaald`;
                      return 'Geen vergoeding ingevuld';
                    })()}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#050606' }}>
                    <span style={{ fontSize: 18, color: '#050606', width: 20, textAlign: 'center' }}>•</span>
                    {typeof selectedShoot.spots !== 'undefined' ? `${selectedShoot.spots} plekken beschikbaar` : 'Aantal plekken onbekend'}
                  </div>
                </div>

                {selectedShoot.description && (
                  <p style={{ fontSize: 14, color: '#050606', lineHeight: 1.6, marginBottom: 24 }}>
                    {(() => {
                      if (selectedShoot.description && selectedShoot.title && selectedShoot.description.toLowerCase().startsWith(selectedShoot.title.toLowerCase())) {
                        return selectedShoot.description.slice(selectedShoot.title.length).replace(/^\s*[,-:\.]?\s*/, '');
                      }
                      return selectedShoot.description;
                    })()}
                  </p>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedShoot.moodboard_link && (
                    <a
                      href={selectedShoot.moodboard_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 15, color: '#050606', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                      <span style={{ fontSize: 18, color: '#050606', width: 20, textAlign: 'center' }}>•</span> Bekijk moodboard →
                    </a>
                  )}
                  {selectedShoot.client_website && (
                    <a
                      href={selectedShoot.client_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 15, color: '#050606', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                      <span style={{ fontSize: 18, color: '#050606', width: 20, textAlign: 'center' }}>•</span> Bekijk website →
                    </a>
                  )}
                  {selectedShoot.client_instagram && (
                    <a
                      href={`https://instagram.com/${selectedShoot.client_instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 15, color: '#050606', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                      <span style={{ fontSize: 18, color: '#050606', width: 20, textAlign: 'center' }}>•</span> {selectedShoot.client_instagram.startsWith('@') ? selectedShoot.client_instagram : '@' + selectedShoot.client_instagram}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      }

      <style>{`
          .shoots-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
            align-items: start;
          }

          @media (max-width: 1100px) {
            .shoots-grid {
              grid-template-columns: 1fr !important;
            }
          }
          
          .section-card {
            background: #f8f7f2;
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          }

          .section-title {
            margin-top: 0;
            color: #050606;
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            user-select: none;
            font-size: 18px;
            font-weight: 700;
          }

          .account-shoot-card {
            border: 2px solid #fff;
            border-radius: 12px;
            padding: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #E5DDD5;
            cursor: pointer;
            transition: all 0.2s;
            position: relative;
          }

          .account-shoot-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          }

          .card-content {
            display: flex;
            align-items: center;
            gap: 16px;
            flex: 1;
          }

          .card-image {
            width: 80px;
            height: 60px;
            object-fit: cover;
            border-radius: 8px;
            flex-shrink: 0;
          }

          .card-image-placeholder {
            width: 80px;
            height: 60px;
            background: #E5E7EB;
            border-radius: 8px;
            flex-shrink: 0;
          }

          .card-title {
            font-weight: 600;
            color: #050606;
            font-size: 15px;
          }

          .card-date, .card-location {
            font-size: 13px;
            color: #050606;
          }
          .card-location {
            margin-top: 2px;
            color: #050606;
          }

          .status-badge-container {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .status-badge {
            font-size: 12px;
            padding: 4px 12px;
            border-radius: 99px;
            font-weight: 500;
            white-space: nowrap;
          }
/* ... skipped lines ... */
          .cancel-btn {
            background: transparent;
            border: none;
            padding: 8px;
            color: #050606;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
          }
/* ... skipped lines ... */
          @media (max-width: 768px) {
            .content-section { padding: 20px 16px }
            .section-card { padding: 16px; }
            .section-title { font-size: 16px; }

            .account-shoot-card {
              flex-direction: column;
              align-items: flex-start;
              gap: 12px;
            }

            .card-content {
              width: 100%;
            }

            .status-badge-container {
              width: 100%;
              justify-content: space-between;
              border-top: 1px solid #E5E7EB;
              padding-top: 6px;
              margin-top: 0px;
            }

            /* For confirmed/history badges within card */
            .account-shoot-card > .status-badge {
              align-self: flex-start;
              margin-top: 4px;
            }
            
            /* Specific fix for the absolute positioned badge in desktop */
            /* We removed position absolute in JS, controlled by class now */

            .account-header-container {
              padding: 24px 20px 16px 20px !important;
            }
            
            .account-icon-btn {
              padding: 4px !important;
              margin-top: -4px;
              margin-right: -8px; /* Push more to right */
            }
            
            .account-icon-svg {
              width: 26px !important;
              height: 26px !important;
              stroke-width: 2 !important; /* Slightly thinner stroke for smaller icon */
            }
          }

          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>
    </div >
  );
};



const shootCardStyle = {
  border: '1px solid #E5E7EB',
  borderRadius: 12,
  padding: 16,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: '#E5DDD5'
};

export default Account;
