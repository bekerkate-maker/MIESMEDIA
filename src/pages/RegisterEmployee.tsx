import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import UnposedLogo from '@/components/UnposedLogo';

export default function RegisterEmployee() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequestCode = async (e: any) => {
    e.preventDefault();
    if (!name || !email) return;
    setLoading(true);

    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setVerificationCode(code);

      console.log('Requesting verification code for:', email);

      const emailResponse = await supabase.functions.invoke('send-email', {
        body: {
          name: name,
          email: email,
          code: code,
          type: 'verification'
        }
      });

      if (emailResponse.error) throw emailResponse.error;

      setStep(2);
      alert('✅ Er is een bericht gestuurd naar hello@unposed.nl. Vraag je collega om de verificatiecode die zij hebben ontvangen.');
    } catch (error: any) {
      console.error('Error requesting code:', error);
      alert('Fout bij het aanvragen van de code: ' + (error.message || 'Probeer het opnieuw.'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: any) => {
    e.preventDefault();
    if (inputCode !== verificationCode) {
      alert('❌ Onjuiste verificatiecode. Controleer de code en probeer het opnieuw.');
      return;
    }

    setLoading(true);

    try {
      console.log('Starting registration for:', email);

      // 1. Maak gebruiker aan in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (authError) {
        console.error('Auth signup error:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Geen gebruiker aangemaakt');
      }

      // 2. Voeg gebruiker toe aan employees tabel
      const { error: dbError } = await supabase
        .from('employees')
        .insert([
          {
            user_id: authData.user.id,
            name: name,
            email: email,
            role: 'employee'
          }
        ]);

      if (dbError) {
        console.error('Database insert error:', dbError);
        throw new Error('Fout bij opslaan in database: ' + dbError.message);
      }

      // 3. Verstuur welkomstmail naar de nieuwe collega
      try {
        await supabase.functions.invoke('send-email', {
          body: {
            name: name,
            email: email,
            type: 'welcome'
          }
        });
      } catch (emailError: any) {
        console.error('Failed to send welcome email:', emailError);
      }

      alert('✅ Account succesvol aangemaakt! Je wordt nu ingelogd...');

      // 4. Log automatisch in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        navigate('/login');
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      alert(error.message || 'Er ging iets mis. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  return (
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
            <UnposedLogo size={110} />
          </div>
          <h1 style={{ fontSize: 42, fontWeight: 700, margin: 0, color: '#050606', marginBottom: 8 }}>
            Collega registratie
          </h1>
          <p style={{ fontSize: 16, color: '#050606', margin: 0 }}>
            {step === 1
              ? 'Vul je gegevens in om de registratie te starten'
              : 'Verifieer je account om de registratie te voltooien'}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleRequestCode} style={{ background: '#f8f7f2', padding: 48, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 15, color: '#050606', fontWeight: 500 }}>
                Volledige naam *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Voor- en achternaam"
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
                E-mailadres *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="naam@unposed.nl"
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

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                background: '#402e27',
                color: '#f8f7f2',
                fontSize: 16,
                fontWeight: 600,
                border: 'none',
                borderRadius: 8,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            >
              {loading ? 'Code aanvragen...' : 'Code aanvragen'}
            </button>
            <p style={{ textAlign: 'center', fontSize: 14, color: '#050606', marginTop: 20 }}>
              Al een account? <a href="/login" style={{ color: '#050606', textDecoration: 'underline' }}>Log in</a>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister} style={{ background: '#f8f7f2', padding: 48, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 15, color: '#050606', fontWeight: 500 }}>
                Verificatiecode *
              </label>
              <input
                type="text"
                required
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="6-cijferige code"
                maxLength={6}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: '#E5DDD5',
                  color: '#050606',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 24,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  letterSpacing: '5px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />
              <p style={{ fontSize: 13, color: '#6B7280', marginTop: 8 }}>
                De code is gestuurd naar hello@unposed.nl
              </p>
            </div>

            <div style={{ marginBottom: 32 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 15, color: '#050606', fontWeight: 500 }}>
                Kies een wachtwoord *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimaal 6 tekens"
                minLength={6}
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

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                background: '#16A34A',
                color: '#f8f7f2',
                fontSize: 16,
                fontWeight: 600,
                border: 'none',
                borderRadius: 8,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            >
              {loading ? 'Account aanmaken...' : 'Registratie voltooien'}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'transparent',
                color: '#402e27',
                fontSize: 14,
                border: 'none',
                cursor: 'pointer',
                marginTop: 12,
                fontFamily: 'inherit',
                textDecoration: 'underline'
              }}
            >
              Terug naar stap 1
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
