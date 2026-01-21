import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const Account: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<{
    name: string;
    phone: string;
    instagram: string;
    photos: (File | string)[];
  }>({
    name: '',
    phone: '',
    instagram: '',
    photos: [],
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (!user) {
        navigate('/login');
        return;
      }
      const { data, error } = await supabase
        .from('models')
        .select('*')
        .eq('id', user.id);
      if (error) setError(error.message);
      const model = Array.isArray(data) ? data[0] : data;
      setProfile(model);
      setForm({
        name: model?.name || '',
        phone: model?.phone || '',
        instagram: model?.instagram || '',
        photos: model?.photos || [],
      });
      setLoading(false);
    };
    fetchUser();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setForm({ ...form, photos: Array.from(e.target.files) });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    let photoUrls = profile?.photos || [];
    if (form.photos && form.photos.length > 0 && form.photos[0] instanceof File) {
      // Upload new photos to Supabase storage
      photoUrls = [];
      for (const file of form.photos) {
        if (file instanceof File) {
          const { data, error } = await supabase.storage.from('model-photos').upload(`${user.id}/${file.name}`, file);
          if (error) {
            setError(error.message);
            setLoading(false);
            return;
          }
          if (data?.path) photoUrls.push(data.path);
        }
      }
    }
    const { error } = await supabase
      .from('models')
      .update({
        name: form.name,
        phone: form.phone,
        instagram: form.instagram,
        photos: photoUrls,
      })
      .eq('id', user.id);
    if (error) setError(error.message);
    setLoading(false);
    alert('Account bijgewerkt!');
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', fontFamily: 'system-ui, -apple-system, sans-serif' }}>Laden...</div>;
  if (error) return <div style={{ color: '#DC2626', padding: 40, textAlign: 'center', fontFamily: 'system-ui, -apple-system, sans-serif' }}>{error}</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#E5DDD5', fontFamily: 'system-ui, -apple-system, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <div className="content-section" style={{ maxWidth: 540, margin: '48px auto', background: '#fff', borderRadius: 20, boxShadow: '0 6px 32px rgba(44,62,80,0.13)', padding: 40, border: '1.5px solid #F3F4F6', position: 'relative' }}>
        <button onClick={() => window.location.href = '/'} style={{ position: 'absolute', left: 24, top: 24, background: '#F3F4F6', color: '#2B3E72', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', transition: 'background 0.2s' }}>← Terug</button>
        <h2 style={{ fontSize: 32, fontWeight: 700, color: '#1F2B4A', marginBottom: 32, textAlign: 'center', letterSpacing: '1px' }}>Mijn Account</h2>
        <div style={{ background: '#F3F4F6', borderRadius: 14, padding: 24, marginBottom: 32, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#2B3E72', marginBottom: 18 }}>Persoonlijke gegevens</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label style={{ fontWeight: 600, color: '#2B3E72', marginBottom: 4 }}>Naam</label>
            <input name="name" value={form.name} onChange={handleChange} style={{ width: '100%', marginBottom: 0, padding: 12, borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 16, fontFamily: 'inherit', background: '#fff' }} />
            <label style={{ fontWeight: 600, color: '#2B3E72', marginBottom: 4 }}>Telefoonnummer</label>
            <input name="phone" value={form.phone} onChange={handleChange} style={{ width: '100%', marginBottom: 0, padding: 12, borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 16, fontFamily: 'inherit', background: '#fff' }} />
            <label style={{ fontWeight: 600, color: '#2B3E72', marginBottom: 4 }}>Instagram</label>
            <input name="instagram" value={form.instagram} onChange={handleChange} style={{ width: '100%', marginBottom: 0, padding: 12, borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 16, fontFamily: 'inherit', background: '#fff' }} />
          </div>
        </div>
        <div style={{ background: '#F3F4F6', borderRadius: 14, padding: 24, marginBottom: 32, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#2B3E72', marginBottom: 18 }}>Foto's</h3>
          <input type="file" multiple accept="image/*" onChange={handlePhotoChange} style={{ marginBottom: 12 }} />
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
            {profile?.photos && profile.photos.map((url: string, i: number) => (
              <img key={i} src={supabase.storage.from('model-photos').getPublicUrl(url).data.publicUrl} alt="Model foto" style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '2px solid #E5E7EB' }} />
            ))}
            {form.photos && form.photos.filter(p => p instanceof File).map((file, i) => (
              <img key={`new-${i}`} src={URL.createObjectURL(file as File)} alt="Nieuw" style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 10, border: '2px solid #16A34A', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
            ))}
          </div>
        </div>
        <button className="primary-btn" onClick={handleSave} style={{ width: '100%', marginTop: 8, fontSize: 17, padding: '14px 0', borderRadius: 10 }}>Opslaan</button>
      </div>
      <style>{`.primary-btn{padding:12px 24px;background:#2B3E72;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:15px;font-weight:600;font-family:inherit;box-shadow:0 2px 8px rgba(0,0,0,0.1);transition:all 0.3s ease}.primary-btn:hover{background:#1F2B4A;transform:translateY(-2px)}`}</style>
    </div>
  );
};

export default Account;
