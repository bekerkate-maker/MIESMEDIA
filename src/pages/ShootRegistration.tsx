import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import MiesLogo from '@/components/MiesLogo';
import ClientLogoBanner from '@/components/ClientLogoBanner';

export default function ShootRegistration() {
  const [searchParams] = useSearchParams();
  const shootId = searchParams.get('shoot_id');
  const [selectedOption, setSelectedOption] = useState<'existing' | 'new' | null>(null);
  const [shoot, setShoot] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form data voor bestaand talent
  const [existingTalentData, setExistingTalentData] = useState({
    email: '',
    password: '',
    motivation: ''
  });

  // Password reset state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Fetch shoot details
  useEffect(() => {
    if (shootId) {
      const fetchShoot = async () => {
        const { data } = await supabase
          .from('shoots')
          .select('*')
          .eq('id', shootId)
          .single();
        if (data) setShoot(data);
      };
      fetchShoot();
    }
  }, [shootId]);

  const handleExistingTalentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Probeer in te loggen
      const email = existingTalentData.email.trim();

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: existingTalentData.password,
      });

      if (authError) {
        console.error('Login error detailed:', authError);
        throw new Error(`Inloggen mislukt: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('Geen gebruiker gevonden.');
      }

      // 2. Zoek het gekoppelde model profiel (op basis van user_id)
      let { data: models, error: searchError } = await supabase
        .from('models')
        .select('*')
        .eq('user_id', authData.user.id);

      if (!models || models.length === 0) {
        // Fallback: zoek op email (uniek)
        const result = await supabase
          .from('models')
          .select('*')
          .eq('email', existingTalentData.email);

        models = result.data;
        searchError = result.error;
      }

      if (searchError) throw searchError;

      if (!models || models.length === 0) {
        alert('Je bent ingelogd, maar we konden geen talent-profiel vinden dat aan dit account is gekoppeld. Neem contact op.');
        setLoading(false);
        return;
      }

      const model = models[0];

      // 3. Registreer voor de shoot
      const { error: regError } = await supabase
        .from('shoot_registrations')
        .insert([{
          shoot_id: shootId ? parseInt(shootId) : null,
          model_id: model.id,
          email: model.email,
          phone: model.phone,
          instagram: model.instagram,
          name: `${model.first_name || ''} ${model.last_name || ''}`.trim() || null,
          status: 'pending',
          motivation: existingTalentData.motivation || null
        }]);

      if (regError) {
        if (regError.code === '23505') {
          alert('Je bent al aangemeld voor deze shoot.');
        } else {
          throw regError;
        }
        setLoading(false);
        return;
      }

      setSubmitted(true);

      // Send email notification to hello@unposed.nl
      try {
        const talentName = `${model.first_name || ''} ${model.last_name || ''}`.trim() || 'Onbekend';
        const shootDate = shoot?.shoot_date
          ? new Date(shoot.shoot_date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
          : '';
        const shootTime = shoot?.start_time && shoot?.end_time
          ? `${shoot.start_time.slice(0, 5)} - ${shoot.end_time.slice(0, 5)} uur`
          : '';

        await supabase.functions.invoke('send-shoot-application-email', {
          body: {
            talentName,
            shootTitle: shoot?.title || '',
            shootDate,
            shootTime,
            shootLocation: shoot?.location || '',
            motivation: existingTalentData.motivation || ''
          }
        });
        console.log('Email notification sent successfully');
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't block the registration if email fails
      }
    } catch (error: any) {
      console.error('Error:', error);
      alert('Er ging iets mis: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewTalentClick = () => {
    // Redirect naar de registratie pagina met shoot_id
    window.location.href = `/register-model${shootId ? `?shoot_id=${shootId}` : ''}`;
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMessage(null);

    try {
      if (!resetEmail || !resetEmail.includes('@')) {
        throw new Error('Vul een geldig e-mailadres in.');
      }

      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setResetMessage({
        type: 'success',
        text: 'Als dit e-mailadres bij ons bekend is, ontvang je binnen enkele minuten een e-mail met instructies.'
      });
      setResetEmail('');
    } catch (err: any) {
      console.error('Password reset error:', err);
      setResetMessage({
        type: 'error',
        text: 'Er ging iets mis. Probeer het later opnieuw.'
      });
    } finally {
      setResetLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="registration-page success-page">
        <div className="success-container">
          <div className="logo-center">
            <MiesLogo size={120} />
          </div>
          <h1 className="success-title">Aanmelding geslaagd!</h1>
          <p className="success-text">
            We nemen zo snel mogelijk contact met je op.
          </p>
          <button onClick={() => { window.location.href = '/'; }} className="primary-btn">
            Terug naar openstaande shoots
          </button>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="registration-page">
      {/* Logo Banner */}
      <ClientLogoBanner />

      <div className="main-container">
        <div className="invite-card">
          {shoot && (
            <div className="card-header-split">
              {shoot.banner_photo_url ? (
                <div className="card-image-wrapper">
                  <img
                    src={shoot.banner_photo_url}
                    alt={shoot.title}
                    className="card-image"
                  />
                </div>
              ) : (
                <div className="card-image-placeholder">
                  <MiesLogo size={60} />
                </div>
              )}

              <div className="card-info">
                <div className="client-badge">{shoot.client_name}</div>
                <h1 className="shoot-title">{shoot.title}</h1>

                <div className="info-grid">
                  <div className="info-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    <span>{shoot.shoot_date && new Date(shoot.shoot_date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  {shoot.start_time && (
                    <div className="info-item">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      <span>{shoot.start_time.slice(0, 5)} - {shoot.end_time?.slice(0, 5)} uur</span>
                    </div>
                  )}
                  {shoot.location && (
                    <div className="info-item">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                      <span>{shoot.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="card-divider"></div>

          <div className="card-body">
            {!selectedOption ? (
              <div className="selection-view">
                <h2 className="section-title">Aanmelden</h2>
                <p className="section-subtitle">Kies een optie om verder te gaan</p>

                <div className="options-row">
                  <div className="compact-option" onClick={() => setSelectedOption('existing')}>
                    <div className="compact-option-content">
                      <h3>Ik ben al een Unposed talent</h3>
                      <p>Heb je al een account? Meld je direct aan.</p>
                    </div>
                    <div className="arrow-icon">→</div>
                  </div>

                  <div className="compact-option" onClick={handleNewTalentClick}>
                    <div className="compact-option-content">
                      <h3>Ik ben nieuw</h3>
                      <p>Nog geen account? Maak er gratis een aan.</p>
                    </div>
                    <div className="arrow-icon">→</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="form-view">
                <button
                  className="back-link"
                  onClick={() => setSelectedOption(null)}
                >
                  ← Terug
                </button>

                {selectedOption === 'existing' && (
                  !showForgotPassword ? (
                    <form onSubmit={handleExistingTalentSubmit} className="compact-form">
                      <h3 className="form-heading">Inloggen</h3>
                      <p className="section-subtitle" style={{ marginBottom: 20 }}>Log in met je account om je aan te melden.</p>

                      <div className="form-group">
                        <label>E-mailadres</label>
                        <input
                          required
                          type="email"
                          value={existingTalentData.email}
                          onChange={(e) => setExistingTalentData({ ...existingTalentData, email: e.target.value })}
                          placeholder="jan@example.com"
                        />
                      </div>

                      <div className="form-group">
                        <label>Wachtwoord</label>
                        <input
                          required
                          type="password"
                          placeholder="••••••••"
                          value={existingTalentData.password}
                          onChange={(e) => setExistingTalentData({ ...existingTalentData, password: e.target.value })}
                          style={{ width: '100%' }}
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
                              color: '#6B7280',
                              cursor: 'pointer',
                              textDecoration: 'underline',
                              fontFamily: 'inherit'
                            }}
                          >
                            Wachtwoord vergeten?
                          </button>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Motivatie</label>
                        <textarea
                          value={existingTalentData.motivation}
                          onChange={(e) => setExistingTalentData({ ...existingTalentData, motivation: e.target.value })}
                          placeholder="Korte toelichting..."
                          rows={2}
                        />
                      </div>

                      <button type="submit" disabled={loading} className="full-submit-btn">
                        {loading ? 'Bezig...' : 'Inloggen & Aanmelden'}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handlePasswordReset} className="compact-form">
                      <h3 className="form-heading">Wachtwoord herstellen</h3>
                      <p className="section-subtitle" style={{ marginBottom: 20 }}>
                        Vul je e-mailadres in om een herstellink te ontvangen.
                      </p>

                      <div className="form-group">
                        <label>E-mailadres</label>
                        <input
                          required
                          type="email"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          placeholder="jan@example.com"
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

                      <button type="submit" disabled={resetLoading} className="full-submit-btn" style={{ marginBottom: 12 }}>
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
                          color: '#6B7280',
                          fontSize: 14,
                          fontWeight: 500,
                          border: 'none',
                          cursor: 'pointer',
                          fontFamily: 'inherit'
                        }}
                      >
                        Terug naar inloggen
                      </button>
                    </form>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <MiesLogo size={40} />
        </div>
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
.registration-page {
  min-height: 100vh;
  background: #E5DDD5;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  color: #1F2B4A;
}

/* Logo Scroll Bar */


/* Main Layout */
.main-container {
  padding: 40px 20px;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  items-align: center;
}

.invite-card {
  background: #fff;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
  overflow: hidden;
}

/* Card Header Split */
.card-header-split {
  display: flex;
  flex-direction: row;
  height: 240px; /* Fixed height for consistency */
}

.card-image-wrapper {
  width: 40%;
  position: relative;
  background: #E5E7EB;
}

.card-image-placeholder {
  width: 40%;
  background: #F3F4F6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-info {
  width: 60%;
  padding: 32px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.client-badge {
  display: inline-block;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
  color: #6B7280;
  margin-bottom: 8px;
}

.shoot-title {
  font-size: 28px;
  font-weight: 800;
  color: #1F2B4A;
  margin: 0 0 16px 0;
  line-height: 1.2;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  color: #4B5563;
  font-weight: 500;
}
.info-item svg { color: #2B3E72; }

/* Divider */
.card-divider {
  height: 1px;
  background: #F3F4F6;
  width: 100%;
}

/* Body */
.card-body {
  padding: 32px;
  background: #FAFAFA;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: #1F2B4A;
  margin: 0 0 4px 0;
}

.section-subtitle {
  font-size: 14px;
  color: #6B7280;
  margin: 0 0 24px 0;
}

/* Options */
.options-row {
  display: flex;
  gap: 16px;
}

.compact-option {
  flex: 1;
  background: #fff;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.compact-option:hover {
  border-color: #2B3E72;
  box-shadow: 0 4px 12px rgba(43, 62, 114, 0.08);
  transform: translateY(-2px);
}

.compact-option-content h3 {
  font-size: 16px;
  font-weight: 700;
  color: #1F2B4A;
  margin: 0 0 4px 0;
}

.compact-option-content p {
  font-size: 13px;
  color: #6B7280;
  margin: 0;
  line-height: 1.4;
}

.arrow-icon {
  font-size: 20px;
  color: #D1D5DB;
  font-weight: bold;
  transition: color 0.2s;
}

.compact-option:hover .arrow-icon {
  color: #2B3E72;
}

/* Form View */
.back-link {
  background: none; border: none; padding: 0;
  color: #6B7280; font-weight: 600; font-size: 14px;
  cursor: pointer; margin-bottom: 24px;
  font-family: inherit;
  transition: color 0.2s;
}
.back-link:hover { color: #1F2B4A; }

.compact-form {
  max-width: 600px;
}

.form-heading {
  font-size: 18px; font-weight: 700; color: #1F2B4A; margin: 0 0 20px 0;
}

.compact-form-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block; font-size: 13px; font-weight: 600; color: #4B5563; margin-bottom: 6px;
}

.form-group input, .form-group textarea {
  width: 100%; padding: 10px 12px;
  background: #fff; border: 1px solid #D1D5DB;
  border-radius: 8px; font-size: 14px; font-family: inherit;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-group input:focus, .form-group textarea:focus {
  outline: none; border-color: #2B3E72;
}

.full-submit-btn {
  width: 100%; background: #2B3E72; color: #fff;
  padding: 14px; border: none; border-radius: 10px;
  font-weight: 600; font-size: 15px; cursor: pointer;
  transition: background 0.2s;
}
.full-submit-btn:hover { background: #1F2B4A; }

/* Mobile */
@media (max-width: 768px) {
  .card-header-split { flex-direction: column; height: auto; }
  .card-image-wrapper { width: 100%; height: 200px; }
  .card-info { width: 100%; padding: 24px; }
  .options-row { flex-direction: column; }
  .compact-form-grid { grid-template-columns: 1fr; gap: 0; margin-bottom: 0; }
  .logo-scroll img { height: 24px; }
  .logo-xlarge { height: 36px !important; }
}

/* Success Page Override */
.success-page {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
}
.success-container {
  text-align: center;
  max-width: 600px;
  padding: 40px 20px;
}
.primary-btn {
  padding: 14px 28px;
  background: #2B3E72;
  color: #fff;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  font-family: inherit;
  box-shadow: 0 4px 12px rgba(43, 62, 114, 0.2);
  transition: all 0.3s ease;
}

.primary-btn:hover {
  background: #1F2B4A;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(43, 62, 114, 0.25);
}
`;
