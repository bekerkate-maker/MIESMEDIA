import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import MiesLogo from '@/components/MiesLogo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
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

  const handleForgotPassword = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      alert('✅ Wachtwoord reset link is verzonden naar je e-mailadres!');
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (error: any) {
      console.error('Password reset error:', error);
      alert(`Fout bij wachtwoord reset: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

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
              <MiesLogo size={90} />
            </div>
            <h1 style={{ fontSize: 42, fontWeight: 700, margin: 0, color: '#050606', marginBottom: 8 }}>
              Welkom terug
            </h1>
            <p style={{ fontSize: 16, color: '#050606', margin: 0 }}>
              Log in met je accountgegevens
            </p>
          </div>

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
              {loading ? 'Bezig met inloggen...' : 'Inloggen'}
            </button>

            <p style={{ textAlign: 'center', fontSize: 14, color: '#050606', margin: 0 }}>
              Nog geen account? <a href="/register-employee" style={{ color: '#050606', textDecoration: 'underline' }}>Maak een account aan</a>
            </p>
          </form>
        </div>

        {/* Forgot Password Modal */}
        {showForgotPassword && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: 20
            }}
            onClick={() => setShowForgotPassword(false)}
          >
            <div
              style={{
                background: '#f8f7f2',
                borderRadius: 12,
                padding: 40,
                maxWidth: 480,
                width: '100%',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
              }}
              onClick={e => e.stopPropagation()}
            >
              <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 8, color: '#050606' }}>
                Wachtwoord vergeten?
              </h2>
              <p style={{ fontSize: 14, color: '#050606', marginBottom: 24 }}>
                Voer je e-mailadres in en we sturen je een link om je wachtwoord te resetten
              </p>

              <form onSubmit={handleForgotPassword}>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 15, color: '#050606', fontWeight: 500 }}>
                    E-mailadres
                  </label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
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

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmail('');
                    }}
                    style={{
                      flex: 1,
                      padding: '14px',
                      background: '#E5DDD5',
                      color: '#050606',
                      fontSize: 15,
                      fontWeight: 600,
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      flex: 1,
                      padding: '14px',
                      background: '#402e27',
                      color: '#f8f7f2',
                      fontSize: 15,
                      fontWeight: 600,
                      border: 'none',
                      borderRadius: 8,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.6 : 1,
                      fontFamily: 'inherit'
                    }}
                  >
                    {loading ? 'Verzenden...' : 'Verstuur reset link'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
