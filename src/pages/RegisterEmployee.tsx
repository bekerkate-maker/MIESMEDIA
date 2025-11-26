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
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) throw error;

      alert('✅ Account succesvol aangemaakt! Je wordt nu doorgestuurd naar het dashboard.');
      navigate('/dashboard');
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
          <h1 style={{ fontSize: 42, fontWeight: 700, margin: 0, color: '#1F2B4A', marginBottom: 8 }}>
            Collega registratie
          </h1>
          <p style={{ fontSize: 16, color: '#6B7280', margin: 0 }}>
            Maak een account aan om de modellendatabase te beheren
          </p>
        </div>

        <form onSubmit={handleRegister} style={{ background: '#fff', padding: 48, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 15, color: '#1F2B4A', fontWeight: 500 }}>
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
                color: '#1F2B4A', 
                border: 'none',
                borderRadius: 8,
                fontSize: 15,
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 15, color: '#1F2B4A', fontWeight: 500 }}>
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
                color: '#1F2B4A', 
                border: 'none',
                borderRadius: 8,
                fontSize: 15,
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: 32 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 15, color: '#1F2B4A', fontWeight: 500 }}>
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
                color: '#1F2B4A', 
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
              background: '#2B3E72', 
              color: '#fff',
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

          <p style={{ textAlign: 'center', fontSize: 14, color: '#6B7280', margin: 0 }}>
            Al een account? <a href="/login" style={{ color: '#2B3E72', textDecoration: 'underline' }}>Log in</a>
          </p>
        </form>
      </div>
    </div>
  );
}
