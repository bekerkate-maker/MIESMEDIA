import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import MiesLogo from '@/components/MiesLogo';
import logoCasu from '@/components/logo_klanten/logo_casu.png';
import logoKoekela from '@/components/logo_klanten/logo-koekela-winkels-denieuwebinnenweg.png';
import logoJordys from '@/components/logo_klanten/JORDYS_LOGO.png';
import logoMorganMees from '@/components/logo_klanten/morganmees_logo.png';
import logoDudok from '@/components/logo_klanten/dudok_logo.png';

export default function ShootRegistration() {
  const [searchParams] = useSearchParams();
  const shootId = searchParams.get('shoot_id');
  const [selectedOption, setSelectedOption] = useState<'existing' | 'new' | null>(null);
  const [shoot, setShoot] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form data voor bestaand talent
  const [existingTalentData, setExistingTalentData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    motivation: ''
  });

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
      // Zoek het model op basis van email en naam
      const { data: models, error: searchError } = await supabase
        .from('models')
        .select('*')
        .eq('email', existingTalentData.email)
        .eq('first_name', existingTalentData.firstName)
        .eq('last_name', existingTalentData.lastName);

      if (searchError) throw searchError;

      if (!models || models.length === 0) {
        alert('We kunnen je niet vinden in ons systeem. Registreer je eerst als nieuw talent.');
        setLoading(false);
        return;
      }

      const model = models[0];

      // Registreer voor de shoot
      const { error: regError } = await supabase
        .from('shoot_registrations')
        .insert([{
          shoot_id: shootId ? parseInt(shootId) : null,
          model_id: model.id,
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

  if (submitted) {
    return (
      <div className="registration-page success-page">
        <div className="success-container">
          <div className="logo-center">
            <MiesLogo size={120} />
          </div>
          <h1 className="success-title">Aanmelding geslaagd</h1>
          <p className="success-text">
            Je bent succesvol aangemeld voor deze shoot. We nemen zo snel mogelijk contact met je op.
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
      <div className="logo-banner">
        <div className="logo-banner-inner">
          <div className="logo-scroll">
            {[...Array(4)].map((_, i) => (
              <React.Fragment key={i}>
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
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="content-section">
        <div className="header-section">
          <div className="logo-center">
            <MiesLogo size={110} />
          </div>
          {shoot && (
            <div className="shoot-info">
              <h2 className="shoot-name">{shoot.title || shoot.client_name}</h2>
              <p className="shoot-details">
                {shoot.shoot_date && new Date(shoot.shoot_date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          )}
          <h1 className="main-title">Meld je aan voor deze shoot</h1>
          <p className="subtitle">Kies hoe je je wilt aanmelden</p>
        </div>

        {!selectedOption ? (
          <div className="options-container">
            <div className="option-card" onClick={() => setSelectedOption('existing')}>
              <div className="option-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#2B3E72" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <h3 className="option-title">Ik ben al een talent</h3>
              <p className="option-description">Meld je snel aan met je gegevens</p>
              <button className="option-btn">Aanmelden</button>
            </div>

            <div className="option-card" onClick={handleNewTalentClick}>
              <div className="option-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#2B3E72" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <line x1="19" y1="8" x2="19" y2="14"></line>
                  <line x1="22" y1="11" x2="16" y2="11"></line>
                </svg>
              </div>
              <h3 className="option-title">Ik ben een nieuw talent</h3>
              <p className="option-description">Registreer je eerst in ons systeem</p>
              <button className="option-btn">Registreren</button>
            </div>
          </div>
        ) : (
          <div className="form-wrapper">
            <button
              className="back-btn"
              onClick={() => setSelectedOption(null)}
            >
              ← Terug naar keuzemenu
            </button>

            {selectedOption === 'existing' && (
              <form onSubmit={handleExistingTalentSubmit} className="registration-form">
                <h2 className="form-title">Aanmelden als bestaand talent</h2>
                <p className="form-subtitle">Vul je gegevens in zoals je ze hebt geregistreerd</p>

                <div className="form-row">
                  <div className="form-field">
                    <label>Voornaam *</label>
                    <input
                      required
                      type="text"
                      value={existingTalentData.firstName}
                      onChange={(e) => setExistingTalentData({ ...existingTalentData, firstName: e.target.value })}
                      placeholder="Bijv. Jan"
                    />
                  </div>
                  <div className="form-field">
                    <label>Achternaam *</label>
                    <input
                      required
                      type="text"
                      value={existingTalentData.lastName}
                      onChange={(e) => setExistingTalentData({ ...existingTalentData, lastName: e.target.value })}
                      placeholder="Bijv. Jansen"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>E-mailadres *</label>
                    <input
                      required
                      type="email"
                      value={existingTalentData.email}
                      onChange={(e) => setExistingTalentData({ ...existingTalentData, email: e.target.value })}
                      placeholder="jan@voorbeeld.nl"
                    />
                  </div>
                  <div className="form-field">
                    <label>Telefoonnummer *</label>
                    <input
                      required
                      type="tel"
                      value={existingTalentData.phone}
                      onChange={(e) => setExistingTalentData({ ...existingTalentData, phone: e.target.value })}
                      placeholder="06 12345678"
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label>Motivatie *</label>
                  <textarea
                    required
                    value={existingTalentData.motivation}
                    onChange={(e) => setExistingTalentData({ ...existingTalentData, motivation: e.target.value })}
                    placeholder="Waarom wil je graag meedoen aan deze shoot?"
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: '#E5DDD5',
                      color: '#1F2B4A',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '15px',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <button type="submit" disabled={loading} className={`submit-btn ${loading ? 'disabled' : ''}`}>
                  {loading ? 'Bezig met aanmelden...' : 'Aanmelden voor shoot'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
.registration-page {
  min-height: 100vh;
  background: #E5DDD5;
  font-family: system-ui, -apple-system, sans-serif;
}

.success-page {
  display: flex;
  align-items: center;
  justify-content: center;
}

.success-container {
  text-align: center;
  padding: 20px;
  max-width: 500px;
}

.success-title {
  font-size: 42px;
  margin-bottom: 16px;
  color: #1F2B4A;
  font-weight: 700;
}

.success-text {
  font-size: 20px;
  color: #1F2B4A;
  font-weight: 500;
  margin-bottom: 32px;
}

.logo-center {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.logo-banner {
  background: #fff;
  padding: 12px 0;
  overflow: hidden;
  position: relative;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  min-height: 60px;
}

.logo-banner-inner {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
}

.logo-scroll {
  display: flex;
  gap: 60px;
  align-items: center;
  /* padding-right verwijderd omdat we nu naadloos loopen met duplicate content */
  animation: scroll 60s linear infinite; /* Langzamer omdat de strip langer is */
  will-change: transform;
  white-space: nowrap; /* Voorkom wrapping */
}

.logo-scroll img {
  width: auto;
  object-fit: contain;
  filter: grayscale(100%);
  flex-shrink: 0; /* Voorkom dat images krimpen */
}

.logo-small { height: 25px; }
.logo-normal { height: 40px; }
.logo-large { height: 50px; }
.logo-xlarge { height: 60px; }

@keyframes scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-25%); } /* Scroll precies een kwart (één set van de 4) */
}

.content-section {
  padding: 60px 20px;
}

.header-section {
  text-align: center;
  margin-bottom: 40px;
}

.shoot-info {
  margin-bottom: 24px;
}

.shoot-name {
  font-size: 24px;
  font-weight: 600;
  color: #2B3E72;
  margin: 0 0 8px 0;
}

.shoot-details {
  font-size: 16px;
  color: #6B7280;
  margin: 0;
}

.main-title {
  font-size: 42px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: #1F2B4A;
}

.subtitle {
  font-size: 16px;
  color: #6B7280;
  margin: 0;
}

.options-container {
  max-width: 900px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 32px;
}

.option-card {
  background: #fff;
  border-radius: 16px;
  padding: 48px 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.option-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

.option-icon {
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.option-title {
  font-size: 24px;
  font-weight: 700;
  color: #1F2B4A;
  margin: 0 0 12px 0;
}

.option-description {
  font-size: 16px;
  color: #6B7280;
  margin: 0 0 24px 0;
}

.option-btn {
  padding: 12px 32px;
  background: #2B3E72;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  font-family: inherit;
  transition: all 0.3s ease;
}

.option-btn:hover {
  background: #1F2B4A;
}

.form-wrapper {
  max-width: 800px;
  margin: 0 auto;
}

.back-btn {
  background: none;
  border: none;
  color: #2B3E72;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 24px;
  padding: 8px 0;
  font-family: inherit;
  transition: color 0.2s;
}

.back-btn:hover {
  color: #1F2B4A;
}

.registration-form {
  background: #fff;
  padding: 48px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.form-title {
  font-size: 28px;
  font-weight: 700;
  color: #1F2B4A;
  margin: 0 0 8px 0;
}

.form-subtitle {
  font-size: 16px;
  color: #6B7280;
  margin: 0 0 32px 0;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.form-field {
  margin-bottom: 24px;
}

.form-row .form-field {
  margin-bottom: 0;
}

.form-field label {
  display: block;
  margin-bottom: 8px;
  font-size: 15px;
  color: #1F2B4A;
  font-weight: 500;
}

.form-field input {
  width: 100%;
  padding: 12px 16px;
  background: #E5DDD5;
  color: #1F2B4A;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-family: inherit;
  box-sizing: border-box;
}

.form-field input::placeholder {
  color: #9CA3AF;
}

.submit-btn {
  width: 100%;
  padding: 16px;
  background: #2B3E72;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.3s ease;
}

.submit-btn:hover {
  background: #1F2B4A;
}

.submit-btn.disabled {
  background: #9CA3AF;
  cursor: not-allowed;
  opacity: 0.6;
}

.primary-btn {
  padding: 12px 24px;
  background: #2B3E72;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

.primary-btn:hover {
  background: #1F2B4A;
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .content-section {
    padding: 20px 12px;
  }

  .main-title {
    font-size: 28px;
  }

  .options-container {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .option-card {
    padding: 32px 24px;
  }

  .option-icon {
    font-size: 48px;
  }

  .registration-form {
    padding: 24px 16px;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
    margin-bottom: 0;
  }

  .form-row .form-field {
    margin-bottom: 16px;
  }

  .success-title {
    font-size: 28px;
  }

  .success-text {
    font-size: 16px;
  }
}
`;
