import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import MiesLogo from '@/components/MiesLogo';

export default function RegisterEmployee() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: any) => {
    e.preventDefault();
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

      console.log('Auth user created:', authData.user?.id);
      console.log('User confirmed:', authData.user?.confirmed_at);

      if (!authData.user) {
        throw new Error('Geen gebruiker aangemaakt');
      }

      // 2. Voeg gebruiker toe aan employees tabel
      if (authData.user) {
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
          console.log('Attempting to send welcome email to:', email);
          console.log('Calling edge function: send-email');

          const emailResponse = await supabase.functions.invoke('send-email', {
            body: {
              name: name,
              email: email
            }
          });

          console.log('Email response:', emailResponse);
          console.log('Email response data:', emailResponse.data);
          console.log('Email response error:', emailResponse.error);

          if (emailResponse.error) {
            console.error('Email error details:', {
              message: emailResponse.error.message,
              context: emailResponse.error.context,
              name: emailResponse.error.name
            });
            alert('⚠️ Account aangemaakt, maar email kon niet worden verstuurd: ' + emailResponse.error.message);
          } else {
            console.log('✅ Welkomstmail verstuurd naar:', email);
            alert('✅ Account aangemaakt en welkomstmail verstuurd!');
          }
        } catch (emailError: any) {
          console.error('Failed to send welcome email:', emailError);
          console.error('Error details:', emailError.message, emailError.stack);
          alert('⚠️ Account aangemaakt, maar email kon niet worden verstuurd.');
        }
      }

      alert('✅ Account succesvol aangemaakt! Je wordt automatisch ingelogd...');

      // 4. Log automatisch in met de nieuwe credentials
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('Auto sign-in error:', signInError);
        alert('Account is aangemaakt, maar automatisch inloggen is mislukt. Probeer handmatig in te loggen op /login');
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
            <MiesLogo size={110} />
          </div>
          <h1 style={{ fontSize: 42, fontWeight: 700, margin: 0, color: '#050606', marginBottom: 8 }}>
            Collega registratie
          </h1>
          <p style={{ fontSize: 16, color: '#050606', margin: 0 }}>
            Maak een account aan om The Unposed Collective te beheren
          </p>
        </div>

        <form onSubmit={handleRegister} style={{ background: '#f8f7f2', padding: 48, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
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

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 15, color: '#050606', fontWeight: 500 }}>
              E-mailadres *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="naam@miesmedia.nl"
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
              Wachtwoord *
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
              background: '#402e27',
              color: '#f8f7f2',
              fontSize: 16,
              fontWeight: 600,
              border: 'none',
              borderRadius: 8,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              fontFamily: 'inherit',
              marginBottom: 20,
              boxSizing: 'border-box'
            }}
          >
            {loading ? 'Account aanmaken...' : 'Registreren'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 14, color: '#050606', margin: 0 }}>
            Al een account? <a href="/login" style={{ color: '#050606', textDecoration: 'underline' }}>Log in</a>
          </p>
        </form>
      </div>
    </div>
  );
}
