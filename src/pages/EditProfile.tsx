import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import MiesLogo from '@/components/MiesLogo';
import { useNavigate } from 'react-router-dom';
import ClientLogoBanner from '@/components/ClientLogoBanner';

const EditProfile: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Profile state
    const [profile, setProfile] = useState<any>(null);
    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        city: '',
        instagram: '',
        birthdate: '',
        photos: [] as string[],
    });
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Menu state for header
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
    }, []);

    const checkUser = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (user) {
                await fetchProfile(user);
            } else {
                navigate('/');
            }
        } catch (e) {
            console.error(e);
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const fetchProfile = async (currentUser: any) => {
        try {
            let { data, error } = await supabase
                .from('models')
                .select('*')
                .eq('id', currentUser.id)
                .single();

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
                setForm({
                    first_name: data.first_name || '',
                    last_name: data.last_name || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    city: data.city || '',
                    instagram: data.instagram || '',
                    birthdate: data.birthdate || '',
                    photos: data.extra_photos || [],
                });
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        }
    };

    const handleUpdateProfile = async () => {
        if (!profile) return;
        setLoading(true);

        try {
            const { error } = await supabase
                .from('models')
                .update({
                    first_name: form.first_name,
                    last_name: form.last_name,
                    phone: form.phone,
                    city: form.city,
                    instagram: form.instagram,
                })
                .eq('id', profile.id);

            if (error) throw error;
            setSuccessMsg('Gegevens succesvol bijgewerkt');
            setTimeout(() => setSuccessMsg(null), 3000);
            fetchProfile(user);
        } catch (err: any) {
            alert('Er ging iets mis: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files.length || !profile) return;
        setLoading(true);

        const files = Array.from(e.target.files);
        const newPhotos = [...(profile.extra_photos || [])];

        try {
            for (const file of files) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${profile.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('model-photos')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('model-photos')
                    .getPublicUrl(fileName);

                newPhotos.push(publicUrl);
            }

            const { error: dbError } = await supabase
                .from('models')
                .update({ extra_photos: newPhotos })
                .eq('id', profile.id);

            if (dbError) throw dbError;

            fetchProfile(user);
        } catch (err: any) {
            console.error(err);
            alert('Fout bij uploaden foto: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePhoto = async (photoUrl: string) => {
        if (!profile || !window.confirm('Weet je zeker dat je deze foto wilt verwijderen?')) return;
        setLoading(true);

        try {
            const newPhotos = (profile.extra_photos || []).filter((p: string) => p !== photoUrl);

            const { error } = await supabase
                .from('models')
                .update({ extra_photos: newPhotos })
                .eq('id', profile.id);

            if (error) throw error;
            fetchProfile(user);
        } catch (err: any) {
            alert('Fout bij verwijderen: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    if (loading && !user) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#E5DDD5' }}>Laden...</div>;

    return (
        <div style={{ minHeight: '100vh', background: '#E5DDD5', fontFamily: 'system-ui, -apple-system, sans-serif', display: 'flex', flexDirection: 'column' }}>
            <ClientLogoBanner />
            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', padding: '12px 320px 0 0', position: 'relative', zIndex: 50 }}>
                <div ref={menuRef} style={{ position: 'relative', marginRight: 24 }}>
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            padding: 8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                        }}
                    >
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.05))' }}>
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </button>

                    {showMenu && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: 8,
                            background: '#fff',
                            borderRadius: 12,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                            minWidth: 200,
                            overflow: 'hidden',
                            padding: '8px 0'
                        }}>
                            <button
                                // Already on profile page, so maybe disable or just close menu? Or duplicate logic just in case.
                                onClick={() => setShowMenu(false)}
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
                                    color: '#1F2B4A',
                                    fontWeight: 600, // Active state indication perhaps?
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
                                onClick={() => navigate('/account')}
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
                                    color: '#1F2B4A',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="7" height="7"></rect>
                                    <rect x="14" y="3" width="7" height="7"></rect>
                                    <rect x="14" y="14" width="7" height="7"></rect>
                                    <rect x="3" y="14" width="7" height="7"></rect>
                                </svg>
                                Mijn shoots
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
                                    color: '#DC2626',
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

            <main style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <h2 style={{ fontSize: 28, color: '#1F2B4A', margin: 0 }}>Mijn Profiel</h2>

                    <div style={{ background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <h3 style={{ marginTop: 0, color: '#2B3E72', marginBottom: 24 }}>Gegevens</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, color: '#6B7280', marginBottom: 4 }}>Voornaam</label>
                                <input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} style={inputStyle} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, color: '#6B7280', marginBottom: 4 }}>Achternaam</label>
                                <input value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} style={inputStyle} />
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', fontSize: 13, color: '#6B7280', marginBottom: 4 }}>E-mailadres (niet aanpasbaar)</label>
                                <input value={form.email} disabled style={{ ...inputStyle, background: '#F3F4F6', opacity: 0.8 }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, color: '#6B7280', marginBottom: 4 }}>Telefoonnummer</label>
                                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, color: '#6B7280', marginBottom: 4 }}>Woonplaats</label>
                                <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} style={inputStyle} />
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', fontSize: 13, color: '#6B7280', marginBottom: 4 }}>Instagram</label>
                                <input value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} style={inputStyle} />
                            </div>
                        </div>

                        <button onClick={handleUpdateProfile} style={{ marginTop: 24, padding: '12px 24px', background: '#2B3E72', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', width: '100%' }}>
                            Wijzigingen opslaan
                        </button>
                        {successMsg && <p style={{ color: '#16A34A', fontSize: 14, textAlign: 'center', marginTop: 12 }}>{successMsg}</p>}
                    </div>

                    <div style={{ background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <h3 style={{ marginTop: 0, color: '#2B3E72', marginBottom: 24 }}>Mijn Foto's</h3>

                        {/* Hoofdfoto */}
                        <div style={{ marginBottom: 24 }}>
                            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Hoofdfoto</p>
                            {profile?.photo_url ? (
                                <img src={supabase.storage.from('model-photos').getPublicUrl(profile.photo_url).data.publicUrl} style={{ width: 100, height: 100, borderRadius: 8, objectFit: 'cover' }} alt="Hoofdfoto" />
                            ) : (
                                <div style={{ width: 100, height: 100, background: '#F3F4F6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}></div>
                            )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 12, marginBottom: 24 }}>
                            {profile?.extra_photos?.map((url: string, idx: number) => (
                                <div key={idx} style={{ position: 'relative' }}>
                                    <img src={supabase.storage.from('model-photos').getPublicUrl(url).data.publicUrl} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 8 }} alt={`Foto ${idx}`} />
                                    <button
                                        onClick={() => handleDeletePhoto(url)}
                                        style={{ position: 'absolute', top: -6, right: -6, background: '#EF4444', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        ×
                                    </button>
                                </div>
                            ))}
                            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed #E5E7EB', borderRadius: 8, cursor: 'pointer', minHeight: 80, aspectRatio: '1/1' }}>
                                <span style={{ fontSize: 24, color: '#9CA3AF' }}>+</span>
                                <span style={{ fontSize: 11, color: '#9CA3AF' }}>Upload</span>
                                <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                            </label>
                        </div>
                    </div>
                </div>
            </main>

            <style>{`
          @media (max-width: 900px) {
            main { grid-template-columns: 1fr !important; }
          }
        `}</style>
        </div>
    );
};

const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #E5E7EB',
    fontSize: 14,
    color: '#1F2B4A',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit'
};

export default EditProfile;
