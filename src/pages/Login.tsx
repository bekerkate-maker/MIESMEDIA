import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import MiesLogo from '@/components/MiesLogo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Attempting login with email:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Login error details:', {
          message: error.message,
          status: error.status,
          name: error.name
        });
        throw error;
      }

      console.log('Login successful, user:', data.user?.id);

      // Forceer navigatie naar dashboard
      window.location.href = '/dashboard';
    } catch (error: any) {
      console.error('Login error:', error);
      alert(`Login mislukt: ${error.message}`);
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
          <h1 style={{ fontSize: 42, fontWeight: 700, margin: 0, color: '#1F2B4A', marginBottom: 8 }}>
            Welkom terug
          </h1>
          <p style={{ fontSize: 16, color: '#6B7280', margin: 0 }}>
            Log in met je accountgegevens
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ background: '#fff', padding: 48, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 15, color: '#1F2B4A', fontWeight: 500 }}>
              E-mailadres
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              Wachtwoord
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {loading ? 'Bezig met inloggen...' : 'Inloggen'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 14, color: '#6B7280', margin: 0 }}>
            Nog geen account? <a href="/register-employee" style={{ color: '#2B3E72', textDecoration: 'underline' }}>Maak een account aan</a>
          </p>
        </form>
      </div>
    </div>
  );
}
