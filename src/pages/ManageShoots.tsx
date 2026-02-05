import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import MiesLogo from '@/components/MiesLogo';
import ClientLogoBanner from '@/components/ClientLogoBanner';

export default function ManageShoots() {
  const [shoots, setShoots] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const navigate = useNavigate();
  const [editingShoot, setEditingShoot] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [expandedShoot, setExpandedShoot] = useState<number | null>(null);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [pendingShootData, setPendingShootData] = useState<any>(null);
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [tempBannerImage, setTempBannerImage] = useState<string | null>(null);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState(1);
  const [session, setSession] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

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
    clientInstagram: '@',
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
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

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

  const updateRegistrationStatus = async (registrationId: number, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('shoot_registrations')
        .update({ status: newStatus })
        .eq('id', registrationId);

      if (error) throw error;

      // Update local state
      setRegistrations(prev => prev.map(reg =>
        reg.id === registrationId ? { ...reg, status: newStatus } : reg
      ));
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Fout bij updaten status: ' + (error as Error).message);
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
          client_instagram: newShoot.clientInstagram === '@' ? '' : newShoot.clientInstagram,
          moodboard_link: newShoot.moodboardLink,
          banner_photo_url: bannerPhotoUrl || newShoot.bannerPhotoUrl || '',
          compensation_type: newShoot.compensationType,
          compensation_amount: newShoot.compensationAmount ? Number(newShoot.compensationAmount) : null,
          compensation_business_name: newShoot.compensationBusinessName || null
        };
        console.log('Update Payload:', updateFields);
        const updateResult = await supabase
          .from('shoots')
          .update(updateFields)
          .eq('id', editingShoot)
          .select();

        if (updateResult.error) throw updateResult.error;
        if (!updateResult.data || updateResult.data.length === 0) {
          throw new Error("Geen shoot bijgewerkt. Mogelijk heb je geen rechten of is de shoot niet gevonden");
        }
        alert('✅ Shoot bijgewerkt!');
      } else {
        // Nieuwe shoot - toon bevestigingsdialoog voor email verzending
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
          client_instagram: newShoot.clientInstagram === '@' ? '' : newShoot.clientInstagram,
          moodboard_link: newShoot.moodboardLink,
          banner_photo_url: bannerPhotoUrl,
          compensation_type: newShoot.compensationType,
          compensation_amount: newShoot.compensationAmount ? Number(newShoot.compensationAmount) : null,
          compensation_business_name: newShoot.compensationBusinessName || null,
          status: 'open'
        };
        const insertResult = await supabase
          .from('shoots')
          .insert(insertFields)
          .select();
        if (insertResult.error) throw insertResult.error;

        // Sla shoot data op en toon bevestigingsdialoog
        if (insertResult.data && insertResult.data.length > 0) {
          setPendingShootData(insertResult.data[0]);
          setShowEmailConfirmation(true);
          return; // Stop hier, wacht op gebruikersbevestiging
        } else {
          alert('✅ Shoot toegevoegd!');
        }
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
        clientInstagram: '@',
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

  const registrationsByShoot = useMemo(() => {
    const map: Record<number, any[]> = {};
    registrations.forEach(reg => {
      if (!map[reg.shoot_id]) map[reg.shoot_id] = [];
      map[reg.shoot_id].push(reg);
    });
    return map;
  }, [registrations]);

  // Get registrations for a shoot
  const getRegistrationsForShoot = (shootId: number) => {
    return registrationsByShoot[shootId] || [];
  };



  const handleEditShoot = (shoot: any) => {
    console.log('Editing shoot (RAW):', shoot);
    setEditingShoot(shoot.id);
    // Split description only if it contains two newlines, otherwise use title and description as stored
    let title = shoot.title || '';
    let description = shoot.description || '';
    if (shoot.description && shoot.description.includes('\n\n')) {
      const parts = shoot.description.split('\n\n');
      if (!title) {
        title = parts[0];
      }
      description = parts.slice(1).join('\n\n');
    }
    console.log('Extracted Title:', title);
    console.log('Client Name:', shoot.client_name || shoot.client);

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
      clientInstagram: shoot.client_instagram || shoot.clientInstagram || '@',
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
      clientInstagram: '@',
      moodboardLink: '',
      bannerPhoto: null,
      bannerPhotoUrl: '',
      compensationType: 'financiële vergoeding',
      compensationAmount: '',
      compensationBusinessName: ''
    });
    fetchShoots();
  };

  // Bevestig en verstuur emails naar alle models
  const handleConfirmSendEmails = async () => {
    if (!pendingShootData) return;

    setIsSendingEmails(true); // Start loading

    try {
      console.log('Sending emails to all models about new shoot...');
      const { data: functionData, error: functionError } = await supabase.functions.invoke('send-new-shoot-emails', {
        body: {
          shootId: pendingShootData.id,
          shootTitle: newShoot.title,
          shootDate: newShoot.date,
          shootTime: `${newShoot.startTime} - ${newShoot.endTime}`,
          shootLocation: newShoot.location
        }
      });

      if (functionError) {
        console.error('Error sending emails:', functionError);
        alert('✅ Shoot toegevoegd! ⚠️ Let op: Er ging iets mis bij het versturen van de emails naar de talenten');
      } else {
        console.log('Emails sent successfully:', functionData);
        alert(`✅ Shoot toegevoegd en emails verzonden naar ${functionData.successCount || 'alle'} talenten!`);
      }
    } catch (emailError) {
      console.error('Error invoking email function:', emailError);
      alert('✅ Shoot toegevoegd! ⚠️ Let op: Er ging iets mis bij het versturen van de emails naar de talenten');
    } finally {
      // Reset state
      setIsSendingEmails(false); // Stop loading
      setShowEmailConfirmation(false);
      setPendingShootData(null);
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
        clientInstagram: '@',
        moodboardLink: '',
        bannerPhoto: null,
        bannerPhotoUrl: '',
        compensationType: 'financiële vergoeding',
        compensationAmount: '',
        compensationBusinessName: ''
      });
      await fetchShoots();
    }
  };

  // Annuleer email verzending
  const handleSkipSendEmails = async () => {
    alert('✅ Shoot toegevoegd! Geen emails verzonden naar models');

    // Reset state
    setShowEmailConfirmation(false);
    setPendingShootData(null);
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
      clientInstagram: '@',
      moodboardLink: '',
      bannerPhoto: null,
      bannerPhotoUrl: '',
      compensationType: 'financiële vergoeding',
      compensationAmount: '',
      compensationBusinessName: ''
    });
    await fetchShoots();
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
        <ClientLogoBanner />

        {/* Account icon direct onder de banner */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', padding: '12px 0 0 0', position: 'relative', zIndex: 100 }}>
          <div ref={menuRef} style={{ position: 'relative', marginRight: 24 }}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              style={{
                background: 'transparent',
                border: 'none',
                width: 44,
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#f8f7f2'
              }}
              aria-label={session ? 'Account opties' : 'Inloggen'}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 2px 8px rgba(44,62,80,0.18))' }}>
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-2.5 3.5-4 8-4s8 1.5 8 4" />
              </svg>
            </button>

            {showMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 8,
                background: '#f8f7f2',
                borderRadius: 12,
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                minWidth: 180,
                overflow: 'hidden',
                padding: '8px 0',
                zIndex: 1000
              }}>
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
                    color: '#050606',
                    transition: 'background 0.2s',
                    fontFamily: 'inherit'
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
        {/* Hoofdcontent */}
        <div style={{ padding: '60px 20px', flex: 1 }}>
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <MiesLogo size={110} />
            </div>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <h1 style={{ fontSize: 32, fontWeight: 700, color: '#050606', margin: 0 }}>Shoots beheren</h1>
              <p style={{ fontSize: 16, color: '#050606', marginTop: 8, marginBottom: 0 }}>
                Maak nieuwe shoots aan en beheer lopende shoots.
              </p>
              <button
                style={{
                  marginTop: 18,
                  padding: '12px 32px',
                  background: '#402e27',
                  color: '#f8f7f2',
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
                onMouseLeave={e => (e.currentTarget.style.background = '#402e27')}
              >
                + Nieuwe shoot aanmaken
              </button>
            </div>


            {/* Formulier voor nieuwe shoot */}
            {showAddForm && (
              <div style={{
                maxWidth: 700,
                margin: '0 auto 40px',
                background: '#f8f7f2',
                borderRadius: 12,
                padding: 32,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                <h2 style={{
                  fontSize: 24,
                  fontWeight: 600,
                  color: '#050606',
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
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#050606', fontWeight: 500 }}>
                      Bannerfoto (optioneel)
                    </label>
                    {/* Preview huidige banner als die er is en er geen nieuwe gekozen is */}
                    {newShoot.bannerPhotoUrl && !newShoot.bannerPhoto && (
                      <div style={{ marginBottom: 8 }}>
                        <img
                          src={newShoot.bannerPhotoUrl}
                          alt="Huidige banner"
                          style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 8, marginBottom: 8, border: '2px solid #E5DDD5' }}
                        />
                        <button
                          type="button"
                          onClick={() => setNewShoot(s => ({ ...s, bannerPhotoUrl: '' }))}
                          style={{
                            padding: '8px 16px',
                            background: '#EF4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 8,
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Verwijder banner
                        </button>
                      </div>
                    )}
                    {/* Preview nieuwe banner als die gekozen is */}
                    {newShoot.bannerPhoto && (
                      <img
                        src={URL.createObjectURL(newShoot.bannerPhoto)}
                        alt="Preview banner"
                        style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }}
                      />
                    )}
                    {/* Toon upload input alleen als er geen bestaande banner is */}
                    {!newShoot.bannerPhotoUrl && (
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setTempBannerImage(event.target?.result as string);
                              setCropPosition({ x: 0, y: 0 });
                              setImageScale(1);
                              setShowCropModal(true);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        style={{ marginBottom: 8 }}
                      />
                    )}
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#050606', fontWeight: 500 }}>
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
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#050606', fontWeight: 500 }}>
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
                        onChange={(e) => {
                          const value = e.target.value;
                          // Zorg ervoor dat @ altijd aan het begin staat
                          if (!value.startsWith('@')) {
                            setNewShoot({ ...newShoot, clientInstagram: '@' + value.replace(/^@*/, '') });
                          } else {
                            setNewShoot({ ...newShoot, clientInstagram: value });
                          }
                        }}
                        onFocus={(e) => {
                          // Als het veld leeg is of alleen spaties bevat, zet @ erin
                          if (!e.target.value || e.target.value.trim() === '') {
                            setNewShoot({ ...newShoot, clientInstagram: '@' });
                          }
                        }}
                        style={{ flex: 1, padding: '12px', background: '#E5DDD5', border: 'none', borderRadius: 8, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' }}
                      />
                    </div>
                    <small style={{ fontSize: 12, color: '#050606', marginTop: 4, display: 'block' }}>
                      Optioneel - Modellen kunnen naar de website of Instagram van de klant gaan
                    </small>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#050606', fontWeight: 500 }}>
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
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#050606', fontWeight: 500 }}>
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
                      <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#050606', fontWeight: 500 }}>
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
                      <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#050606', fontWeight: 500 }}>
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
                      <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#050606', fontWeight: 500 }}>
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
                      <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#050606', fontWeight: 500 }}>
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
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#050606', fontWeight: 500 }}>
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
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#050606', fontWeight: 500 }}>
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
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#050606', fontWeight: 500 }}>
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
                        color: '#050606',
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
                        background: '#402e27',
                        color: '#f8f7f2',
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
                        e.currentTarget.style.background = '#402e27';
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
              margin: '0 auto',
              position: 'relative'
            }}>
              <h2 style={{
                fontSize: 24,
                fontWeight: 600,
                color: '#050606',
                marginBottom: 24
              }}>
                Alle shoots ({shoots.length})
              </h2>

              {useMemo(() => (
                <div className="manage-shoots-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                  gap: 24
                }}>
                  {shoots.map(shoot => {
                    const isExpanded = expandedShoot === shoot.id;
                    const isFocusMode = expandedShoot !== null;

                    return (
                      <div key={shoot.id} style={{
                        background: '#f8f7f2',
                        borderRadius: 12,
                        padding: 0,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0,
                        alignItems: 'start',
                        transition: 'all 0.2s ease',
                        position: 'relative'
                      }}>
                        {shoot.banner_photo_url && (
                          <div
                            style={{
                              width: '100%',
                              height: 200,
                              overflow: 'hidden',
                              cursor: 'pointer',
                              borderTopLeftRadius: 12,
                              borderTopRightRadius: 12
                            }}
                            className="shoot-banner-container"
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
                        <div className="shoot-card-content" style={{
                          padding: 24,
                          textAlign: 'left',
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column'
                        }}>
                          <div style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#050606',
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
                          <h3 className="shoot-title" style={{
                            fontSize: 20,
                            fontWeight: 600,
                            color: '#050606',
                            marginBottom: 12
                          }}>
                            {shoot.title || shoot.description?.split('\n\n')[0]}
                          </h3>
                          <div className="shoot-details" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                            <div style={{
                              fontSize: 14,
                              color: '#050606',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8
                            }}>
                              <span style={{ fontSize: 18, color: '#050606' }}>•</span> {formatDateNL(shoot.shoot_date || shoot.date)}
                            </div>
                            {shoot.start_time && shoot.end_time && (
                              <div style={{
                                fontSize: 14,
                                color: '#050606',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8
                              }}>
                                <span style={{ fontSize: 18, color: '#050606' }}>•</span> {shoot.start_time.substring(0, 5)} - {shoot.end_time.substring(0, 5)}
                              </div>
                            )}
                            <div style={{
                              fontSize: 14,
                              color: '#050606',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8
                            }}>
                              <span style={{ fontSize: 18, color: '#050606' }}>•</span> {shoot.location}
                            </div>
                            <div style={{
                              fontSize: 14,
                              color: '#050606',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8
                            }}>
                              <span style={{ fontSize: 18, color: '#050606' }}>•</span> {shoot.spots} plekken
                            </div>
                            {shoot.compensation_type && (
                              <div style={{
                                fontSize: 14,
                                color: '#050606',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8
                              }}>
                                <span style={{ fontSize: 18, color: '#050606' }}>•</span>
                                {(() => {
                                  if (shoot.compensation_type === 'financiële vergoeding') return `Financiële vergoeding t.w.v. €${shoot.compensation_amount}`;
                                  if (shoot.compensation_type === 'cadeaubon') return `Cadeaubon t.w.v. €${shoot.compensation_amount}${shoot.compensation_business_name ? ` bij ${shoot.compensation_business_name}` : ''}`;
                                  if (shoot.compensation_type === 'geen') return `Geen vergoeding`;
                                  // Fallback voor oude data
                                  if (shoot.compensation_type === 'bedrag') return `€${shoot.compensation_amount}`;
                                  if (shoot.compensation_type === 'eten') return `Eten betaald`;
                                  return shoot.compensation_type;
                                })()}
                              </div>
                            )}
                          </div>
                          <p className="shoot-description" style={{
                            fontSize: 14,
                            color: '#050606',
                            lineHeight: 1.6,
                            marginBottom: 16,
                            flex: 1
                          }}>
                            {shoot.description?.split('\n\n').slice(1).join('\n\n') || shoot.description}
                          </p>

                          <div style={{ borderTop: '1px solid #E5E7EB', margin: '20px 0' }} />

                          {shoot.moodboard_link && (
                            <a
                              href={shoot.moodboard_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-block',
                                fontSize: 13,
                                color: '#050606',
                                textDecoration: 'none',
                                fontWeight: 600,
                                marginBottom: 12
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
                                display: 'inline-block',
                                fontSize: 13,
                                color: '#050606',
                                textDecoration: 'none',
                                fontWeight: 600,
                                marginBottom: 16
                              }}
                            >
                              Bekijk website &#8594;
                            </a>
                          ) : (
                            <div style={{ height: 21, marginBottom: 16 }}></div> /* Spacer to keep alignment */
                          )}

                          {(shoot.client_instagram || shoot.clientInstagram) && (shoot.client_instagram || shoot.clientInstagram) !== '@' && (
                            <a
                              href={`https://instagram.com/${(shoot.client_instagram || shoot.clientInstagram).replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-block',
                                fontSize: 13,
                                color: '#050606',
                                textDecoration: 'none',
                                fontWeight: 600,
                                marginBottom: 16
                              }}
                            >
                              {(shoot.client_instagram || shoot.clientInstagram).startsWith('@')
                                ? (shoot.client_instagram || shoot.clientInstagram)
                                : '@' + (shoot.client_instagram || shoot.clientInstagram)}
                            </a>
                          )}



                          {/* Footer Actions Row */}
                          <div className="shoot-actions" style={{
                            marginTop: 10,
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
                                color: getRegistrationsForShoot(shoot.id).length > 0 ? '#050606' : '#050606',
                                border: 'none',
                                borderRadius: 6,
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                fontFamily: 'inherit'
                              }}
                            >

                              <span>Bekijk aanmeldingen ({getRegistrationsForShoot(shoot.id).length})</span>
                            </button>

                            {/* Right: Edit/Delete Buttons */}
                            <div style={{ display: 'flex', gap: 12 }}>
                              <button
                                onClick={() => handleEditShoot(shoot)}
                                title="Bewerken"
                                style={{
                                  padding: '8px 12px',
                                  background: '#E5DDD5',
                                  color: '#050606',
                                  border: 'none',
                                  borderRadius: 8,
                                  fontSize: 14,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease',
                                  fontFamily: 'inherit',
                                  whiteSpace: 'nowrap',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#D1C7BB';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = '#E5DDD5';
                                }}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                                Bewerken
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
                                  fontSize: 14,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease',
                                  fontFamily: 'inherit',
                                  whiteSpace: 'nowrap',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#FCA5A5';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = '#FEE2E2';
                                }}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6"></polyline>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                  <line x1="10" y1="11" x2="10" y2="17"></line>
                                  <line x1="14" y1="11" x2="14" y2="17"></line>
                                </svg>
                                Verwijderen
                              </button>
                            </div>
                          </div>

                        </div>


                        {/* Registraties lijst logic */}

                        {/* Expandable Registrations List (Full Width Below) */}
                        {expandedShoot === shoot.id && (
                          <div
                            style={{
                              position: 'fixed',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              zIndex: 9999,
                              background: 'rgba(0,0,0,0.5)',
                              backdropFilter: 'blur(4px)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            onClick={() => setExpandedShoot(null)}
                          >
                            <div
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                width: '100%',
                                maxWidth: 1000,
                                maxHeight: '85vh',
                                background: '#f8f7f2',
                                borderRadius: 16,
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',
                                margin: 20
                              }}
                            >
                              {/* Header with Shoot Info */}
                              <div style={{
                                padding: '24px 32px',
                                background: '#F9FAFB',
                                borderBottom: '1px solid #E5E7EB',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start'
                              }}>
                                <div>
                                  <div style={{ marginBottom: 16 }}>
                                    <div style={{
                                      fontSize: 12,
                                      fontWeight: 600,
                                      color: '#050606',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.5px',
                                      marginBottom: 4
                                    }}>
                                      {shoot.client_name || shoot.client}
                                    </div>
                                    <h2 style={{ fontSize: 24, fontWeight: 700, color: '#050606', margin: 0 }}>
                                      {shoot.title || shoot.description?.split('\n\n')[0]}
                                    </h2>
                                  </div>
                                  <div style={{ display: 'flex', gap: 24, fontSize: 14, color: '#050606', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                      {shoot.location}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                      {formatDateNL(shoot.shoot_date || shoot.date)}
                                    </div>
                                  </div>
                                </div>
                                <div style={{ paddingTop: 0 }}>
                                  {getRegistrationsForShoot(shoot.id).some(r => ['selected', 'rejected_draft'].includes(r.status)) && (
                                    <button
                                      onClick={async () => {
                                        if (!window.confirm('Weet je zeker dat je alle concept-wijzigingen wilt doorvoeren? Dit maakt ze zichtbaar voor talenten.')) return;

                                        const drafts = getRegistrationsForShoot(shoot.id).filter(r => ['selected', 'rejected_draft'].includes(r.status));

                                        for (const draft of drafts) {
                                          const newStatus = draft.status === 'selected' ? 'accepted' : 'rejected';
                                          await updateRegistrationStatus(draft.id, newStatus);
                                        }
                                      }}
                                      style={{
                                        padding: '8px 16px',
                                        background: '#402e27',
                                        color: '#f8f7f2',
                                        border: 'none',
                                        borderRadius: 8,
                                        fontSize: 14,
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                      }}
                                    >
                                      Push naar talentaccount ({getRegistrationsForShoot(shoot.id).filter(r => ['selected', 'rejected_draft'].includes(r.status)).length})
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Registrations Board */}
                              <div style={{ padding: '0 32px 32px 32px', overflowY: 'auto', flex: 1, background: '#F3F4F6' }}>
                                {(() => {
                                  const shootRegistrations = getRegistrationsForShoot(shoot.id);

                                  const pending = shootRegistrations.filter(r => !r.status || r.status === 'pending');
                                  const accepted = shootRegistrations.filter(r => ['accepted', 'selected'].includes(r.status));
                                  const rejected = shootRegistrations.filter(r => ['rejected', 'rejected_draft'].includes(r.status));

                                  const Column = ({ title, items, status, color, bgColor }: any) => (
                                    <div style={{ flex: 1, minWidth: 300, display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
                                      <div style={{
                                        position: 'sticky',
                                        top: 0,
                                        padding: '24px 0 16px 0',
                                        background: '#F3F4F6',
                                        zIndex: 10,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                      }}>
                                        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#050606', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                                          {title}
                                        </h3>
                                        <span style={{
                                          background: '#E5E7EB',
                                          color: '#050606',
                                          padding: '2px 8px',
                                          borderRadius: 12,
                                          fontSize: 12,
                                          fontWeight: 600
                                        }}>
                                          {items.length}
                                        </span>
                                      </div>

                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 24, flex: 1 }}>
                                        {items.length === 0 ? (
                                          <div style={{
                                            padding: 24,
                                            textAlign: 'center',
                                            color: '#050606',
                                            background: '#fff',
                                            borderRadius: 12,
                                            border: '1px dashed #E5E7EB',
                                            fontSize: 13
                                          }}>
                                            Geen talenten
                                          </div>
                                        ) : (
                                          items.map((reg: any) => (
                                            <div key={reg.id} style={{
                                              background: '#fff',
                                              borderRadius: 12,
                                              padding: 16,
                                              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                              border: '2px solid #fff',
                                              display: 'flex',
                                              flexDirection: 'column',
                                              gap: 12,
                                              position: 'relative'
                                            }}>
                                              {['selected', 'rejected_draft'].includes(reg.status) && (
                                                <div style={{
                                                  position: 'absolute',
                                                  top: 8,
                                                  right: 8,
                                                  background: '#FEF3C7',
                                                  color: '#D97706',
                                                  fontSize: 10,
                                                  fontWeight: 700,
                                                  padding: '2px 6px',
                                                  borderRadius: 4,
                                                  zIndex: 2
                                                }}>
                                                  CONCEPT
                                                </div>
                                              )}
                                              {['accepted', 'rejected'].includes(reg.status) && (
                                                <div style={{
                                                  position: 'absolute',
                                                  top: 8,
                                                  right: 8,
                                                  background: '#DCFCE7',
                                                  color: '#166534',
                                                  fontSize: 10,
                                                  fontWeight: 700,
                                                  padding: '2px 6px',
                                                  borderRadius: 4,
                                                  zIndex: 2
                                                }}>
                                                  DEFINITIEF
                                                </div>
                                              )}
                                              <div
                                                style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: reg.model_id ? 'pointer' : 'default' }}
                                                onClick={() => reg.model_id && window.open(`/dashboard?model=${reg.model_id}`, '_blank')}
                                              >
                                                <div style={{
                                                  width: 40,
                                                  height: 40,
                                                  borderRadius: '50%',
                                                  overflow: 'hidden',
                                                  background: '#F3F4F6',
                                                  border: '2px solid #f8f7f2',
                                                  flexShrink: 0,
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'center'
                                                }}>
                                                  {reg.models?.photo_url ? (
                                                    <img
                                                      src={
                                                        reg.models.photo_url.startsWith('http')
                                                          ? reg.models.photo_url
                                                          : supabase.storage.from('model-photos').getPublicUrl(reg.models.photo_url).data.publicUrl
                                                      }
                                                      alt={reg.name}
                                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                  ) : (
                                                    <span style={{ fontSize: 10, color: '#050606' }}>Geen foto</span>
                                                  )}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                  <div
                                                    style={{ fontWeight: 600, color: '#050606', fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                                    onMouseEnter={(e) => reg.model_id && (e.currentTarget.style.textDecoration = 'underline')}
                                                    onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                                                  >
                                                    {reg.name}
                                                  </div>
                                                  {reg.model_id && (
                                                    <div style={{ fontSize: 11, color: '#050606' }}>Bekijk profiel</div>
                                                  )}
                                                </div>
                                              </div>

                                              <div style={{
                                                background: reg.message ? '#F9FAFB' : 'transparent',
                                                padding: reg.message ? '4px 10px' : 0,
                                                borderRadius: 8,
                                                fontSize: 12,
                                                color: '#050606',
                                                fontStyle: 'italic',
                                                height: 24,
                                                overflow: 'hidden',
                                                display: 'flex',
                                                alignItems: 'center'
                                              }}>
                                                {reg.message && `"${reg.message}"`}
                                              </div>

                                              <div style={{ display: 'flex', gap: 8, paddingTop: 8, borderTop: '1px solid #F3F4F6' }}>
                                                {status === 'pending' && (
                                                  <>
                                                    <button
                                                      onClick={(e) => { e.stopPropagation(); updateRegistrationStatus(reg.id, 'selected'); }}
                                                      style={{ flex: 1, padding: '6px', background: '#DCFCE7', color: '#166534', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                                                    >
                                                      Selecteren
                                                    </button>
                                                    <button
                                                      onClick={(e) => { e.stopPropagation(); updateRegistrationStatus(reg.id, 'rejected_draft'); }}
                                                      style={{ flex: 1, padding: '6px', background: '#F3F4F6', color: '#050606', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                                                    >
                                                      Niet nu
                                                    </button>
                                                  </>
                                                )}
                                                {status === 'accepted' && (
                                                  <button
                                                    onClick={(e) => { e.stopPropagation(); updateRegistrationStatus(reg.id, 'pending'); }}
                                                    style={{ flex: 1, padding: '6px', background: '#F3F4F6', color: '#050606', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                                                  >
                                                    Terugzetten
                                                  </button>
                                                )}
                                                {status === 'rejected' && (
                                                  <button
                                                    onClick={(e) => { e.stopPropagation(); updateRegistrationStatus(reg.id, 'pending'); }}
                                                    style={{ flex: 1, padding: '6px', background: '#F3F4F6', color: '#050606', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                                                  >
                                                    Terugzetten
                                                  </button>
                                                )}
                                              </div>
                                            </div>
                                          ))
                                        )}
                                      </div>

                                      {/* Action Buttons for Group Email */}
                                      {items.length > 0 && status === 'accepted' && (
                                        <button
                                          onClick={() => {
                                            // Verzamel alle emailadressen van geselecteerde talenten
                                            const emails = items.map((reg: any) => reg.email).filter(Boolean);

                                            // Maak het onderwerp
                                            const subject = `Je bent geselecteerd voor een Unposed shoot!`;

                                            // Maak de body van het bericht met shoot details
                                            const shootDate = formatDateNL(shoot.shoot_date || shoot.date, true);
                                            const startTime = shoot.start_time?.slice(0, 5) || '';
                                            const endTime = shoot.end_time?.slice(0, 5) || '';

                                            // Bereken vergoeding tekst
                                            let compensationText = '';
                                            if (shoot.compensation_type === 'financiële vergoeding' && shoot.compensation_amount) {
                                              compensationText = `Financiële vergoeding t.w.v. €${shoot.compensation_amount}`;
                                            } else if (shoot.compensation_type === 'cadeaubon' && shoot.compensation_amount && shoot.compensation_business_name) {
                                              compensationText = `Cadeaubon t.w.v. €${shoot.compensation_amount} bij ${shoot.compensation_business_name}`;
                                            } else if (shoot.compensation_type === 'geen') {
                                              compensationText = 'Geen vergoeding';
                                            }

                                            const body = `Hi,

Leuk nieuws: je bent geselecteerd voor een Unposed shoot!

We zien je graag terug bij deze shoot en kijken ernaar uit om samen iets moois te maken.

${shootDate}
${startTime}${endTime ? ' - ' + endTime : ''} uur
${shoot.location}
${compensationText}

Voorbereiding & styling
🔴 [Vul hier specifieke instructies in, zoals kledingvoorschriften, stylingtips, moodboardlink, sfeeromschrijving of andere praktische info.] 🔴

Bevestig je deelname door te reageren op deze mail. Kun je er toch niet bij zijn? Laat het ons dan zo snel mogelijk weten

We kijken ernaar uit je binnenkort op set te zien!

—

Team Unposed
W: Unposed.nl
E: hello@unposed.nl`;

                                            // Maak Gmail compose URL met BCC
                                            const composeUrl = `https://mail.google.com/mail/u/hello@unposed.nl/?view=cm&fs=1&bcc=${encodeURIComponent(emails.join(','))}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                                            // Forceer via AccountChooser voor login check
                                            const gmailUrl = `https://accounts.google.com/AccountChooser?Email=hello@unposed.nl&continue=${encodeURIComponent(composeUrl)}`;

                                            // Open Gmail in nieuw tabblad
                                            window.open(gmailUrl, '_blank');
                                          }}
                                          style={{
                                            padding: '12px',
                                            background: '#402e27',
                                            color: '#f8f7f2',
                                            border: 'none',
                                            borderRadius: 8,
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 8,
                                            marginTop: 'auto'
                                          }}
                                        >
                                          Mail versturen ({items.length})
                                        </button>
                                      )}
                                      {items.length > 0 && status === 'rejected' && (
                                        <button
                                          onClick={() => {
                                            // Verzamel alle emailadressen van niet-geselecteerde talenten
                                            const emails = items.map((reg: any) => reg.email).filter(Boolean);

                                            // Maak het onderwerp
                                            const subject = `Update over je aanmelding voor een Unposed shoot.`;

                                            // Maak de body van het bericht
                                            const shootName = shoot.title || shoot.description?.split('\n\n')[0];
                                            const body = `Hi,

Bedankt voor je aanmelding voor de ${shootName} en leuk dat je interesse had om hieraan deel te nemen.

Voor deze shoot hebben we inmiddels een selectie gemaakt, en helaas ben je niet uitgekozen. Bij nieuwe shoots die passen bij jouw profiel laten we altijd weer van ons horen

Dankjewel voor je enthousiasme en wie weet zien we je bij een volgende Unposed shoot!

—

Team Unposed
W: Unposed.nl
E: hello@unposed.nl`;

                                            // Maak Gmail compose URL met BCC
                                            const composeUrl = `https://mail.google.com/mail/u/hello@unposed.nl/?view=cm&fs=1&bcc=${encodeURIComponent(emails.join(','))}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                                            // Forceer via AccountChooser voor login check
                                            const gmailUrl = `https://accounts.google.com/AccountChooser?Email=hello@unposed.nl&continue=${encodeURIComponent(composeUrl)}`;

                                            // Open Gmail in nieuw tabblad
                                            window.open(gmailUrl, '_blank');
                                          }}
                                          style={{
                                            padding: '12px',
                                            background: '#f8f7f2',
                                            color: '#050606',
                                            border: '1px solid #D1D5DB',
                                            borderRadius: 8,
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 8,
                                            marginTop: 'auto'
                                          }}
                                        >
                                          Mail versturen ({items.length})
                                        </button>
                                      )}
                                    </div>
                                  );

                                  return (
                                    <div style={{ display: 'flex', gap: 24, paddingBottom: 40, alignItems: 'stretch', height: '100%' }}>
                                      <Column title="Nieuwe aanmeldingen" items={pending} status="pending" color="#3B82F6" bgColor="#EFF6FF" />
                                      <Column title="Geselecteerd" items={accepted} status="accepted" color="#22C55E" bgColor="#F0FDF4" />
                                      <Column title="Niet geselecteerd" items={rejected} status="rejected" color="#EF4444" bgColor="#F9FAFB" />
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ), [shoots, registrationsByShoot, expandedShoot, previewImage])}

              {/* Fixed Registration Overlay Banner */}


              {
                shoots.length === 0 && (
                  <div style={{
                    textAlign: 'center',
                    padding: 60,
                    color: '#050606'
                  }}>
                    <p style={{ fontSize: 18 }}>Geen shoots gevonden</p>
                    <p style={{ fontSize: 14, marginTop: 8 }}>Klik op "Nieuwe Shoot Toevoegen" om te beginnen</p>
                  </div>
                )
              }
            </div>

            {/* Terug naar dashboard knop */}
            <div style={{ textAlign: 'center', marginTop: 60 }}>
              <button
                onClick={() => window.location.href = '/dashboard'}
                style={{
                  padding: '12px 24px',
                  background: '#f8f7f2',
                  color: '#402e27',
                  border: '2px solid #402e27',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontFamily: 'inherit'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#402e27';
                  e.currentTarget.style.color = '#f8f7f2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f8f7f2';
                  e.currentTarget.style.color = '#402e27';
                }}
              >
                ← Terug naar Dashboard
              </button>
              <style>{`
            @keyframes scroll {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .logo-scroll {
              animation: scroll 240s linear infinite;
              will-change: transform;
            }
            .logo-scroll img {
              width: auto;
              object-fit: contain;
              filter: grayscale(100%);
            }
            .logo-small { height: 25px; }
            .logo-normal { height: 40px; }
            .logo-large { height: 50px; }
            .logo-xlarge { height: 60px; }

            /* Mobile responsiveness for management grid */
            @media (max-width: 768px) {
              .manage-shoots-grid {
                grid-template-columns: 1fr 1fr !important;
                gap: 16px !important;
              }
              .manage-page-logo img {
                height: 80px !important; /* Smaller logo on mobile */
                width: auto !important;
              }
              .shoot-card-content { padding: 12px !important; }
              .shoot-banner-container { height: 110px !important; }
              .shoot-title {
                font-size: 15px !important;
                margin-bottom: 6px !important;
                line-height: 1.2 !important;
              }
              .shoot-details { gap: 4px !important; margin-bottom: 8px !important; }
              .shoot-details > div { font-size: 11px !important; gap: 4px !important; }
              .shoot-details span { font-size: 12px !important; }
              .shoot-description {
                font-size: 11px !important;
                line-height: 1.3 !important;
                margin-bottom: 12px !important;
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
              }
              .shoot-actions {
                flex-direction: column;
                align-items: stretch !important;
                gap: 8px !important;
              }
              .shoot-actions button {
                font-size: 11px !important;
                padding: 6px 10px !important;
                justify-content: center;
              }
              .shoot-actions > div {
                 width: 100%;
                 display: grid;
                 grid-template-columns: 1fr 1fr;
                 gap: 8px !important;
              }
            }
          `}</style>
            </div>
          </div >

          {/* Image Preview Modal */}
          {
            previewImage && (
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
                      background: '#f8f7f2',
                      color: '#050606',
                      border: 'none',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    X
                  </button>
                </div>
              </div>
            )
          }

          {/* Email Confirmation Modal */}
          {
            showEmailConfirmation && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 10000,
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 20
              }}>
                <div style={{
                  background: '#f8f7f2',
                  borderRadius: 16,
                  maxWidth: 500,
                  width: '100%',
                  padding: 32,
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  animation: 'slideIn 0.3s ease'
                }}>
                  <div style={{
                    textAlign: 'center',
                    marginBottom: 24
                  }}>
                    {isSendingEmails ? (
                      <div style={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        background: '#DBEAFE',
                        margin: '0 auto 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          border: '3px solid #402e27',
                          borderTopColor: 'transparent',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }}></div>
                      </div>
                    ) : (
                      <div style={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        background: '#DBEAFE',
                        margin: '0 auto 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#402e27" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                          <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                      </div>
                    )}
                    <h2 style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: '#050606',
                      marginBottom: 12
                    }}>
                      {isSendingEmails ? 'Emails worden verzonden...' : 'Shoot toegevoegd!'}
                    </h2>
                    {isSendingEmails ? (
                      <>
                        <p style={{
                          fontSize: 16,
                          color: '#050606',
                          lineHeight: 1.6,
                          marginBottom: 8
                        }}>
                          Even geduld, de emails worden naar alle talenten verstuurd.
                        </p>
                        <p style={{
                          fontSize: 14,
                          color: '#050606',
                          lineHeight: 1.5
                        }}>
                          Sluit dit venster niet en verwijder de tab niet.
                        </p>
                      </>
                    ) : (
                      <>
                        <p style={{
                          fontSize: 16,
                          color: '#050606',
                          lineHeight: 1.6,
                          marginBottom: 8
                        }}>
                          Wil je een email notificatie versturen naar alle geregistreerde talenten over deze nieuwe shoot?
                        </p>
                        <p style={{
                          fontSize: 14,
                          color: '#050606',
                          lineHeight: 1.5
                        }}>
                          De talenten ontvangen een email met de shoot details en kunnen zich direct aanmelden.
                        </p>
                      </>
                    )}
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: 12,
                    marginTop: 24
                  }}>
                    <button
                      onClick={handleSkipSendEmails}
                      disabled={isSendingEmails}
                      style={{
                        flex: 1,
                        padding: '14px 24px',
                        background: isSendingEmails ? '#F3F4F6' : '#E5DDD5',
                        color: isSendingEmails ? '#9CA3AF' : '#050606',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 16,
                        fontWeight: 600,
                        cursor: isSendingEmails ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        fontFamily: 'inherit',
                        opacity: isSendingEmails ? 0.5 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!isSendingEmails) e.currentTarget.style.background = '#D1C7BB';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSendingEmails) e.currentTarget.style.background = '#E5DDD5';
                      }}
                    >
                      Nee, overslaan
                    </button>
                    <button
                      onClick={handleConfirmSendEmails}
                      disabled={isSendingEmails}
                      style={{
                        flex: 1,
                        padding: '14px 24px',
                        background: isSendingEmails ? '#9CA3AF' : '#402e27',
                        color: '#f8f7f2',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 16,
                        fontWeight: 600,
                        cursor: isSendingEmails ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        fontFamily: 'inherit',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8
                      }}
                      onMouseEnter={(e) => {
                        if (!isSendingEmails) e.currentTarget.style.background = '#1F2B4A';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSendingEmails) e.currentTarget.style.background = '#402e27';
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                      </svg>
                      Ja, verstuur emails
                    </button>
                  </div>
                </div>
              </div>
            )
          }


        </div>
      </div>

      {/* Banner Crop Modal */}
      {showCropModal && tempBannerImage && (
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
            zIndex: 10000,
            padding: 20
          }}
          onClick={() => {
            setShowCropModal(false);
            setTempBannerImage(null);
          }}
        >
          <div
            style={{
              background: '#f8f7f2',
              borderRadius: 12,
              padding: 32,
              maxWidth: 800,
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, marginBottom: 16, color: '#050606' }}>Banner kaderen</h3>
            <p style={{ marginBottom: 16, color: '#050606', fontSize: 14 }}>
              Sleep de afbeelding om te positioneren. De banner wordt automatisch gekaderd naar 16:9 formaat
            </p>

            <div style={{
              position: 'relative',
              width: '100%',
              paddingBottom: '56.25%',
              background: '#E5DDD5',
              borderRadius: 8,
              overflow: 'hidden',
              marginBottom: 24,
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
              onMouseDown={(e) => {
                setIsDragging(true);
                setDragStart({ x: e.clientX - cropPosition.x, y: e.clientY - cropPosition.y });
              }}
              onMouseMove={(e) => {
                if (isDragging) {
                  setCropPosition({
                    x: e.clientX - dragStart.x,
                    y: e.clientY - dragStart.y
                  });
                }
              }}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
            >
              <img
                src={tempBannerImage}
                alt="Crop preview"
                id="cropPreviewImage"
                draggable={false}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: `translate(calc(-50% + ${cropPosition.x}px), calc(-50% + ${cropPosition.y}px)) scale(${imageScale})`,
                  maxWidth: 'none',
                  width: '100%',
                  height: 'auto',
                  userSelect: 'none'
                }}
              />
              {/* 16:9 Grid Overlay */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                border: '3px solid #402e27',
                borderRadius: 8
              }}>
                {/* Rule of thirds grid */}
                <div style={{ position: 'absolute', top: '33.33%', left: 0, right: 0, height: 1, background: 'rgba(64, 46, 39, 0.3)' }} />
                <div style={{ position: 'absolute', top: '66.66%', left: 0, right: 0, height: 1, background: 'rgba(64, 46, 39, 0.3)' }} />
                <div style={{ position: 'absolute', left: '33.33%', top: 0, bottom: 0, width: 1, background: 'rgba(64, 46, 39, 0.3)' }} />
                <div style={{ position: 'absolute', left: '66.66%', top: 0, bottom: 0, width: 1, background: 'rgba(64, 46, 39, 0.3)' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowCropModal(false);
                  setTempBannerImage(null);
                }}
                style={{
                  padding: '12px 24px',
                  background: '#E5DDD5',
                  color: '#050606',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Annuleren
              </button>
              <button
                onClick={() => {
                  // Create canvas to crop the image
                  const img = document.getElementById('cropPreviewImage') as HTMLImageElement;
                  const container = img.parentElement;

                  if (!img || !container) return;

                  // Get container dimensions (16:9 aspect ratio)
                  const containerRect = container.getBoundingClientRect();
                  const containerWidth = containerRect.width;
                  const containerHeight = containerRect.height;

                  // Create a new image to get original dimensions
                  const sourceImg = new Image();
                  sourceImg.onload = () => {
                    // Calculate the scale factor between displayed and original image
                    const displayedWidth = img.offsetWidth;
                    const displayedHeight = img.offsetHeight;
                    const scaleX = sourceImg.width / displayedWidth;
                    const scaleY = sourceImg.height / displayedHeight;

                    // Calculate crop area in original image coordinates
                    // The container center is at (containerWidth/2, containerHeight/2)
                    // The image center is at (containerWidth/2 + cropPosition.x, containerHeight/2 + cropPosition.y)
                    const imgCenterX = containerWidth / 2 + cropPosition.x;
                    const imgCenterY = containerHeight / 2 + cropPosition.y;

                    // Calculate where the container edges intersect with the image
                    const cropLeft = (containerWidth / 2 - imgCenterX) * scaleX;
                    const cropTop = (containerHeight / 2 - imgCenterY) * scaleY;
                    const cropWidth = containerWidth * scaleX;
                    const cropHeight = containerHeight * scaleY;

                    // Calculate which part of the original image is visible in the container
                    const imgOffsetX = (containerWidth - displayedWidth) / 2 + cropPosition.x;
                    const imgOffsetY = (containerHeight - displayedHeight) / 2 + cropPosition.y;
                    const sourceX = Math.max(0, -imgOffsetX * scaleX);
                    const sourceY = Math.max(0, -imgOffsetY * scaleY);
                    const sourceWidth = Math.min(sourceImg.width - sourceX, containerWidth * scaleX);
                    const sourceHeight = Math.min(sourceImg.height - sourceY, containerHeight * scaleY);

                    // Create canvas for cropping
                    const canvas = document.createElement('canvas');
                    canvas.width = 1920; // Standard 16:9 width
                    canvas.height = 1080; // Standard 16:9 height
                    const ctx = canvas.getContext('2d');

                    if (ctx) {
                      // Fill with background color
                      ctx.fillStyle = '#E5DDD5';
                      ctx.fillRect(0, 0, canvas.width, canvas.height);

                      // Draw the cropped portion
                      ctx.drawImage(
                        sourceImg,
                        sourceX,
                        sourceY,
                        sourceWidth,
                        sourceHeight,
                        0,
                        0,
                        canvas.width,
                        canvas.height
                      );

                      // Convert canvas to blob
                      canvas.toBlob((blob) => {
                        if (blob) {
                          const file = new File([blob], 'banner.jpg', { type: 'image/jpeg' });
                          setNewShoot(s => ({ ...s, bannerPhoto: file }));
                          setShowCropModal(false);
                          setTempBannerImage(null);
                        }
                      }, 'image/jpeg', 0.95);
                    }
                  };
                  sourceImg.src = tempBannerImage;
                }}
                style={{
                  padding: '12px 24px',
                  background: '#402e27',
                  color: '#f8f7f2',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Toepassen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ...existing code...
