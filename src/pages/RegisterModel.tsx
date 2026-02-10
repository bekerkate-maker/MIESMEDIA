import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import UnposedLogo from '@/components/UnposedLogo';
import ClientLogoBanner from '@/components/ClientLogoBanner';
import { X, Check } from 'lucide-react';

import PDFViewer from '@/components/PDFViewer';

export default function RegisterModel() {
  const [showTermsModal, setShowTermsModal] = useState(false);
  const handleBirthdateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = value.replace(/[^0-9]/g, '');
    if (value.length > 2) value = value.slice(0, 2) + '/' + value.slice(2);
    if (value.length > 5) value = value.slice(0, 5) + '/' + value.slice(5);
    if (value.length > 10) value = value.slice(0, 10);
    setFormData({ ...formData, birthdate: value });
  };

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    gender: '',
    age: '',
    instagram: '',
    email: '',
    password: '',
    phone: '',
    city: '',
    photo_url: '',
    birthdate: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [extraPhotoFiles, setExtraPhotoFiles] = useState<File[]>([]);
  const [extraPhotoPreviews, setExtraPhotoPreviews] = useState<string[]>([]);
  const [termsUrl, setTermsUrl] = useState<string | null>(null);

  // Fetch terms and conditions document
  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const { data, error } = await supabase
          .from('terms_and_conditions')
          .select('document_url')
          .eq('is_active', true)
          .order('uploaded_at', { ascending: false })
          .limit(1);

        if (!error && data && data.length > 0) {
          setTermsUrl(data[0].document_url);
          console.log('Terms URL loaded:', data[0].document_url);
        } else {
          console.log('No active terms found');
        }
      } catch (err) {
        console.error('Error fetching terms:', err);
      }
    };

    fetchTerms();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExtraFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      setExtraPhotoFiles(prev => [...prev, file]);
      const reader = new FileReader();
      reader.onloadend = () => {
        setExtraPhotoPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveExtraPhoto = (index: number) => {
    setExtraPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setExtraPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!agreedToTerms) {
      alert('⚠️ Je moet akkoord gaan met de voorwaarden om je aan te melden.');
      return;
    }

    setLoading(true);

    try {
      let photoUrl = '';
      let extraPhotoUrls: string[] = [];

      // 1. Sign up user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.first_name,
            last_name: formData.last_name,
            gender: formData.gender,
            birthdate: formData.birthdate,
            instagram: formData.instagram,
            phone: formData.phone,
            city: formData.city
          }
        }
      });

      if (authError) {
        throw new Error('Registratie mislukt: ' + authError.message);
      }

      if (!authData.user) {
        throw new Error('Registratie mislukt: Kon geen gebruiker aanmaken.');
      }

      const userId = authData.user.id; // Use this ID for the model record

      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const filePath = `model-photos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('model-photos')
          .upload(filePath, photoFile);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error('Foto upload mislukt: ' + uploadError.message);
        }

        const { data: urlData } = supabase.storage
          .from('model-photos')
          .getPublicUrl(filePath);

        photoUrl = urlData.publicUrl;
      }

      if (extraPhotoFiles.length > 0) {
        for (const file of extraPhotoFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `model-photos/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('model-photos')
            .upload(filePath, file);

          if (uploadError) {
            console.error('Extra photo upload error:', uploadError);
            continue;
          }

          const { data: urlData } = supabase.storage
            .from('model-photos')
            .getPublicUrl(filePath);

          extraPhotoUrls.push(urlData.publicUrl);
        }
      }

      const instagramHandle = formData.instagram.startsWith('@')
        ? formData.instagram
        : `@${formData.instagram}`;

      let birthdateFormatted = null;
      if (formData.birthdate) {
        const parts = formData.birthdate.split('/');
        if (parts.length === 3) {
          birthdateFormatted = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }

      const { error } = await supabase.from('models').insert([{
        id: userId, // Explicitly link to auth user
        first_name: formData.first_name,
        last_name: formData.last_name,
        gender: formData.gender,
        birthdate: birthdateFormatted,
        instagram: instagramHandle,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        photo_url: photoUrl || null,
        extra_photos: extraPhotoUrls.length > 0 ? extraPhotoUrls : null
      }]);

      if (error) {
        // If model insert fails, we should maybe clean up the auth user? 
        // For now just throw error.
        throw new Error('Profiel opslaan mislukt: ' + error.message);
      }

      // Email wordt automatisch verstuurd via database webhook 'stuur_welkomstmail'

      setSubmitted(true);
    } catch (error: any) {
      console.error('Error submitting form:', error);
      alert(`Er ging iets mis: ${error.message || error.error_description || JSON.stringify(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = () => {
    document.getElementById('photo-upload-input')?.click();
  };

  if (submitted) {
    return (
      <div className="register-page success-page">
        <div className="success-container">
          <div className="logo-center">
            <UnposedLogo size={120} />
          </div>
          <h1 className="success-title">Succesvol aangemeld</h1>
          <p className="success-text">
            Je bent nu onderdeel van The Unposed Collective. Check je mail voor de bevestiging van je aanmelding.
          </p>
          <button onClick={() => { window.location.href = '/'; }} className="primary-btn">
            Bekijk openstaande shoots
          </button>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="register-page">
      <ClientLogoBanner />
      {/* Account icon direct onder de banner */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', padding: '12px 0 0 0' }}>
        <button
          onClick={() => window.location.href = '/account'}
          style={{
            background: 'transparent',
            border: 'none',
            width: 44,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            marginRight: 24,
          }}
          aria-label="Inloggen of account wijzigen"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f8f7f2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 2px 8px rgba(44,62,80,0.18))' }}>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-2.5 3.5-4 8-4s8 1.5 8 4" />
          </svg>
        </button>
      </div>

      <div className="content-section">
        <div className="header-section">
          <div className="logo-center">
            <UnposedLogo size={110} />
          </div>
          <div className="button-wrapper">
            <button onClick={() => { window.location.href = '/'; }} className="primary-btn">
              Bekijk openstaande shoots
            </button>
          </div>
          <h1 className="main-title">Meld je aan als talent</h1>
          <p className="subtitle">Vul je gegevens in en word onderdeel van The Unposed Collective.</p>
        </div>

        <div className="form-wrapper">
          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-row">
              <div className="form-field">
                <label>Voornaam *</label>
                <input required value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} />
              </div>
              <div className="form-field">
                <label>Achternaam *</label>
                <input required value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Geslacht *</label>
                <select required value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className={formData.gender ? '' : 'placeholder'}>
                  <option value="">Selecteer geslacht</option>
                  <option value="man">Man</option>
                  <option value="vrouw">Vrouw</option>
                  <option value="anders">Anders</option>
                </select>
              </div>
              <div className="form-field">
                <label>Geboortedatum *</label>
                <input required type="text" placeholder="dd/mm/jjjj" value={formData.birthdate || ''} onChange={handleBirthdateInput} maxLength={10} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Instagram *</label>
                <div className="input-with-prefix">
                  <span className="prefix">@</span>
                  <input required placeholder="username" value={formData.instagram} onChange={(e) => setFormData({ ...formData, instagram: e.target.value })} />
                </div>
              </div>
              <div className="form-field">
                <label>E-mailadres *</label>
                <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
            </div>




            <div className="form-row">
              <div className="form-field">
                <label>Telefoonnummer *</label>
                <input required type="tel" placeholder="06 12345678" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div className="form-field">
                <label>Woonplaats *</label>
                <input required type="text" placeholder="Rotterdam" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Wachtwoord *</label>
                <input
                  required
                  type="password"
                  placeholder="Kies een veilig wachtwoord"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  minLength={6}
                />
              </div>
              <div className="form-field">
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  Hoofdfoto * {photoFile && <Check size={18} color="#050606" />}
                </label>
                <input id="photo-upload-input" type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="button" onClick={handleFileUpload} className="upload-btn" style={{ flex: 1 }}>
                    {photoFile ? 'Wijzig hoofdfoto' : 'Upload hoofdfoto'}
                  </button>
                  {photoFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoFile(null);
                        setPhotoPreview(null);
                        // Reset file input value so same file can be selected again if needed
                        const input = document.getElementById('photo-upload-input') as HTMLInputElement;
                        if (input) input.value = '';
                      }}
                      className="upload-btn"
                      style={{
                        width: 'auto',
                        background: '#DC2626',
                        color: '#f8f7f2',
                        padding: '12px 16px',
                        flex: '0 0 auto'
                      }}
                      aria-label="Verwijder hoofdfoto"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Gecentreerde Hoofdfoto Preview */}
            {photoPreview && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: 32,
                marginTop: -12
              }}>
                <div style={{
                  position: 'relative',
                  width: 200,
                  height: 250,
                  borderRadius: 12,
                  overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  border: '4px solid #f8f7f2'
                }}>
                  <img
                    src={photoPreview}
                    alt="Preview"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'rgba(255,255,255,0.9)',
                    padding: '8px',
                    textAlign: 'center',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#050606',
                    backdropFilter: 'blur(4px)'
                  }}>
                    Jouw hoofdfoto
                  </div>
                </div>
              </div>
            )}

            <div className="form-field">
              <label>Extra foto's ({extraPhotoPreviews.length}) - optioneel</label>
              {extraPhotoPreviews.length > 0 && (
                <div className="extra-photos-grid">
                  {extraPhotoPreviews.map((preview, index) => (
                    <div key={index} className="extra-photo-item">
                      <img src={preview} alt={`Extra foto ${index + 1}`} />
                      <button type="button" onClick={() => handleRemoveExtraPhoto(index)} className="remove-btn">×</button>
                    </div>
                  ))}
                </div>
              )}
              <input id="extra-photos-input" type="file" accept="image/*" multiple onChange={handleExtraFilesChange} style={{ display: 'none' }} />
              <button type="button" onClick={() => document.getElementById('extra-photos-input')?.click()} className="upload-btn dashed">
                Extra foto's toevoegen
              </button>
            </div>

            <div className="form-field">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <input
                  id="agree-terms-checkbox"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  style={{
                    width: 20,
                    height: 20,
                    marginTop: 3,
                    cursor: 'pointer',
                    flexShrink: 0,
                    accentColor: '#050606'
                  }}
                />
                <div style={{ fontSize: 15, color: '#050606', lineHeight: 1.6 }}>
                  <label htmlFor="agree-terms-checkbox" style={{ cursor: 'pointer', display: 'inline' }}>Ik ga akkoord met de{' '}</label>
                  {termsUrl ? (
                    <span
                      role="button"
                      tabIndex={0}
                      style={{
                        color: '#050606',
                        fontWeight: 700,
                        textDecoration: 'underline',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'inline',
                        fontSize: 'inherit',
                        fontFamily: 'inherit',
                        transition: 'color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#050606'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#050606'}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Privacy policy clicked, termsUrl:', termsUrl);
                        setShowTermsModal(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setShowTermsModal(true);
                        }
                      }}
                    >
                      privacyverklaring
                    </span>
                  ) : (
                    <span style={{ fontWeight: 700, textDecoration: 'underline' }}>privacyverklaring</span>
                  )}
                  <label htmlFor="agree-terms-checkbox" style={{ cursor: 'pointer', display: 'inline' }}>
                    <span className="desktop-only">
                      {' '}van Unposed en geef toestemming voor het opslaan en gebruiken van mijn gegevens voor casting- en shootdoeleinden.
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal voor voorwaarden */}
            {showTermsModal && termsUrl && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0,0,0,0.7)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
                onClick={() => setShowTermsModal(false)}
              >
                <div style={{
                  background: '#f8f7f2',
                  borderRadius: 12,
                  maxWidth: 700,
                  width: '90vw',
                  maxHeight: '80vh',
                  overflow: 'auto',
                  position: 'relative',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  padding: 32
                }}
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    onClick={() => setShowTermsModal(false)}
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      background: '#eee',
                      border: 'none',
                      borderRadius: '50%',
                      width: 32,
                      height: 32,
                      fontSize: 20,
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      color: '#050606',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }}
                    aria-label="Sluit"
                  >
                    ×
                  </button>
                  {/* PDF zonder zwarte balk met PDFViewer */}
                  <PDFViewer url={termsUrl} />
                </div>
              </div>
            )}

            <button type="submit" disabled={loading || !agreedToTerms} className={`submit-btn ${(loading || !agreedToTerms) ? 'disabled' : ''}`}>
              {loading ? 'Bezig met verzenden...' : 'Aanmelden'}
            </button>
          </form>
        </div>
      </div >

      <style>{styles}</style>
    </div >
  );
}

const styles = `.register-page{min-height:100vh;background:#E5DDD5;font-family:system-ui,-apple-system,sans-serif}.success-page{display:flex;align-items:center;justify-content:center}.success-container{text-align:center;padding:20px;max-width:500px}.success-title{font-size:42px;margin-bottom:16px;color:#050606;font-weight:700}.success-text{font-size:20px;color:#050606;font-weight:500;margin-bottom:32px}.logo-center{display:flex;justify-content:center;margin-bottom:24px}.content-section{padding:60px 20px}.header-section{text-align:center;margin-bottom:40px}.button-wrapper{margin-bottom:24px}.primary-btn{padding:12px 24px;background:#402e27;color:#f8f7f2;border:none;border-radius:8px;cursor:pointer;font-size:15px;font-weight:600;font-family:inherit;box-shadow:0 2px 8px rgba(0,0,0,0.1);transition:all 0.3s ease}.primary-btn:hover{background:#1F2B4A;transform:translateY(-2px)}.main-title{font-size:42px;font-weight:700;margin:0 0 8px 0;color:#050606}.subtitle{font-size:16px;color:#050606;margin:0}.form-wrapper{max-width:800px;margin:0 auto}.register-form{background:#f8f7f2;padding:48px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08)}.form-row{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px}.form-field{margin-bottom:24px}.form-row .form-field{margin-bottom:0}.form-field label{display:block;margin-bottom:8px;font-size:15px;color:#050606;font-weight:500}.form-field input,.form-field select{width:100%;padding:12px 16px;background:#E5DDD5;color:#050606;border:none;border-radius:8px;font-size:15px;font-family:inherit;box-sizing:border-box}.form-field select.placeholder{color:#050606}.input-with-prefix{position:relative;display:flex;align-items:center}.input-with-prefix .prefix{position:absolute;left:16px;color:#050606;font-size:15px;font-weight:500;pointer-events:none}.input-with-prefix input{padding-left:36px}.upload-btn{width:100%;padding:12px 16px;background:#E5DDD5;color:#050606;border:none;border-radius:8px;font-size:15px;font-family:inherit;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;box-sizing:border-box}.upload-btn.dashed{border:2px dashed #050606}.photo-preview-container{margin-bottom:12px;text-align:center}.photo-preview{max-width:200px;max-height:200px;border-radius:8px;object-fit:cover}.extra-photos-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:12px}.extra-photo-item{position:relative}.extra-photo-item img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px}.remove-btn{position:absolute;top:4px;right:4px;width:24px;height:24px;border-radius:50%;background:rgba(239,68,68,0.9);color:#f8f7f2;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:bold}.checkbox-label{display:flex;align-items:flex-start;gap:12px;cursor:pointer}.checkbox-label input{width:18px !important;height:18px;margin-top:10px;cursor:pointer;flex-shrink:0;accent-color:#050606}.checkbox-label span{font-size:15px;color:#050606;line-height:1.6}.desktop-only{display:inline}
.mobile-text { display: none; }
.submit-btn{width:100%;padding:16px;background:#402e27;color:#f8f7f2;font-size:16px;font-weight:600;border:none;border-radius:8px;cursor:pointer;font-family:inherit;transition:all 0.3s ease}.submit-btn.disabled{background:#9CA3AF;cursor:not-allowed;opacity:0.6}@media(max-width:768px){.desktop-only{display:none}.content-section{padding:20px 20px}.header-section{margin-bottom:24px}.main-title{font-size:24px;line-height:1.3}.subtitle{font-size:14px}.primary-btn{padding:10px 18px;font-size:13px}.register-form{padding:20px 16px}.form-row{grid-template-columns:1fr;gap:0;margin-bottom:0}.form-row .form-field{margin-bottom:16px}.form-field{margin-bottom:16px}.form-field input,.form-field select{font-size:16px}.success-title{font-size:28px}.success-text{font-size:16px}}`
