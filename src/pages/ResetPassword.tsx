import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import MiesLogo from '@/components/MiesLogo';

export default function ResetPassword() {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [session, setSession] = useState<any>(null);

    useEffect(() => {
        // 1. Check initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            console.log('Initial session check:', session);
            setSession(session);

            // If we are on this page without a session AND without a hash containing 'type=recovery' or 'access_token',
            // then it's likely an invalid access. 
            // However, usually the recovery link contains a hash fragment that Supabase client parses automatically.
        });

        // 2. Listen for auth changes (this is critical for the recovery flow)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state change:', event, session);
            // PASSWORD_RECOVERY event is triggered when user clicks the link
            // SIGNED_IN is triggered after the session is established from the link
            setSession(session);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        console.log('Attempting to update password. Session exists:', !!session);

        if (!session) {
            setMessage({
                type: 'error',
                text: 'Geen actieve sessie gevonden. De link is mogelijk verlopen. Vraag een nieuwe herstellink aan.'
            });
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) {
                console.error('Supabase updateUser error:', error);
                throw error;
            }

            console.log('Password update success:', data);

            setMessage({
                type: 'success',
                text: 'Je wachtwoord is succesvol gewijzigd! Je wordt nu doorgestuurd...'
            });

            setTimeout(() => {
                navigate('/account');
            }, 2000);

        } catch (err: any) {
            console.error('Password update error (catch):', err);
            // Show more specific error messages if possible
            let errorText = 'Er ging iets mis bij het wijzigen van je wachtwoord.';

            if (err.message) {
                // Translate common Supabase errors if needed, or just show them
                if (err.message.includes('Password should be')) {
                    errorText = 'Het wachtwoord moet minimaal 6 tekens lang zijn.';
                } else {
                    errorText += ` (${err.message})`;
                }
            }

            setMessage({
                type: 'error',
                text: errorText
            });
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
                        <MiesLogo size={90} />
                    </div>
                    <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0, color: '#050606', marginBottom: 8 }}>
                        Nieuw wachtwoord
                    </h1>
                    <p style={{ fontSize: 16, color: '#050606', margin: 0 }}>
                        Stel hieronder je nieuwe wachtwoord in
                    </p>
                </div>

                <form onSubmit={handleUpdatePassword} style={{ background: '#f8f7f2', padding: 48, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <div style={{ marginBottom: 32 }}>
                        <label style={{ display: 'block', marginBottom: 8, fontSize: 15, color: '#050606', fontWeight: 500 }}>
                            Nieuw wachtwoord
                        </label>
                        <input
                            type="password"
                            required
                            minLength={6}
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
                    </div>

                    {message && (
                        <div style={{
                            background: message.type === 'success' ? '#DCFCE7' : '#FEF2F2',
                            color: message.type === 'success' ? '#16A34A' : '#DC2626',
                            padding: 12,
                            borderRadius: 8,
                            fontSize: 14,
                            marginBottom: 20,
                            textAlign: 'center'
                        }}>
                            {message.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || (message?.type === 'error' && !session)} /* Disable if error relates to missing session */
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
                        {loading ? 'Bezig...' : 'Wachtwoord opslaan'}
                    </button>

                    <div style={{ textAlign: 'center', fontSize: 14, color: '#050606', margin: 0 }}>
                        <a href="/account" style={{ color: '#050606', textDecoration: 'underline' }}>Terug naar inloggen</a>
                    </div>
                </form>
            </div>
        </div>
    );
}
