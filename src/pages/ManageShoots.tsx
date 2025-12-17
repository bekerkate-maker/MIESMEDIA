import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import MiesLogo from '@/components/MiesLogo';
import logoCasu from '@/components/logo_klanten/logo_casu.png';
import logoKoekela from '@/components/logo_klanten/logo-koekela-winkels-denieuwebinnenweg.png';
import logoJordys from '@/components/logo_klanten/JORDYS_LOGO.png';
import logoMorganMees from '@/components/logo_klanten/morganmees_logo.png';
import logoDudok from '@/components/logo_klanten/dudok_logo.png';

export default function ManageShoots() {
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingShoot, setEditingShoot] = useState<number | null>(null);
  const [newShoot, setNewShoot] = useState({
    client: '',
    title: '',
    date: '',
    location: '',
    description: '',
    spots: '',
    clientWebsite: '',
    compensationType: 'bedrag',
    compensationAmount: ''
  });
  const [shoots, setShoots] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [expandedShoot, setExpandedShoot] = useState<number | null>(null);

  // Haal aanmeldingen op uit database
  useEffect(() => {
    fetchRegistrations();
    
    // Refresh elke 30 seconden om nieuwe aanmeldingen te zien
    const interval = setInterval(fetchRegistrations, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from('shoot_registrations')
        .select(`
          *,
          models (
            photo_url,
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fout bij ophalen aanmeldingen:', error);
        return;
      }

      setRegistrations(data || []);
    } catch (err) {
      console.error('Error fetching registrations:', err);
    }
  };

  const getRegistrationsForShoot = (shootId: number) => {
    return registrations.filter(reg => reg.shoot_id === shootId);
  };

  // Haal shoots op uit database
  useEffect(() => {
    fetchShoots();
  }, []);

  const fetchShoots = async () => {
    try {
      const { data, error } = await supabase
        .from('shoots')
        .select('*')
        .order('shoot_date', { ascending: true });

      if (error) throw error;
      setShoots(data || []);
    } catch (error) {
      console.error('Error fetching shoots:', error);
      alert('Fout bij ophalen van shoots: ' + (error as Error).message);
    }
  };

  const handleAddShoot = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const shootData = {
        client_name: newShoot.client,
        description: newShoot.title + '\n\n' + newShoot.description,
        shoot_date: newShoot.date,
        location: newShoot.location,
        client_website: newShoot.clientWebsite,
        compensation_type: newShoot.compensationType,
        compensation_amount: newShoot.compensationType === 'bedrag' || newShoot.compensationType === 'cadeaubon' 
          ? parseFloat(newShoot.compensationAmount) || null
          : null,
        status: 'open'
      };

      if (editingShoot !== null) {
        // Update bestaande shoot
        const { error } = await supabase
          .from('shoots')
          .update(shootData)
          .eq('id', editingShoot);

        if (error) throw error;
        alert('✅ Shoot bijgewerkt!');
        setEditingShoot(null);
      } else {
        // Nieuwe shoot toevoegen
        const { error } = await supabase
          .from('shoots')
          .insert([shootData]);

        if (error) throw error;
        alert('✅ Nieuwe shoot toegevoegd!');
      }

      // Refresh shoots lijst
      await fetchShoots();
      
      // Reset form
      setNewShoot({
        client: '',
        title: '',
        date: '',
        location: '',
        description: '',
        spots: '',
        clientWebsite: '',
        compensationType: 'bedrag',
        compensationAmount: ''
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error saving shoot:', error);
      alert('Fout bij opslaan: ' + (error as Error).message);
    }
  };

  const handleEditShoot = (shoot: any) => {
    setEditingShoot(shoot.id);
    setNewShoot({
      client: shoot.client_name || shoot.client || '',
      title: shoot.description?.split('\n\n')[0] || shoot.title || '',
      date: shoot.shoot_date || shoot.date || '',
      location: shoot.location || '',
      description: shoot.description?.split('\n\n').slice(1).join('\n\n') || '',
      spots: shoot.spots?.toString() || '',
      clientWebsite: shoot.client_website || shoot.clientWebsite || '',
      compensationType: shoot.compensation_type || 'bedrag',
      compensationAmount: shoot.compensation_amount?.toString() || ''
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
      location: '',
      description: '',
      spots: '',
      clientWebsite: '',
      compensationType: 'bedrag',
      compensationAmount: ''
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
    <div style={{ 
      minHeight: '100vh', 
      background: '#E5DDD5',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      
      {/* Banner bovenaan met scrollende logos */}
      <div style={{ 
        background: '#fff',
        padding: '12px 0',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        minHeight: '60px'
      }}>
        {/* Scrollende logos - volledige breedte */}
        <div style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center'
        }}>
          <div className="logo-scroll" style={{
            display: 'flex',
            gap: 60,
            alignItems: 'center',
            paddingRight: '60px'
          }}>
            {/* Eerste set logos */}
            <img src={logoCasu} alt="La Cazuela" className="logo-normal" />
            <img src={logoKoekela} alt="Koekela" className="logo-small" />
            <img src={logoJordys} alt="Jordys" className="logo-normal" />
            <img src={logoMorganMees} alt="Morgan & Mees" className="logo-normal" />
            <img src={logoDudok} alt="Dudok" className="logo-xlarge" />
            
            {/* Duplicaat voor seamless loop */}
            <img src={logoCasu} alt="La Cazuela" className="logo-normal" />
            <img src={logoKoekela} alt="Koekela" className="logo-small" />
            <img src={logoJordys} alt="Jordys" className="logo-normal" />
            <img src={logoMorganMees} alt="Morgan & Mees" className="logo-normal" />
            <img src={logoDudok} alt="Dudok" className="logo-xlarge" />

            {/* Extra duplicaat voor grotere schermen */}
            <img src={logoCasu} alt="La Cazuela" className="logo-normal" />
            <img src={logoKoekela} alt="Koekela" className="logo-small" />
            <img src={logoJordys} alt="Jordys" className="logo-normal" />
            <img src={logoMorganMees} alt="Morgan & Mees" className="logo-normal" />
            <img src={logoDudok} alt="Dudok" className="logo-xlarge" />
          </div>
        </div>
      </div>

      {/* Hoofdcontent */}
      <div style={{ padding: '60px 20px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <MiesLogo size={110} />
          </div>
          <h1 style={{ 
            fontSize: 32, 
            fontWeight: 700, 
            color: '#1F2B4A', 
            marginBottom: 12 
          }}>
            Shoots Beheren
          </h1>
          <p style={{ 
            fontSize: 16, 
            color: '#6B7280', 
            maxWidth: 600, 
            margin: '0 auto 24px' 
          }}>
            Voeg nieuwe shoots toe en beheer bestaande opdrachten
          </p>
          
          {/* Nieuwe shoot toevoegen knop */}
          <button
            onClick={() => {
              if (showAddForm && !editingShoot) {
                setShowAddForm(false);
              } else if (showAddForm && editingShoot) {
                handleCancelEdit();
              } else {
                setShowAddForm(true);
              }
            }}
            style={{
              padding: '12px 24px',
              background: '#2B3E72',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
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
            {showAddForm ? '❌ Annuleren' : '➕ Nieuwe Shoot Toevoegen'}
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
              {editingShoot ? 'Shoot Bewerken' : 'Nieuwe Shoot'}
            </h2>
            <form onSubmit={handleAddShoot}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#1F2B4A', fontWeight: 500 }}>
                  Klant *
                </label>
                <input
                  required
                  type="text"
                  placeholder="Bijv. La Cazuela"
                  value={newShoot.client}
                  onChange={(e) => setNewShoot({...newShoot, client: e.target.value})}
                  style={{ width: '100%', padding: '12px', background: '#E5DDD5', border: 'none', borderRadius: 8, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#1F2B4A', fontWeight: 500 }}>
                  Website Klant
                </label>
                <input
                  type="url"
                  placeholder="https://lacazuela.nl"
                  value={newShoot.clientWebsite}
                  onChange={(e) => setNewShoot({...newShoot, clientWebsite: e.target.value})}
                  style={{ width: '100%', padding: '12px', background: '#E5DDD5', border: 'none', borderRadius: 8, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
                <small style={{ fontSize: 12, color: '#6B7280', marginTop: 4, display: 'block' }}>
                  Optioneel - Modellen kunnen naar de website van de klant gaan
                </small>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#1F2B4A', fontWeight: 500 }}>
                  Titel *
                </label>
                <input
                  required
                  type="text"
                  placeholder="Bijv. Zomer Campagne Fotoshoot"
                  value={newShoot.title}
                  onChange={(e) => setNewShoot({...newShoot, title: e.target.value})}
                  style={{ width: '100%', padding: '12px', background: '#E5DDD5', border: 'none', borderRadius: 8, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#1F2B4A', fontWeight: 500 }}>
                    Datum *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="15 december 2025"
                    value={newShoot.date}
                    onChange={(e) => setNewShoot({...newShoot, date: e.target.value})}
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
                    onChange={(e) => setNewShoot({...newShoot, spots: e.target.value})}
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
                  placeholder="Rotterdam Centrum"
                  value={newShoot.location}
                  onChange={(e) => setNewShoot({...newShoot, location: e.target.value})}
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
                  onChange={(e) => setNewShoot({...newShoot, description: e.target.value})}
                  rows={4}
                  style={{ width: '100%', padding: '12px', background: '#E5DDD5', border: 'none', borderRadius: 8, fontSize: 15, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#1F2B4A', fontWeight: 500 }}>
                  Soort Vergoeding *
                </label>
                <select
                  required
                  value={newShoot.compensationType}
                  onChange={(e) => setNewShoot({...newShoot, compensationType: e.target.value, compensationAmount: e.target.value === 'eten' || e.target.value === 'geen' ? '' : newShoot.compensationAmount})}
                  style={{ width: '100%', padding: '12px', background: '#E5DDD5', border: 'none', borderRadius: 8, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box', cursor: 'pointer' }}
                >
                  <option value="bedrag">💰 Bedrag</option>
                  <option value="eten">🍽️ Eten wordt betaald</option>
                  <option value="cadeaubon">🎁 Cadeaubon</option>
                  <option value="geen">❌ Geen vergoeding</option>
                </select>
              </div>

              {(newShoot.compensationType === 'bedrag' || newShoot.compensationType === 'cadeaubon') && (
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#1F2B4A', fontWeight: 500 }}>
                    Bedrag (€) *
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Bijv. 150.00"
                    value={newShoot.compensationAmount}
                    onChange={(e) => setNewShoot({...newShoot, compensationAmount: e.target.value})}
                    style={{ width: '100%', padding: '12px', background: '#E5DDD5', border: 'none', borderRadius: 8, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>
              )}

              <button
                type="submit"
                style={{
                  width: '100%',
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
                {editingShoot ? 'Shoot Bijwerken' : 'Shoot Toevoegen'}
              </button>
            </form>
          </div>
        )}

        {/* Shoots Lijst */}
        <div style={{ 
          maxWidth: 1200, 
          margin: '0 auto'
        }}>
          <h2 style={{ 
            fontSize: 24, 
            fontWeight: 600, 
            color: '#1F2B4A',
            marginBottom: 24,
            textAlign: 'center'
          }}>
            Alle Shoots ({shoots.length})
          </h2>

          <div style={{
            display: 'grid',
            gap: 20
          }}>
            {shoots.map(shoot => (
              <div key={shoot.id} style={{
                background: '#fff',
                borderRadius: 12,
                padding: 24,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: 24,
                alignItems: 'start'
              }}>
                <div>
                  <div style={{ 
                    fontSize: 12, 
                    fontWeight: 600, 
                    color: '#2B3E72',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: 8
                  }}>
                    {shoot.client_name || shoot.client}
                  </div>
                  <h3 style={{ 
                    fontSize: 20, 
                    fontWeight: 600, 
                    color: '#1F2B4A',
                    marginBottom: 12
                  }}>
                    {shoot.description?.split('\n\n')[0] || shoot.title}
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 12 }}>
                    <div style={{ 
                      fontSize: 14, 
                      color: '#6B7280',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}>
                      <span>📅</span> {shoot.shoot_date || shoot.date}
                    </div>
                    <div style={{ 
                      fontSize: 14, 
                      color: '#6B7280',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}>
                      <span>📍</span> {shoot.location}
                    </div>
                    <div style={{ 
                      fontSize: 14, 
                      color: '#6B7280',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}>
                      <span>👥</span> {shoot.spots} plekken
                    </div>
                    <div style={{ 
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#10B981',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}>
                      <span>✓</span> {shoot.status}
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
                        {shoot.compensation_type === 'bedrag' && `💰 €${shoot.compensation_amount}`}
                        {shoot.compensation_type === 'eten' && '🍽️ Eten betaald'}
                        {shoot.compensation_type === 'cadeaubon' && `🎁 Cadeaubon €${shoot.compensation_amount}`}
                        {shoot.compensation_type === 'geen' && '❌ Geen vergoeding'}
                      </div>
                    )}
                  </div>
                  <p style={{ 
                    fontSize: 14, 
                    color: '#4B5563',
                    lineHeight: 1.6,
                    marginBottom: 8
                  }}>
                    {shoot.description?.split('\n\n').slice(1).join('\n\n') || shoot.description}
                  </p>
                  {(shoot.client_website || shoot.clientWebsite) && (
                    <a
                      href={shoot.client_website || shoot.clientWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        fontSize: 13,
                        color: '#2B3E72',
                        textDecoration: 'none',
                        fontWeight: 500
                      }}
                    >
                      🌐 {shoot.clientWebsite}
                    </a>
                  )}

                  {/* Aanmeldingen sectie */}
                  {(() => {
                    const shootRegistrations = getRegistrationsForShoot(shoot.id);
                    const isExpanded = expandedShoot === shoot.id;
                    
                    return (
                      <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #E5E7EB' }}>
                        <button
                          onClick={() => setExpandedShoot(isExpanded ? null : shoot.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '8px 12px',
                            background: shootRegistrations.length > 0 ? '#DBEAFE' : '#F3F4F6',
                            color: shootRegistrations.length > 0 ? '#1E40AF' : '#6B7280',
                            border: 'none',
                            borderRadius: 6,
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            fontFamily: 'inherit'
                          }}
                        >
                          <span>{isExpanded ? '▼' : '▶'}</span>
                          <span>Aanmeldingen ({shootRegistrations.length})</span>
                        </button>

                        {isExpanded && shootRegistrations.length > 0 && (
                          <div style={{ marginTop: 12 }}>
                            {shootRegistrations.map((reg) => (
                              <div key={reg.id} style={{
                                background: '#F9FAFB',
                                borderRadius: 8,
                                padding: 16,
                                marginBottom: 12,
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
                                  marginTop: 8, 
                                  fontSize: 11, 
                                  color: '#9CA3AF' 
                                }}>
                                  Aangemeld op: {new Date(reg.created_at).toLocaleDateString('nl-NL', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {isExpanded && shootRegistrations.length === 0 && (
                          <div style={{
                            marginTop: 12,
                            padding: 16,
                            textAlign: 'center',
                            color: '#9CA3AF',
                            fontSize: 13
                          }}>
                            Nog geen aanmeldingen voor deze shoot
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button
                    onClick={() => handleEditShoot(shoot)}
                    style={{
                      padding: '8px 16px',
                      background: '#E5DDD5',
                      color: '#1F2B4A',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 13,
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
                    ✏️ Bewerken
                  </button>
                  <button
                    onClick={() => handleDeleteShoot(shoot.id)}
                    style={{
                      padding: '8px 16px',
                      background: '#FEE2E2',
                      color: '#DC2626',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      fontFamily: 'inherit',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#FEE2E2';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#FEE2E2';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    🗑️ Verwijderen
                  </button>
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
        </div>
      </div>

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
  );
}
