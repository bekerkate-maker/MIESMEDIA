import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import MiesLogo from '@/components/MiesLogo';
import logoCasu from '@/components/logo_klanten/logo_casu.png';
import logoKoekela from '@/components/logo_klanten/logo-koekela-winkels-denieuwebinnenweg.png';
import logoJordys from '@/components/logo_klanten/JORDYS_LOGO.png';
import logoMorganMees from '@/components/logo_klanten/morganmees_logo.png';
import logoDudok from '@/components/logo_klanten/dudok_logo.png';

export default function ManageShoots() {
  const [shoots, setShoots] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const navigate = useNavigate();
  const [editingShoot, setEditingShoot] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [expandedShoot, setExpandedShoot] = useState<number | null>(null);

  const [newShoot, setNewShoot] = useState<{
    client: string;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    description: string;
    spots: string;
    clientWebsite: string;
    clientInstagram: string;
    moodboardLink: string;
    bannerPhoto: File | null;
    bannerPhotoUrl: string;
    compensationType: string;
    compensationAmount: string;
    compensationBusinessName: string;
  }>({
    client: '',
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    description: '',
    spots: '',
    clientWebsite: '',
    clientInstagram: '',
    moodboardLink: '',
    bannerPhoto: null,
    bannerPhotoUrl: '',
    compensationType: 'financiële vergoeding',
    compensationAmount: '',
    compensationBusinessName: ''
  });

  // Functie om een datum als Nederlandse string te tonen
  function formatDateNL(dateString?: string, long: boolean = false): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // fallback als het geen geldige datum is
    if (long) {
      return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    return date.toLocaleDateString('nl-NL'); // korte notatie: dd-mm-jjjj
  }

  // Shoots ophalen uit Supabase
  const fetchShoots = async () => {
    try {
      const { data, error } = await supabase
        .from('shoots')
        .select('*')
        .order('shoot_date', { ascending: false });
      if (error) throw error;
      setShoots(data || []);
    } catch (error) {
      console.error('Error fetching shoots:', error);
      alert('Fout bij ophalen van shoots: ' + (error as Error).message);
    }
  };

  // Fetch registrations from Supabase
  const fetchRegistrations = async () => {
    try {
      let { data, error } = await supabase
        .from('shoot_registrations')
        .select(`*, models (photo_url, first_name, last_name)`) // pas aan indien nodig
        .order('created_at', { ascending: false });
      if (error) {
        // Fallback: probeer zonder models-relatie
        const fallback = await supabase
          .from('shoot_registrations')
          .select('*')
          .order('created_at', { ascending: false });
        data = fallback.data;
      }
      setRegistrations(data || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      alert('Fout bij ophalen van aanmeldingen: ' + (error as Error).message);
    }
  };

  useEffect(() => {
    fetchShoots();
    fetchRegistrations();
  }, []);

  // Verwijder een registratie uit Supabase
  const handleDeleteRegistration = async (registrationId: number) => {
    if (!window.confirm('Weet je zeker dat je deze aanmelding wilt verwijderen?')) return;
    const { error } = await supabase
      .from('shoot_registrations')
      .delete()
      .eq('id', registrationId);
    if (error) {
      alert('Fout bij verwijderen van aanmelding: ' + error.message);
    } else {
      alert('✅ Aanmelding verwijderd!');
      fetchRegistrations();
    }
  };

  const uploadBannerImage = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `shoot-banners/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

      console.log('Starting upload for:', fileName);

      const { error: uploadError } = await supabase.storage
        .from('banners')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload Error details:', uploadError);
        throw uploadError;
      }

      // Handmatige URL constructie voor zekerheid
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      // Verwijder eventuele trailing slash
      const baseUrl = supabaseUrl?.replace(/\/$/, '');
      const publicUrl = `${baseUrl}/storage/v1/object/public/banners/${fileName}`;

      console.log('Generated Public URL:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Error uploading banner:', error);
      alert('Fout bij uploaden banner: ' + (error as Error).message);
      return null;
    }
  };

  // Helper om datum string te parsen naar YYYY-MM-DD
  function parseDateToISO(dateStr: string): string {
    if (!dateStr) return '';

    // Check if already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

    try {
      // Probeer standaard JS Date parsing
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }

      // Probeer Nederlandse parsing (dag maand jaar)
      const dutchMonths = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
      const parts = dateStr.toLowerCase().split(/[ -]/);

      let day, month, year;

      if (parts.length >= 3) {
        day = parseInt(parts[0]);
        // Zoek maand index
        const monthIndex = dutchMonths.findIndex(m => parts[1].includes(m));
        if (monthIndex !== -1) {
          month = monthIndex + 1;
        } else {
          month = parseInt(parts[1]);
        }
        year = parseInt(parts[2]);

        if (day && month && year) {
          return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        }
      }
    } catch (e) {
      console.warn('Date parsing failed:', e);
    }

    return dateStr; // fallback
  }

  // Add or update shoot with banner
  const handleAddShootWithBanner = async (bannerPhotoUrl: string) => {
    try {
      if (editingShoot) {
        // Update bestaande shoot
        const updateFields: any = {
          client_name: newShoot.client,
          title: newShoot.title,
          shoot_date: parseDateToISO(newShoot.date),
          start_time: newShoot.startTime,
          end_time: newShoot.endTime,
          location: newShoot.location,
          description: `${newShoot.title}\n\n${newShoot.description}`,
          spots: Number(newShoot.spots),
          client_website: newShoot.clientWebsite,
          client_instagram: newShoot.clientInstagram,
          moodboard_link: newShoot.moodboardLink,
          banner_photo_url: bannerPhotoUrl || newShoot.bannerPhotoUrl || '',
          compensation_type: newShoot.compensationType,
          compensation_amount: newShoot.compensationAmount ? Number(newShoot.compensationAmount) : null,
          compensation_business_name: newShoot.compensationBusinessName || null
        };
        const updateResult = await supabase
          .from('shoots')
          .update(updateFields)
          .eq('id', editingShoot);
        if (updateResult.error) throw updateResult.error;
        alert('✅ Shoot bijgewerkt!');
      } else {
        // Nieuwe shoot
        const insertFields: any = {
          client_name: newShoot.client,
          title: newShoot.title,
          shoot_date: parseDateToISO(newShoot.date),
          start_time: newShoot.startTime,
          end_time: newShoot.endTime,
          location: newShoot.location,
          description: `${newShoot.title}\n\n${newShoot.description}`,
          spots: Number(newShoot.spots),
          client_website: newShoot.clientWebsite,
          client_instagram: newShoot.clientInstagram,
          moodboard_link: newShoot.moodboardLink,
          banner_photo_url: bannerPhotoUrl,
          compensation_type: newShoot.compensationType,
          compensation_amount: newShoot.compensationAmount ? Number(newShoot.compensationAmount) : null,
          compensation_business_name: newShoot.compensationBusinessName || null,
          status: 'open'
        };
        const insertResult = await supabase
          .from('shoots')
          .insert(insertFields);
        if (insertResult.error) throw insertResult.error;
        alert('✅ Shoot toegevoegd!');
      }
      setShowAddForm(false);
      setEditingShoot(null);
      setNewShoot({
        client: '',
        title: '',
        date: '',
        startTime: '',
        endTime: '',
        location: '',
        description: '',
        spots: '',
        clientWebsite: '',
        clientInstagram: '',
        moodboardLink: '',
        bannerPhoto: null,
        bannerPhotoUrl: '',
        compensationType: 'financiële vergoeding',
        compensationAmount: '',
        compensationBusinessName: ''
      });
      await fetchShoots();
    } catch (error) {
      console.error('Error adding/updating shoot:', error);
      alert('Fout bij opslaan van shoot: ' + (error as Error).message);
    }
  };

  // Get registrations for a shoot
  const getRegistrationsForShoot = (shootId: number) => {
    return registrations.filter(reg => reg.shoot_id === shootId);
  };



  const handleEditShoot = (shoot: any) => {
    setEditingShoot(shoot.id);
    // Split description only if it contains two newlines, otherwise use title and description as stored
    let title = shoot.title || '';
    let description = shoot.description || '';
    if (shoot.description && shoot.description.includes('\n\n')) {
      const parts = shoot.description.split('\n\n');
      title = parts[0];
      description = parts.slice(1).join('\n\n');
    }
    setNewShoot({
      client: shoot.client_name || shoot.client || '',
      title,
      date: shoot.shoot_date || shoot.date ? formatDateNL(shoot.shoot_date || shoot.date) : '',
      startTime: shoot.start_time || '',
      endTime: shoot.end_time || '',
      location: shoot.location || '',
      description,
      spots: shoot.spots !== undefined && shoot.spots !== null ? shoot.spots.toString() : '',
      clientWebsite: shoot.client_website || shoot.clientWebsite || '',
      clientInstagram: shoot.client_instagram || shoot.clientInstagram || '',
      moodboardLink: shoot.moodboard_link || '',
      bannerPhoto: null,
      bannerPhotoUrl: shoot.banner_photo_url || '',
      compensationType: shoot.compensation_type || 'financiële vergoeding',
      compensationAmount: shoot.compensation_amount !== undefined && shoot.compensation_amount !== null ? shoot.compensation_amount.toString() : '',
      compensationBusinessName: shoot.compensation_business_name || ''
    });
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingShoot(null);
    setShowAddForm(false);
    setNewShoot({
      client: '',
      title: '',
      date: '',
      startTime: '',
      endTime: '',
      location: '',
      description: '',
      spots: '',
      clientWebsite: '',
      clientInstagram: '',
      moodboardLink: '',
      bannerPhoto: null,
      bannerPhotoUrl: '',
      compensationType: 'financiële vergoeding',
      compensationAmount: '',
      compensationBusinessName: ''
    });
  };

  const handleDeleteShoot = async (id: number) => {
    if (window.confirm('Weet je zeker dat je deze shoot wilt verwijderen?')) {
      try {
        const { error } = await supabase
          .from('shoots')
          .delete()
          .eq('id', id);

        if (error) throw error;

        alert('✅ Shoot verwijderd!');
        await fetchShoots(); // Refresh lijst
      } catch (error) {
        console.error('Error deleting shoot:', error);
        alert('Fout bij verwijderen: ' + (error as Error).message);
      }
    }
  };

  return (
    <>
      <div style={{
        minHeight: '100vh',
        background: '#E5DDD5',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Banner bovenaan met scrollende logos */}
        <div style={{ background: '#fff', padding: '12px 0', position: 'relative', minHeight: '60px', width: '100%' }}>
          {/* Scrollende logos - volledige breedte */}
          <div className="logo-scroll" style={{ gap: 60, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minWidth: '2000px', width: '100%', overflow: 'hidden' }}>
            {/* Herhaal de logo's 3x voor een vloeiende loop */}
            {[...Array(3)].map((_, i) => (
              <React.Fragment key={`logo-set-${i}`}>
                <img key={`casu-${i}`} src={logoCasu} alt="La Cazuela" className="logo-normal" />
                <img key={`koekela-${i}`} src={logoKoekela} alt="Koekela" className="logo-small" />
                <img key={`jordys-${i}`} src={logoJordys} alt="Jordys" className="logo-normal" />
                <img key={`morganmees-${i}`} src={logoMorganMees} alt="Morgan & Mees" className="logo-normal" />
                <img key={`dudok-${i}`} src={logoDudok} alt="Dudok" className="logo-xlarge" />
              </React.Fragment>
            ))}
          </div>
        </div>
        {/* Hoofdcontent */}
        <div style={{ padding: '60px 20px', flex: 1 }}>
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <MiesLogo size={110} />
            </div>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <h1 style={{ fontSize: 32, fontWeight: 700, color: '#1F2B4A', margin: 0 }}>Shoots beheren</h1>
              <p style={{ fontSize: 16, color: '#6B7280', marginTop: 8, marginBottom: 0 }}>
                Maak nieuwe shoots aan en beheer lopende shoots.
              </p>
              <button
                style={{
                  marginTop: 18,
                  padding: '12px 32px',
                  background: '#2B3E72',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 18,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontFamily: 'inherit',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}
                onClick={() => setShowAddForm(true)}
                onMouseEnter={e => (e.currentTarget.style.background = '#1F2B4A')}
                onMouseLeave={e => (e.currentTarget.style.background = '#2B3E72')}
              >
                + Nieuwe shoot aanmaken
              </button>
            </div>


            {/* Formulier voor nieuwe shoot */}
            {showAddForm && (
              <div style={{
                maxWidth: 700,
                margin: '0 auto 40px',
                background: '#fff',
                borderRadius: 12,
                padding: 32,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                <h2 style={{
                  fontSize: 24,
                  fontWeight: 600,
                  color: '#1F2B4A',
                  marginBottom: 24
                }}>
                  {editingShoot ? 'Shoot bewerken' : 'Nieuwe shoot'}
                </h2>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  let bannerPhotoUrl = newShoot.bannerPhotoUrl;

                  if (newShoot.bannerPhoto) {
                    const uploadedUrl = await uploadBannerImage(newShoot.bannerPhoto);
                    if (uploadedUrl) {
                      bannerPhotoUrl = uploadedUrl;
                    } else {
                      return; // Stop if upload failed
                    }
                  }

                  await handleAddShootWithBanner(bannerPhotoUrl);
                }}>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#1F2B4A', fontWeight: 500 }}>
                      Bannerfoto (optioneel)
                    </label>
                    {/* Preview huidige banner als die er is en er geen nieuwe gekozen is */}
                    {newShoot.bannerPhotoUrl && !newShoot.bannerPhoto && (
                      <img
                        src={newShoot.bannerPhotoUrl}
                        alt="Huidige banner"
                        style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 8, marginBottom: 8, border: '2px solid #E5DDD5' }}
                      />
                    )}
                    {/* Preview nieuwe banner als die gekozen is */}
                    {newShoot.bannerPhoto && (
                      <img
                        src={URL.createObjectURL(newShoot.bannerPhoto)}
                        alt="Preview banner"
                        style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }}
                      />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0] || null;
                        setNewShoot(s => ({ ...s, bannerPhoto: file }));
                      }}
                      style={{ marginBottom: 8 }}
                    />
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#1F2B4A', fontWeight: 500 }}>
                      Klant *
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Bijv. La Cazuela"
                      value={newShoot.client}
                      onChange={(e) => setNewShoot({ ...newShoot, client: e.target.value })}
                      style={{ width: '100%', padding: '12px', background: '#E5DDD5', border: 'none', borderRadius: 8, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#1F2B4A', fontWeight: 500 }}>
                      Website klant / instagram klant
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="url"
                        placeholder="https://lacazuela.nl"
                        value={newShoot.clientWebsite}
                        onChange={(e) => setNewShoot({ ...newShoot, clientWebsite: e.target.value })}
                        style={{ flex: 1, padding: '12px', background: '#E5DDD5', border: 'none', borderRadius: 8, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' }}
                      />
                      <input
                        type="text"
                        placeholder="@instagram"
                        value={newShoot.clientInstagram}
                        onChange={(e) => setNewShoot({ ...newShoot, clientInstagram: e.target.value })}
                        style={{ flex: 1, padding: '12px', background: '#E5DDD5', border: 'none', borderRadius: 8, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' }}
                      />
                    </div>
                    <small style={{ fontSize: 12, color: '#6B7280', marginTop: 4, display: 'block' }}>
                      Optioneel - Modellen kunnen naar de website of Instagram van de klant gaan
                    </small>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#1F2B4A', fontWeight: 500 }}>
                      Link naar Moodboard (Canva)
                    </label>
                    <input
                      type="url"
                      placeholder="https://canva.com/..."
                      value={newShoot.moodboardLink}
                      onChange={(e) => setNewShoot({ ...newShoot, moodboardLink: e.target.value })}
                      style={{ width: '100%', padding: '12px', background: '#E5DDD5', border: 'none', borderRadius: 8, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#1F2B4A', fontWeight: 500 }}>
                      Titel *
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Bijv. zomer campagne fotoshoot"
                      value={newShoot.title}
                      onChange={(e) => setNewShoot({ ...newShoot, title: e.target.value })}
                      style={{ width: '100%', padding: '12px', background: '#E5DDD5', border: 'none', borderRadius: 8, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#1F2B4A', fontWeight: 500 }}>
                        Datum *
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="15 december 2025"
                        value={newShoot.date}
                        onChange={(e) => setNewShoot({ ...newShoot, date: e.target.value })}
                        style={{ width: '100%', padding: '12px', background: '#E5DDD5', border: 'none', borderRadius: 8, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#1F2B4A', fontWeight: 500 }}>
                        Begintijd *
                      </label>
                      <input
                        required
                        type="time"
                        value={newShoot.startTime}
                        onChange={(e) => setNewShoot({ ...newShoot, startTime: e.target.value })}
                        style={{ width: '100%', padding: '12px', background: '#E5DDD5', border: 'none', borderRadius: 8, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#1F2B4A', fontWeight: 500 }}>
                        Eindtijd *
                      </label>
                      <input
                        required
                        type="time"
                        value={newShoot.endTime}
                        onChange={(e) => setNewShoot({ ...newShoot, endTime: e.target.value })}
                        style={{ width: '100%', padding: '12px', background: '#E5DDD5', border: 'none', borderRadius: 8, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#1F2B4A', fontWeight: 500 }}>
                        Aantal plekken *
                      </label>
                      <input
                        required
                        type="number"
                        min="1"
                        placeholder="3"
                        value={newShoot.spots}
                        onChange={(e) => setNewShoot({ ...newShoot, spots: e.target.value })}
                        style={{ width: '100%', padding: '12px', background: '#E5DDD5', border: 'none', borderRadius: 8, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#1F2B4A', fontWeight: 500 }}>
                      Locatie *
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Rotterdam centrum"
                      value={newShoot.location}
                      onChange={(e) => setNewShoot({ ...newShoot, location: e.target.value })}
                      style={{ width: '100%', padding: '12px', background: '#E5DDD5', border: 'none', borderRadius: 8, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#1F2B4A', fontWeight: 500 }}>
                      Beschrijving *
                    </label>
                    <textarea
                      required
                      placeholder="Korte beschrijving van de shoot..."
                      value={newShoot.description}
                      onChange={(e) => setNewShoot({ ...newShoot, description: e.target.value })}
                      rows={4}
                      style={{ width: '100%', padding: '12px', background: '#E5DDD5', border: 'none', borderRadius: 8, fontSize: 15, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#1F2B4A', fontWeight: 500 }}>
                      Soort vergoeding *
                    </label>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <select
                        required
                        value={newShoot.compensationType}
                        onChange={(e) => {
                          const newType = e.target.value;
                          setNewShoot(s => ({
                            ...s,
                            compensationType: newType,
                            compensationAmount: newType === 'geen' ? '' : s.compensationAmount,
                            compensationBusinessName: newType === 'cadeaubon' ? s.compensationBusinessName : ''
                          }));
                        }}
                        style={{ flex: 1, padding: '12px', background: '#E5DDD5', border: 'none', borderRadius: 8, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box', cursor: 'pointer' }}
                      >
                        <option value="financiële vergoeding">Financiële vergoeding t.w.v.</option>
                        <option value="cadeaubon">Cadeaubon</option>
                        <option value="geen">Geen vergoeding</option>
                      </select>

                      {newShoot.compensationType === 'financiële vergoeding' && (
                        <input
                          required
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Bedrag (€)"
                          value={newShoot.compensationAmount}
                          onChange={(e) => setNewShoot({ ...newShoot, compensationAmount: e.target.value })}
                          style={{ width: '150px', padding: '12px', background: '#E5DDD5', border: 'none', borderRadius: 8, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' }}
                        />
                      )}

                      {newShoot.compensationType === 'cadeaubon' && (
                        <>
                          <input
                            required
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Bedrag (€)"
                            value={newShoot.compensationAmount}
                            onChange={(e) => setNewShoot({ ...newShoot, compensationAmount: e.target.value })}
                            style={{ width: '120px', padding: '12px', background: '#E5DDD5', border: 'none', borderRadius: 8, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' }}
                          />
                          <input
                            required
                            type="text"
                            placeholder="Naam zaak"
                            value={newShoot.compensationBusinessName}
                            onChange={(e) => setNewShoot({ ...newShoot, compensationBusinessName: e.target.value })}
                            style={{ flex: 1, padding: '12px', background: '#E5DDD5', border: 'none', borderRadius: 8, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' }}
                          />
                        </>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      style={{
                        flex: 1,
                        padding: '14px',
                        background: '#E5DDD5',
                        color: '#1F2B4A',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 16,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        fontFamily: 'inherit'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#D1C7BB';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#E5DDD5';
                      }}
                    >
                      Annuleren
                    </button>
                    <button
                      type="submit"
                      style={{
                        flex: 2,
                        padding: '14px',
                        background: '#2B3E72',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 16,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        fontFamily: 'inherit'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#1F2B4A';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#2B3E72';
                      }}
                    >
                      {editingShoot ? 'Shoot bijwerken' : 'Shoot toevoegen'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Shoots Lijst */}
            <div style={{
              maxWidth: 1400,
              margin: '0 auto'
            }}>
              <h2 style={{
                fontSize: 24,
                fontWeight: 600,
                color: '#1F2B4A',
                marginBottom: 24
              }}>
                Alle shoots ({shoots.length})
              </h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: 24
              }}>
                {shoots.map(shoot => (
                  <div key={shoot.id} style={{
                    background: '#fff',
                    borderRadius: 12,
                    padding: 0,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0,
                    alignItems: 'start',
                    overflow: 'hidden'
                  }}>
                    {shoot.banner_photo_url && (
                      <div
                        style={{
                          width: '100%',
                          height: 200,
                          overflow: 'hidden',
                          cursor: 'pointer'
                        }}
                        onClick={() => setPreviewImage(shoot.banner_photo_url)}
                        title="Klik voor voorbeeld"
                      >
                        <img
                          src={shoot.banner_photo_url}
                          alt="Banner shoot"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block'
                          }}
                        />
                      </div>
                    )}
                    <div style={{
                      padding: 24,
                      textAlign: 'left',
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                      <div style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#2B3E72',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: 2
                      }}>
                        {shoot.client_name || shoot.client}
                      </div>
                      {(() => {
                        const endDate = shoot.shoot_date ? new Date(shoot.shoot_date) : null;
                        const now = new Date();
                        let statusLabel = '';
                        if (endDate && endDate < now) {
                          statusLabel = 'verlopen';
                        } else {
                          statusLabel = 'open';
                        }
                        return (
                          <div style={{ fontSize: 12, color: statusLabel === 'verlopen' ? '#DC2626' : '#10B981', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>{statusLabel}</div>
                        );
                      })()}
                      <h3 style={{
                        fontSize: 20,
                        fontWeight: 600,
                        color: '#1F2B4A',
                        marginBottom: 12
                      }}>
                        {shoot.description?.split('\n\n')[0] || shoot.title}
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                        <div style={{
                          fontSize: 14,
                          color: '#6B7280',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8
                        }}>
                          <span style={{ fontSize: 18, color: '#1F2B4A' }}>•</span> {formatDateNL(shoot.shoot_date || shoot.date)}
                        </div>
                        {shoot.start_time && shoot.end_time && (
                          <div style={{
                            fontSize: 14,
                            color: '#6B7280',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8
                          }}>
                            <span style={{ fontSize: 18, color: '#1F2B4A' }}>•</span> {shoot.start_time.substring(0, 5)} - {shoot.end_time.substring(0, 5)}
                          </div>
                        )}
                        <div style={{
                          fontSize: 14,
                          color: '#6B7280',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8
                        }}>
                          <span style={{ fontSize: 18, color: '#1F2B4A' }}>•</span> {shoot.location}
                        </div>
                        <div style={{
                          fontSize: 14,
                          color: '#6B7280',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8
                        }}>
                          <span style={{ fontSize: 18, color: '#1F2B4A' }}>•</span> {shoot.spots} plekken
                        </div>
                        {shoot.compensation_type && (
                          <div style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: '#2B3E72',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8
                          }}>
                            <span style={{ fontSize: 18, color: '#1F2B4A' }}>•</span>
                            {shoot.compensation_type === 'bedrag' && `€${shoot.compensation_amount}`}
                            {shoot.compensation_type === 'eten' && 'Eten betaald'}
                            {shoot.compensation_type === 'cadeaubon' && `Cadeaubon €${shoot.compensation_amount}`}
                            {shoot.compensation_type === 'geen' && 'Geen vergoeding'}
                          </div>
                        )}
                      </div>
                      <p style={{
                        fontSize: 14,
                        color: '#4B5563',
                        lineHeight: 1.6,
                        marginBottom: 16,
                        flex: 1
                      }}>
                        {shoot.description?.split('\n\n').slice(1).join('\n\n') || shoot.description}
                      </p>

                      {shoot.moodboard_link && (
                        <a
                          href={shoot.moodboard_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-block',
                            fontSize: 13,
                            color: '#2B3E72',
                            textDecoration: 'none',
                            fontWeight: 600,
                            marginBottom: 12,
                            paddingBottom: 2,
                            borderBottom: '1px solid #2B3E72'
                          }}
                        >
                          Bekijk moodboard &#8594;
                        </a>
                      )}

                      {(shoot.client_website || shoot.clientWebsite) ? (
                        <a
                          href={shoot.client_website || shoot.clientWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontSize: 13,
                            color: '#2B3E72',
                            textDecoration: 'none',
                            fontWeight: 500,
                            marginBottom: 16
                          }}
                        >
                          <span style={{ fontSize: 18, color: '#1F2B4A' }}>•</span> {shoot.clientWebsite || shoot.client_website}
                        </a>
                      ) : (
                        <div style={{ height: 21, marginBottom: 16 }}></div> /* Spacer to keep alignment */
                      )}

                      {/* Footer Actions Row */}
                      <div style={{
                        marginTop: 20,
                        paddingTop: 20,
                        borderTop: '1px solid #E5E7EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 16
                      }}>
                        {/* Left: Aanmeldingen Button */}
                        <button
                          onClick={() => setExpandedShoot(expandedShoot === shoot.id ? null : shoot.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '8px 12px',
                            background: getRegistrationsForShoot(shoot.id).length > 0 ? '#DBEAFE' : '#F3F4F6',
                            color: getRegistrationsForShoot(shoot.id).length > 0 ? '#1E40AF' : '#6B7280',
                            border: 'none',
                            borderRadius: 6,
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            fontFamily: 'inherit'
                          }}
                        >
                          <span>{expandedShoot === shoot.id ? '▼' : '▶'}</span>
                          <span>Aanmeldingen ({getRegistrationsForShoot(shoot.id).length})</span>
                        </button>

                        {/* Right: Edit/Delete Buttons */}
                        <div style={{ display: 'flex', gap: 12 }}>
                          <button
                            onClick={() => handleEditShoot(shoot)}
                            title="Bewerken"
                            style={{
                              padding: '8px 12px',
                              background: '#E5DDD5',
                              color: '#1F2B4A',
                              border: 'none',
                              borderRadius: 8,
                              fontSize: 16,
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              fontFamily: 'inherit',
                              whiteSpace: 'nowrap'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#D1C7BB';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#E5DDD5';
                            }}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteShoot(shoot.id)}
                            title="Verwijderen"
                            style={{
                              padding: '8px 12px',
                              background: '#FEE2E2',
                              color: '#DC2626',
                              border: 'none',
                              borderRadius: 8,
                              fontSize: 16,
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              fontFamily: 'inherit',
                              whiteSpace: 'nowrap'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#FCA5A5';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#FEE2E2';
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      {/* Expandable Registrations List (Full Width Below) */}
                      {expandedShoot === shoot.id && (
                        <div style={{ marginTop: 16 }}>
                          {(() => {
                            const shootRegistrations = getRegistrationsForShoot(shoot.id);
                            if (shootRegistrations.length === 0) {
                              return (
                                <div style={{
                                  padding: 16,
                                  textAlign: 'center',
                                  color: '#9CA3AF',
                                  fontSize: 13,
                                  background: '#F9FAFB',
                                  borderRadius: 8
                                }}>
                                  Nog geen aanmeldingen voor deze shoot
                                </div>
                              );
                            }

                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {shootRegistrations.map((reg) => (
                                  <div key={reg.id} style={{
                                    background: '#F9FAFB',
                                    borderRadius: 8,
                                    padding: 16,
                                    fontSize: 13,
                                    lineHeight: 1.6
                                  }}>
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 8,
                                      marginBottom: 8,
                                      flexWrap: 'wrap'
                                    }}>
                                      {reg.model_id ? (
                                        <button
                                          onClick={() => navigate(`/dashboard?model=${reg.model_id}`)}
                                          style={{
                                            background: 'none',
                                            border: 'none',
                                            padding: 0,
                                            fontWeight: 600,
                                            color: '#2B3E72',
                                            cursor: 'pointer',
                                            textDecoration: 'underline',
                                            fontSize: 13,
                                            fontFamily: 'inherit',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.color = '#1F2B4A';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.color = '#2B3E72';
                                          }}
                                        >
                                          <div style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: '50%',
                                            overflow: 'hidden',
                                            background: '#E5DDD5',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                            border: '2px solid #2B3E72'
                                          }}>
                                            {reg.models?.photo_url ? (
                                              <img
                                                src={reg.models.photo_url}
                                                alt={reg.name}
                                                style={{
                                                  width: '100%',
                                                  height: '100%',
                                                  objectFit: 'cover'
                                                }}
                                              />
                                            ) : (
                                              <span style={{ fontSize: 16, color: '#2B3E72' }}>👤</span>
                                            )}
                                          </div>
                                          <span>{reg.name}</span>
                                        </button>
                                      ) : (
                                        <span style={{ fontWeight: 600, color: '#1F2B4A' }}>
                                          {reg.name}
                                        </span>
                                      )}
                                      {reg.model_id && (
                                        <span style={{
                                          padding: '2px 8px',
                                          background: '#DBEAFE',
                                          color: '#1E40AF',
                                          borderRadius: 4,
                                          fontSize: 11,
                                          fontWeight: 600
                                        }}>
                                          ✓ Geregistreerd Model
                                        </span>
                                      )}
                                    </div>
                                    <div style={{ color: '#6B7280', marginBottom: 4 }}>
                                      📧 {reg.email}
                                    </div>
                                    <div style={{ color: '#6B7280', marginBottom: 4 }}>
                                      📱 {reg.phone}
                                    </div>
                                    {reg.instagram && (
                                      <div style={{ marginBottom: 4 }}>
                                        <span style={{ color: '#6B7280' }}>📷 </span>
                                        <a
                                          href={`https://instagram.com/${reg.instagram.replace('@', '')}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          style={{
                                            color: '#2B3E72',
                                            textDecoration: 'none',
                                            fontWeight: 500
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.textDecoration = 'underline';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.textDecoration = 'none';
                                          }}
                                        >
                                          @{reg.instagram.replace('@', '')}
                                        </a>
                                      </div>
                                    )}
                                    {reg.message && (
                                      <div style={{
                                        marginTop: 8,
                                        paddingTop: 8,
                                        borderTop: '1px solid #E5E7EB',
                                        color: '#4B5563',
                                        fontStyle: 'italic'
                                      }}>
                                        "{reg.message}"
                                      </div>
                                    )}
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      marginTop: 8,
                                      fontSize: 11,
                                      color: '#9CA3AF'
                                    }}>
                                      <span>
                                        Aangemeld op: {formatDateNL(reg.created_at, true)}
                                      </span>
                                      <button
                                        onClick={() => handleDeleteRegistration(reg.id)}
                                        style={{
                                          marginLeft: 12,
                                          padding: '4px 10px',
                                          background: '#FEE2E2',
                                          color: '#DC2626',
                                          border: 'none',
                                          borderRadius: 6,
                                          fontSize: 12,
                                          fontWeight: 600,
                                          cursor: 'pointer',
                                          transition: 'all 0.3s ease',
                                          fontFamily: 'inherit',
                                          whiteSpace: 'nowrap',
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.background = '#FCA5A5';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.background = '#FEE2E2';
                                        }}
                                      >
                                        🗑️ Verwijder aanmelding
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {shoots.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: 60,
                  color: '#9CA3AF'
                }}>
                  <p style={{ fontSize: 18 }}>Geen shoots gevonden</p>
                  <p style={{ fontSize: 14, marginTop: 8 }}>Klik op "Nieuwe Shoot Toevoegen" om te beginnen</p>
                </div>
              )}
            </div>

            {/* Terug naar dashboard knop */}
            <div style={{ textAlign: 'center', marginTop: 60 }}>
              <button
                onClick={() => window.location.href = '/dashboard'}
                style={{
                  padding: '12px 24px',
                  background: '#fff',
                  color: '#2B3E72',
                  border: '2px solid #2B3E72',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontFamily: 'inherit'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#2B3E72';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#fff';
                  e.currentTarget.style.color = '#2B3E72';
                }}
              >
                ← Terug naar Dashboard
              </button>
              <style>{`
            @keyframes scroll {
              0% {
                transform: translateX(0);
              }
              100% {
                transform: translateX(calc(-100% / 3));
              }
            }
            .logo-scroll {
              animation: scroll 30s linear infinite;
              will-change: transform;
            }
            .logo-scroll img {
              width: auto;
              object-fit: contain;
              filter: grayscale(100%);
            }
            .logo-small {
              height: 25px;
            }
            .logo-normal {
              height: 40px;
            }
            .logo-large {
              height: 50px;
            }
            .logo-xlarge {
              height: 60px;
            }
          `}</style>
            </div>
          </div>
        </div>

        {/* Image Preview Modal */}
        {previewImage && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: 24,
              cursor: 'pointer'
            }}
            onClick={() => setPreviewImage(null)}
          >
            <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
              <img
                src={previewImage}
                alt="Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '90vh',
                  borderRadius: 8,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  display: 'block'
                }}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewImage(null);
                }}
                style={{
                  position: 'absolute',
                  top: -15,
                  right: -15,
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: '#fff',
                  color: '#1F2B4A',
                  border: 'none',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ...existing code...
