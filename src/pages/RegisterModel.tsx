import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import MiesLogo from '@/components/MiesLogo';

export default function RegisterModel() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    gender: '',
    age: '',
    instagram: '',
    email: '',
    phone: '',
    city: '',
    photo_url: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
    if (!agreedToTerms) {
      alert('⚠️ Je moet akkoord gaan met de voorwaarden om je aan te melden.');
      return;
    }
    
    setLoading(true);

    try {
      const instagramHandle = formData.instagram.startsWith('@') 
        ? formData.instagram 
        : `@${formData.instagram}`;

      const { error } = await supabase.from('models').insert([{
        ...formData,
        instagram: instagramHandle,
        age: parseInt(formData.age)
      }]);

      if (error) throw error;
      
      // Send email notification
      const emailSubject = 'Welkom bij MIES MEDIA! 🎉';
      const emailBody = `Gefeliciteerd! Je bent officieel aangemeld als MIES MEDIA MODEL.

Hartelijk dank voor jouw inschrijving en het vertrouwen in MIES MEDIA!

We hebben je gegevens ontvangen en je gaf ons toestemming om deze te verwerken en op te slaan. Je gegevens worden zorgvuldig behandeld conform onze privacyverklaring.

We nemen binnenkort contact met je op voor de volgende stappen.

Met vriendelijke groet,
Team MIES MEDIA

---
Dit is een geautomatiseerd bericht. Je ontvangt deze e-mail omdat je je hebt aangemeld via miesmedia.nl`;

      window.open(`mailto:${formData.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`);
      
      setSubmitted(true);
    } catch (error: any) {
      console.error('Error submitting form:', error);
      alert(`Er ging iets mis: ${error.message || error.error_description || JSON.stringify(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = () => {
    alert('Foto upload functionaliteit - integreer met je favoriete cloud storage');
  };

  if (submitted) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#E5DDD5', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: 20
      }}>
        <div style={{ textAlign: 'center', maxWidth: 500 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
            <MiesLogo size={120} />
          </div>
          <h1 style={{ fontSize: 42, marginBottom: 16, color: '#1F2B4A', fontWeight: 700 }}>Topper!</h1>
          <p style={{ fontSize: 20, color: '#1F2B4A', fontWeight: 500 }}>
            Je bent officieel een Rotterdams Model. Niet lullen maar poseren!! 📸🤳
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#E5DDD5',
      padding: '60px 20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <MiesLogo size={110} />
          </div>
          <h1 style={{ fontSize: 42, fontWeight: 700, margin: 0, color: '#1F2B4A', marginBottom: 8 }}>
            Registreer hier als MIES MEDIA Model
          </h1>
          <p style={{ fontSize: 16, color: '#6B7280', margin: 0 }}>
            Vul je gegevens in om je aan te melden als model
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 48, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 15, color: '#1F2B4A', fontWeight: 500 }}>
                Voornaam *
              </label>
              <input required value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                style={{ width: '100%', padding: '12px 16px', background: '#E5DDD5', color: '#1F2B4A', border: 'none', borderRadius: 8, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 15, color: '#1F2B4A', fontWeight: 500 }}>
                Achternaam *
              </label>
              <input required value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                style={{ width: '100%', padding: '12px 16px', background: '#E5DDD5', color: '#1F2B4A', border: 'none', borderRadius: 8, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 15, color: '#1F2B4A', fontWeight: 500 }}>
                Geslacht *
              </label>
              <select required value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})}
                style={{ width: '100%', padding: '12px 16px', background: '#E5DDD5', color: formData.gender ? '#1F2B4A' : '#9CA3AF', border: 'none', borderRadius: 8, fontSize: 15, fontFamily: 'inherit', cursor: 'pointer', boxSizing: 'border-box' }}
              >
                <option value="">Selecteer geslacht</option>
                <option value="man">Man</option>
                <option value="vrouw">Vrouw</option>
                <option value="anders">Anders</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 15, color: '#1F2B4A', fontWeight: 500 }}>
                Leeftijd *
              </label>
              <input required type="number" min="16" max="99" value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})}
                style={{ width: '100%', padding: '12px 16px', background: '#E5DDD5', color: '#1F2B4A', border: 'none', borderRadius: 8, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 15, color: '#1F2B4A', fontWeight: 500 }}>
                Instagram *
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ 
                  position: 'absolute', 
                  left: 16, 
                  color: '#1F2B4A', 
                  fontSize: 15, 
                  fontWeight: 500,
                  pointerEvents: 'none'
                }}>
                  @
                </span>
                <input 
                  required 
                  placeholder="username" 
                  value={formData.instagram} 
                  onChange={(e) => setFormData({...formData, instagram: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px 12px 36px', 
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
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 15, color: '#1F2B4A', fontWeight: 500 }}>
                E-mailadres *
              </label>
              <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                style={{ width: '100%', padding: '12px 16px', background: '#E5DDD5', color: '#1F2B4A', border: 'none', borderRadius: 8, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 15, color: '#1F2B4A', fontWeight: 500 }}>
                Telefoonnummer *
              </label>
              <input required type="tel" placeholder="06 12345678" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
                style={{ width: '100%', padding: '12px 16px', background: '#E5DDD5', color: '#1F2B4A', border: 'none', borderRadius: 8, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 15, color: '#1F2B4A', fontWeight: 500 }}>
                Woonplaats *
              </label>
              <input required type="text" placeholder="Rotterdam" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})}
                style={{ width: '100%', padding: '12px 16px', background: '#E5DDD5', color: '#1F2B4A', border: 'none', borderRadius: 8, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 32 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 15, color: '#1F2B4A', fontWeight: 500 }}>
              Foto
            </label>
            <button type="button" onClick={handleFileUpload}
              style={{ width: '100%', padding: '12px 16px', background: '#E5DDD5', color: '#1F2B4A', border: 'none', borderRadius: 8, fontSize: 15, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxSizing: 'border-box' }}
            >
              <span>📤</span> Upload foto
            </button>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                style={{ 
                  marginTop: 4,
                  width: 18,
                  height: 18,
                  cursor: 'pointer'
                }}
              />
              <span style={{ fontSize: 14, color: '#1F2B4A', lineHeight: 1.5 }}>
                Ik geef MIES MEDIA toestemming om mijn gegevens te verwerken en op te slaan.
              </span>
            </label>
          </div>

          <button type="submit" disabled={loading || !agreedToTerms}
            style={{ 
              width: '100%', 
              padding: '16px', 
              background: (loading || !agreedToTerms) ? '#9CA3AF' : '#2B3E72', 
              color: '#fff', 
              fontSize: 16, 
              fontWeight: 600, 
              border: 'none', 
              borderRadius: 8, 
              cursor: (loading || !agreedToTerms) ? 'not-allowed' : 'pointer', 
              opacity: (loading || !agreedToTerms) ? 0.6 : 1, 
              fontFamily: 'inherit' 
            }}
          >
            {loading ? 'Bezig met verzenden...' : 'Aanmelden'}
          </button>
        </form>
      </div>
    </div>
  );
}
