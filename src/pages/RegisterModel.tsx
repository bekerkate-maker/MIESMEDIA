import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import MiesLogo from '@/components/MiesLogo';
import logoCasu from '@/components/logo_klanten/logo_casu.png';
import logoKoekela from '@/components/logo_klanten/logo-koekela-winkels-denieuwebinnenweg.png';
import logoJordys from '@/components/logo_klanten/JORDYS_LOGO.png';
import logoMorganMees from '@/components/logo_klanten/morganmees_logo.png';
import logoDudok from '@/components/logo_klanten/dudok_logo.png';

export default function RegisterModel() {
  const handleBirthdateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = value.replace(/[^0-9]/g, '');
    if (value.length > 2) value = value.slice(0,2) + '/' + value.slice(2);
    if (value.length > 5) value = value.slice(0,5) + '/' + value.slice(5);
    if (value.length > 10) value = value.slice(0,10);
    setFormData({ ...formData, birthdate: value });
  };

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    gender: '',
    age: '',
    instagram: '',
    email: '',
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

      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
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
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
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

      if (error) throw error;
      
      try {
        const { error: functionError } = await supabase.functions.invoke('send-welcome-email', {
          body: {
            email: formData.email,
            firstName: formData.first_name,
            lastName: formData.last_name
          }
        });

        if (functionError) {
          console.error('Email send error:', functionError);
        }
      } catch (emailError) {
        console.error('Email error:', emailError);
      }
      
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
            <MiesLogo size={120} />
          </div>
          <h1 className="success-title">Topper!</h1>
          <p className="success-text">
            Je bent officieel een Rotterdams Model. Niet lullen maar poseren!! 📸🤳
          </p>
          <button onClick={() => { window.location.href = '/'; }} className="primary-btn">
            Meld je aan voor open shoots
          </button>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="register-page">
      <div className="logo-banner">
        <div className="logo-banner-inner">
          <div className="logo-scroll">
            <img src={logoCasu} alt="La Cazuela" className="logo-normal" />
            <img src={logoKoekela} alt="Koekela" className="logo-small" />
            <img src={logoJordys} alt="Jordys" className="logo-normal" />
            <img src={logoMorganMees} alt="Morgan & Mees" className="logo-normal" />
            <img src={logoDudok} alt="Dudok" className="logo-xlarge" />
            <img src={logoCasu} alt="La Cazuela" className="logo-normal" />
            <img src={logoKoekela} alt="Koekela" className="logo-small" />
            <img src={logoJordys} alt="Jordys" className="logo-normal" />
            <img src={logoMorganMees} alt="Morgan & Mees" className="logo-normal" />
            <img src={logoDudok} alt="Dudok" className="logo-xlarge" />
            <img src={logoCasu} alt="La Cazuela" className="logo-normal" />
            <img src={logoKoekela} alt="Koekela" className="logo-small" />
            <img src={logoJordys} alt="Jordys" className="logo-normal" />
            <img src={logoMorganMees} alt="Morgan & Mees" className="logo-normal" />
            <img src={logoDudok} alt="Dudok" className="logo-xlarge" />
          </div>
        </div>
      </div>

      <div className="content-section">
        <div className="header-section">
          <div className="logo-center">
            <MiesLogo size={110} />
          </div>
          <div className="button-wrapper">
            <button onClick={() => { window.location.href = '/'; }} className="primary-btn">
              Meld je aan voor open shoots
            </button>
          </div>
          <h1 className="main-title">Registreer hier als MIES MEDIA Model</h1>
          <p className="subtitle">Vul je gegevens in om je aan te melden als model</p>
        </div>

        <div className="form-wrapper">
          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-row">
              <div className="form-field">
                <label>Voornaam *</label>
                <input required value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} />
              </div>
              <div className="form-field">
                <label>Achternaam *</label>
                <input required value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Geslacht *</label>
                <select required value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className={formData.gender ? '' : 'placeholder'}>
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
                  <input required placeholder="username" value={formData.instagram} onChange={(e) => setFormData({...formData, instagram: e.target.value})} />
                </div>
              </div>
              <div className="form-field">
                <label>E-mailadres *</label>
                <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Telefoonnummer *</label>
                <input required type="tel" placeholder="06 12345678" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="form-field">
                <label>Woonplaats *</label>
                <input required type="text" placeholder="Rotterdam" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} />
              </div>
            </div>

            <div className="form-field">
              <label>Hoofdfoto {photoFile && '✅'}</label>
              <input id="photo-upload-input" type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              {photoPreview && (
                <div className="photo-preview-container">
                  <img src={photoPreview} alt="Preview" className="photo-preview" />
                </div>
              )}
              <button type="button" onClick={handleFileUpload} className="upload-btn">
                <span>📤</span> {photoFile ? 'Wijzig hoofdfoto' : 'Upload hoofdfoto'}
              </button>
            </div>

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
                <span>📷</span> Extra foto's toevoegen
              </button>
            </div>

            <div className="form-field">
              <label className="checkbox-label">
                <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} />
                <span>Ik geef MIES MEDIA toestemming om mijn gegevens te verwerken en op te slaan.</span>
              </label>
            </div>

            <button type="submit" disabled={loading || !agreedToTerms} className={`submit-btn ${(loading || !agreedToTerms) ? 'disabled' : ''}`}>
              {loading ? 'Bezig met verzenden...' : 'Aanmelden'}
            </button>
          </form>
        </div>
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `.register-page{min-height:100vh;background:#E5DDD5;font-family:system-ui,-apple-system,sans-serif}.success-page{display:flex;align-items:center;justify-content:center}.success-container{text-align:center;padding:20px;max-width:500px}.success-title{font-size:42px;margin-bottom:16px;color:#1F2B4A;font-weight:700}.success-text{font-size:20px;color:#1F2B4A;font-weight:500;margin-bottom:32px}.logo-center{display:flex;justify-content:center;margin-bottom:24px}.logo-banner{background:#fff;padding:12px 0;overflow:hidden;position:relative;box-shadow:0 2px 4px rgba(0,0,0,0.05);min-height:60px}.logo-banner-inner{position:absolute;top:0;left:0;right:0;bottom:0;overflow:hidden;display:flex;align-items:center}.logo-scroll{display:flex;gap:60px;align-items:center;padding-right:60px;animation:scroll 30s linear infinite;will-change:transform}.logo-scroll img{width:auto;object-fit:contain;filter:grayscale(100%)}.logo-small{height:25px}.logo-normal{height:40px}.logo-large{height:50px}.logo-xlarge{height:60px}@keyframes scroll{0%{transform:translateX(0)}100%{transform:translateX(calc(-100% / 3))}}.content-section{padding:60px 20px}.header-section{text-align:center;margin-bottom:40px}.button-wrapper{margin-bottom:24px}.primary-btn{padding:12px 24px;background:#2B3E72;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:15px;font-weight:600;font-family:inherit;box-shadow:0 2px 8px rgba(0,0,0,0.1);transition:all 0.3s ease}.primary-btn:hover{background:#1F2B4A;transform:translateY(-2px)}.main-title{font-size:42px;font-weight:700;margin:0 0 8px 0;color:#1F2B4A}.subtitle{font-size:16px;color:#6B7280;margin:0}.form-wrapper{max-width:800px;margin:0 auto}.register-form{background:#fff;padding:48px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08)}.form-row{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px}.form-field{margin-bottom:24px}.form-row .form-field{margin-bottom:0}.form-field label{display:block;margin-bottom:8px;font-size:15px;color:#1F2B4A;font-weight:500}.form-field input,.form-field select{width:100%;padding:12px 16px;background:#E5DDD5;color:#1F2B4A;border:none;border-radius:8px;font-size:15px;font-family:inherit;box-sizing:border-box}.form-field select.placeholder{color:#9CA3AF}.input-with-prefix{position:relative;display:flex;align-items:center}.input-with-prefix .prefix{position:absolute;left:16px;color:#1F2B4A;font-size:15px;font-weight:500;pointer-events:none}.input-with-prefix input{padding-left:36px}.upload-btn{width:100%;padding:12px 16px;background:#E5DDD5;color:#1F2B4A;border:none;border-radius:8px;font-size:15px;font-family:inherit;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;box-sizing:border-box}.upload-btn.dashed{border:2px dashed #6B7280}.photo-preview-container{margin-bottom:12px;text-align:center}.photo-preview{max-width:200px;max-height:200px;border-radius:8px;object-fit:cover}.extra-photos-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:12px}.extra-photo-item{position:relative}.extra-photo-item img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px}.remove-btn{position:absolute;top:4px;right:4px;width:24px;height:24px;border-radius:50%;background:rgba(239,68,68,0.9);color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:bold}.checkbox-label{display:flex;align-items:flex-start;gap:12px;cursor:pointer}.checkbox-label input{width:18px !important;height:18px;margin-top:4px;cursor:pointer;flex-shrink:0}.checkbox-label span{font-size:14px;color:#1F2B4A;line-height:1.5}.submit-btn{width:100%;padding:16px;background:#2B3E72;color:#fff;font-size:16px;font-weight:600;border:none;border-radius:8px;cursor:pointer;font-family:inherit;transition:all 0.3s ease}.submit-btn.disabled{background:#9CA3AF;cursor:not-allowed;opacity:0.6}@media(max-width:768px){.content-section{padding:20px 12px}.header-section{margin-bottom:24px}.main-title{font-size:24px;line-height:1.3}.subtitle{font-size:14px}.primary-btn{padding:10px 18px;font-size:13px}.register-form{padding:20px 16px}.form-row{grid-template-columns:1fr;gap:0;margin-bottom:0}.form-row .form-field{margin-bottom:16px}.form-field{margin-bottom:16px}.form-field input,.form-field select{font-size:16px}.logo-banner{min-height:45px}.logo-scroll{gap:30px}.logo-small{height:18px}.logo-normal{height:28px}.logo-xlarge{height:42px}.success-title{font-size:28px}.success-text{font-size:16px}}`;
