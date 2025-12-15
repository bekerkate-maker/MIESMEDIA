import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Instagram } from "lucide-react";
import MiesLogo from "@/components/MiesLogo";

type Model = {
  id: string;
  first_name: string;
  last_name: string;
  gender: string;
  age?: number;
  birthdate?: string;
  instagram: string;
  email: string;
  phone: string;
  city: string;
  photo_url: string | null;
  contract_pdf: string | null;
  created_at?: string;
};

export default function Dashboard() {
  // Functie om leeftijd te berekenen uit geboortedatum
  function calculateAge(birthdate?: string): number | null {
    if (!birthdate) return null;
    const today = new Date();
    const dob = new Date(birthdate);
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }
  const navigate = useNavigate();
  const [models, setModels] = useState<Model[]>([]);
  const [filteredModels, setFilteredModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [minAge, setMinAge] = useState<number>(0);
  const [maxAge, setMaxAge] = useState<number>(100);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [editFormData, setEditFormData] = useState<Model | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [loggedInEmployees, setLoggedInEmployees] = useState<string[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [imageZoom, setImageZoom] = useState(1);

  const motivationalQuotes = [
    "Vandaag gaan we knallen. Niet lullen maar vullen… die agenda!",
    "Je bent een topper. Zelfs de Erasmusbrug zou voor je buigen — als 'ie niet van staal was.",
    "Kom op joh, jij kunt dit. Als Rotterdam kan bouwen in een dag, kan jij deze to-do list ook fixen.",
    "Hou op met twijfelen. Je bent net als de Markthal: iedereen kijkt naar je en je ziet er geweldig uit.",
    "Vandaag straal je harder dan de lichten op de Coolsingel. Hup, gaan met die banaan!",
    "Als het niet lukt, doe je gewoon Rotterdams: even mopperen, en dan gáán.",
    "Jij bent de Euromast van het team: altijd boven de rest, zonder opscheppen."
  ];

  useEffect(() => {
    fetchModels();
    fetchEmployees();
    
    // Rotate quotes every 15 seconds
    const quoteInterval = setInterval(() => {
      setQuoteIndex((prevIndex) => (prevIndex + 1) % motivationalQuotes.length);
    }, 15000);
    
    return () => {
      clearInterval(quoteInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterModels();
  }, [models, searchTerm, genderFilter, cityFilter, minAge, maxAge]);

  const fetchModels = async () => {
    try {
      const { data, error } = await supabase
        .from("models")
        .select("*");

      if (error) throw error;
      console.log("Fetched models:", data); // DEBUG
      console.log("Number of models:", data?.length); // DEBUG
      setModels(data || []);
    } catch (error) {
      console.error("Error fetching models:", error);
      alert("Fout bij ophalen modellen: " + JSON.stringify(error));
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("name, email")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Zet de namen van de employees in de state
      const employeeNames = (data || []).map(emp => emp.name || emp.email);
      setLoggedInEmployees(employeeNames);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const filterModels = () => {
    let filtered = [...models];
    console.log("Before filtering:", filtered.length); // DEBUG

    if (searchTerm) {
      filtered = filtered.filter(
        (model) =>
          model.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          model.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          model.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log("After search filter:", filtered.length); // DEBUG
    }

    if (genderFilter !== "all") {
      filtered = filtered.filter((model) => model.gender === genderFilter);
      console.log("After gender filter:", filtered.length); // DEBUG
    }

    if (cityFilter !== "all") {
      filtered = filtered.filter((model) => model.city.toLowerCase() === cityFilter.toLowerCase());
      console.log("After city filter:", filtered.length); // DEBUG
    }

    // Leeftijdsfilter
    filtered = filtered.filter((model) => {
      const age = calculateAge(model.birthdate);
      if (age === null) return false;
      return age >= minAge && age <= maxAge;
    });
    console.log("After age filter:", filtered.length); // DEBUG

    console.log("Final filtered:", filtered.length); // DEBUG
    setFilteredModels(filtered);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleManageShoots = () => {
    window.location.href = '/manage-shoots';
  };

  const handleContactModel = (model: Model) => {
    const subject = encodeURIComponent("Opdracht Mies Media");
    const body = encodeURIComponent(
      `Beste ${model.first_name},\n\nWij zouden je graag willen vragen voor een opdracht.\n\nMet vriendelijke groet,\nMies Media`
    );
    window.location.href = `mailto:${model.email}?subject=${subject}&body=${body}`;
  };

  const handleEditModel = (model: Model) => {
    setEditingModel(model);
    setEditFormData({ ...model });
  };

  const handleCancelEdit = () => {
    setEditingModel(null);
    setEditFormData(null);
  };

  const handleSaveEdit = async () => {
    if (!editFormData || !editingModel) return;

    try {
      const { error } = await supabase
        .from('models')
        .update(editFormData)
        .eq('id', editingModel.id);

      if (error) throw error;

      fetchModels();
      setEditingModel(null);
      setEditFormData(null);
      alert('✅ Model succesvol bijgewerkt!');
    } catch (error) {
      console.error('Error updating model:', error);
      alert('❌ Er is iets fout gegaan bij het bijwerken.');
    }
  };

  const handleFileUpload = (file: File) => {
    if (!editFormData) return;
    
    // Convert file to data URL for preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditFormData({ ...editFormData, photo_url: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: any) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: any) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: any) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileUpload(file);
    } else {
      alert('⚠️ Upload alleen afbeeldingsbestanden (jpg, png, etc.)');
    }
  };

  const handleFileInputChange = (e: any) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileUpload(file);
    } else {
      alert('⚠️ Upload alleen afbeeldingsbestanden (jpg, png, etc.)');
    }
  };

  const handleDeleteFromModal = async () => {
    if (!editingModel) return;
    
    const confirmed = window.confirm(
      `Weet je zeker dat je ${editingModel.first_name} ${editingModel.last_name} wil verwijderen uit de database?`
    );
    
    if (confirmed) {
      try {
        const { error } = await supabase
          .from('models')
          .delete()
          .eq('id', editingModel.id);

        if (error) throw error;

        fetchModels();
        setEditingModel(null);
        setEditFormData(null);
        alert('✅ Model succesvol verwijderd!');
      } catch (error) {
        console.error('Error deleting model:', error);
        alert('❌ Er is iets fout gegaan bij het verwijderen.');
      }
    }
  };

  const handleDeleteModel = async (model: Model) => {
    const confirmed = window.confirm(
      `Weet je zeker dat je ${model.first_name} ${model.last_name} wil verwijderen uit de database?`
    );
    
    if (confirmed) {
      try {
        const { error } = await supabase
          .from('models')
          .delete()
          .eq('id', model.id);

        if (error) throw error;

        // Refresh the models list
        fetchModels();
        alert('✅ Model succesvol verwijderd!');
      } catch (error) {
        console.error('Error deleting model:', error);
        alert('❌ Er is iets fout gegaan bij het verwijderen.');
      }
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Laden...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#E5DDD5', paddingBottom: 40, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{ background: '#fff', padding: '16px 20px', borderBottom: '1px solid #d0c8c0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <MiesLogo size={70} />
            <p style={{ 
              color: '#2B3E72', 
              margin: 0,
              fontSize: 15,
              fontStyle: 'italic',
              fontWeight: 500,
              transition: 'opacity 0.5s ease-in-out',
              maxWidth: 500
            }}>
              {motivationalQuotes[quoteIndex]}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button 
              onClick={handleManageShoots}
              style={{ 
                background: 'transparent',
                color: '#1F2B4A',
                border: '2px solid #E5DDD5',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                padding: '8px 16px',
                borderRadius: 8,
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
              title="Beheer shoots"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#E5DDD5';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              📸 Shoots Beheren
            </button>
            <button 
              onClick={handleLogout}
              style={{ 
                padding: '10px 20px', 
                background: '#E5DDD5', 
                color: '#1F2B4A', 
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
            >
              🚪 Uitloggen
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 42, margin: 0, fontWeight: 700, color: '#1F2B4A' }}>Modellendatabase</h1>
        </div>

        <div style={{ background: '#fff', padding: 24, borderRadius: 12, marginBottom: 32, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr', gap: 20, alignItems: 'center' }}>
            <input
              placeholder="Zoek op naam of email..."
              value={searchTerm}
              onChange={(e: any) => setSearchTerm(e.target.value)}
              style={{ padding: '12px 16px', background: '#E5DDD5', color: '#1F2B4A', border: 'none', borderRadius: 8, fontSize: 15, fontFamily: 'inherit' }}
            />

            <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}
              style={{ padding: '12px 16px', background: '#E5DDD5', color: genderFilter === 'all' ? '#9CA3AF' : '#1F2B4A', border: 'none', borderRadius: 8, fontSize: 15, fontFamily: 'inherit', cursor: 'pointer' }}
            >
              <option value="all">Kies geslacht</option>
              <option value="man">Man</option>
              <option value="vrouw">Vrouw</option>
              <option value="anders">Anders</option>
            </select>

            <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}
              style={{ padding: '12px 16px', background: '#E5DDD5', color: cityFilter === 'all' ? '#9CA3AF' : '#1F2B4A', border: 'none', borderRadius: 8, fontSize: 15, fontFamily: 'inherit', cursor: 'pointer' }}
            >
              <option value="all">Kies locatie</option>
              {Array.from(new Set(models.map(m => m.city))).sort().map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>

            {/* Leeftijd invoervelden */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <input
                type="number"
                placeholder="Min leeftijd"
                min="0"
                max="100"
                value={minAge === 0 ? '' : minAge}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                  setMinAge(value);
                }}
                style={{
                  padding: '12px 16px',
                  background: '#E5DDD5',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 15,
                  color: '#1F2B4A',
                  fontFamily: 'inherit',
                  outline: 'none'
                }}
              />
              <input
                type="number"
                placeholder="Max leeftijd"
                min="0"
                max="100"
                value={maxAge === 100 ? '' : maxAge}
                onChange={(e) => {
                  const value = e.target.value === '' ? 100 : parseInt(e.target.value);
                  setMaxAge(value);
                }}
                style={{
                  padding: '12px 16px',
                  background: '#E5DDD5',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 15,
                  color: '#1F2B4A',
                  fontFamily: 'inherit',
                  outline: 'none'
                }}
              />
            </div>
          </div>
        </div>

        <div className="models-grid">
          {filteredModels.map((model) => (
            <div key={model.id} style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', position: 'relative', display: 'flex', flexDirection: 'column', transition: 'all 0.2s' }}>
              {/* Foto bovenaan */}
              <div 
                onClick={() => model.photo_url && setLightboxImage(model.photo_url)}
                style={{ 
                  width: '100%', 
                  height: 380,
                  background: '#E5DDD5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 48,
                  fontWeight: 700,
                  color: '#2B3E72',
                  overflow: 'hidden',
                  position: 'relative',
                  cursor: model.photo_url ? 'pointer' : 'default'
                }}
              >
                {model.photo_url ? (
                  <img 
                    src={model.photo_url} 
                    alt={`${model.first_name} ${model.last_name}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      transition: 'filter 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.filter = 'blur(3px) brightness(0.8)'}
                    onMouseLeave={(e) => e.currentTarget.style.filter = 'none'}
                  />
                ) : (
                  `${model.first_name.charAt(0)}${model.last_name.charAt(0)}`
                )}
                
                {/* Naam linksboven in foto */}
                <div style={{ 
                  position: 'absolute', 
                  top: 10, 
                  left: 10, 
                  background: 'rgba(0, 0, 0, 0.3)', 
                  padding: '6px 12px',
                  borderRadius: 6,
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  zIndex: 2
                }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: '#fff', letterSpacing: '0.3px' }}>
                    {model.first_name} {model.last_name}
                  </h3>
                </div>
              </div>

              {/* Info onderaan */}
              <div style={{ flex: 1, padding: 16, position: 'relative' }}>
                {/* Edit knop rechtsboven */}
                <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}>
                  <button
                    onClick={() => handleEditModel(model)}
                    style={{
                      background: 'rgba(255,255,255,0.9)',
                      border: '1px solid #E5DDD5',
                      borderRadius: 6,
                      padding: '6px 10px',
                      cursor: 'pointer',
                      fontSize: 18,
                      lineHeight: 1,
                      fontFamily: 'inherit'
                    }}
                    title="Bewerken"
                  >
                    ✏️
                  </button>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <p style={{ color: '#6B7280', margin: 0, fontSize: 13, marginBottom: 10 }}>
                    {model.gender} • {model.birthdate ? `${calculateAge(model.birthdate)} jaar` : 'Leeftijd onbekend'}
                  </p>
                </div>

                <div style={{ marginBottom: 7 }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{model.email}</p>
                </div>

                <div style={{ marginBottom: 7 }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#6B7280' }}>{model.phone}</p>
                </div>

                <div style={{ marginBottom: 7 }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#6B7280' }}>{model.city}</p>
                </div>

                {model.instagram && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
                    <Instagram style={{ height: 13, width: 13, color: '#6B7280' }} />
                    <a 
                      href={`https://instagram.com/${(model.instagram || '').replace("@", "")}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ color: '#2B3E72', textDecoration: 'none', fontSize: 12, fontWeight: 500 }}
                    >
                      {model.instagram}
                    </a>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button 
                    onClick={() => handleContactModel(model)} 
                    style={{ 
                      background: '#2B3E72', 
                      color: '#fff',
                      border: 'none',
                      padding: '10px 12px',
                      borderRadius: 6,
                      fontWeight: 600,
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      fontFamily: 'inherit',
                      flex: 1
                    }}
                  >
                    <Mail style={{ height: 13, width: 13 }} />
                    <span>Contact</span>
                  </button>

                  {!model.contract_pdf ? (
                    <label
                      style={{ 
                        background: '#E5DDD5', 
                        color: '#1F2B4A',
                        border: 'none',
                        padding: '10px 12px',
                        borderRadius: 6,
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 5,
                        fontFamily: 'inherit',
                        flex: 1
                      }}
                    >
                      <span>📄</span>
                      <span>QuitClaim</span>
                      <input
                        type="file"
                        accept=".pdf"
                        style={{ display: 'none' }}
                        onChange={(e: any) => {
                          const file = e.target.files?.[0];
                          if (file && file.type === 'application/pdf') {
                            const reader = new FileReader();
                            reader.onloadend = async () => {
                              const base64 = reader.result as string;
                              const updatedModel = { ...model, contract_pdf: base64 };
                              
                              // Update in database
                              const { error } = await supabase
                                .from('models')
                                .update({ contract_pdf: base64 })
                                .eq('id', model.id);
                              
                              if (error) {
                                console.error('Error updating contract:', error);
                                alert('❌ Kon contract niet opslaan in database.');
                                return;
                              }
                              
                              // Update local state direct
                              setModels(prevModels => 
                                prevModels.map(m => m.id === model.id ? updatedModel : m)
                              );
                              
                              alert('✅ Contract succesvol geüpload!');
                            };
                            reader.readAsDataURL(file);
                          } else {
                            alert('⚠️ Upload alleen PDF bestanden');
                          }
                        }}
                      />
                    </label>
                  ) : (
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = model.contract_pdf!;
                        link.download = `${model.first_name}_${model.last_name}_quitclaim.pdf`;
                        link.click();
                      }}
                      style={{
                        background: '#22c55e',
                        color: '#fff',
                        border: 'none',
                        padding: '10px 12px',
                        borderRadius: 6,
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 5,
                        fontFamily: 'inherit',
                        flex: 1
                      }}
                    >
                      <span>✅</span>
                      <span>Download</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredModels.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <p style={{ color: '#6B7280', fontSize: 16 }}>Geen modellen gevonden</p>
          </div>
        )}

        {/* Aangemelde collega's sectie onderaan */}
        <div style={{ background: '#fff', padding: 24, borderRadius: 12, marginTop: 40, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: 0, marginBottom: 16, fontSize: 18, fontWeight: 600, color: '#1F2B4A' }}>
            Geregistreerde collega's
          </h3>
          {loggedInEmployees.length > 0 ? (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {loggedInEmployees.map((employee, index) => (
                <div 
                  key={index} 
                  style={{ 
                    background: '#E5DDD5', 
                    padding: '10px 18px', 
                    borderRadius: 8,
                    fontSize: 15,
                    color: '#1F2B4A',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10
                  }}
                >
                  <span style={{ 
                    background: '#4ade80', 
                    width: 10, 
                    height: 10, 
                    borderRadius: '50%',
                    display: 'inline-block'
                  }} />
                  {employee}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#6B7280', margin: 0, fontSize: 15 }}>Er zijn nog geen collega's geregistreerd.</p>
          )}
        </div>
      </main>

      {/* Edit Modal */}
      {editingModel && editFormData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: 32,
            maxWidth: 600,
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ margin: 0, marginBottom: 24, fontSize: 28, fontWeight: 700, color: '#1F2B4A' }}>
              Model bewerken
            </h2>

            {/* Foto Upload Area */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#1F2B4A' }}>
                Profielfoto
              </label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                  border: `2px dashed ${isDragging ? '#2B3E72' : '#6B7280'}`,
                  borderRadius: 12,
                  padding: 24,
                  textAlign: 'center',
                  background: isDragging ? '#E5DDD5' : '#f9f9f9',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  position: 'relative'
                }}
                onClick={() => (document as any).getElementById('file-input').click()}
              >
                {editFormData.photo_url ? (
                  <div>
                    <img 
                      src={editFormData.photo_url} 
                      alt="Preview" 
                      style={{ 
                        width: 120, 
                        height: 120, 
                        borderRadius: '50%', 
                        objectFit: 'cover',
                        margin: '0 auto 12px'
                      }} 
                    />
                    <p style={{ margin: 0, fontSize: 14, color: '#6B7280' }}>
                      Klik of sleep een nieuwe foto om te vervangen
                    </p>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
                    <p style={{ margin: 0, fontSize: 15, color: '#1F2B4A', fontWeight: 500 }}>
                      Klik om een foto te uploaden
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>
                      of sleep een foto hierheen
                    </p>
                  </div>
                )}
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#1F2B4A' }}>
                  Voornaam
                </label>
                <input
                  type="text"
                  value={editFormData.first_name}
                  onChange={(e: any) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
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

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#1F2B4A' }}>
                  Achternaam
                </label>
                <input
                  type="text"
                  value={editFormData.last_name}
                  onChange={(e: any) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#1F2B4A' }}>
                  Geslacht
                </label>
                <select
                  value={editFormData.gender}
                  onChange={(e: any) => setEditFormData({ ...editFormData, gender: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#E5DDD5',
                    color: '#1F2B4A',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 15,
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    cursor: 'pointer'
                  }}
                >
                  <option value="man">Man</option>
                  <option value="vrouw">Vrouw</option>
                  <option value="anders">Anders</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#1F2B4A' }}>
                  Geboortedatum
                </label>
                <input
                  type="date"
                  value={editFormData.birthdate || ''}
                  onChange={(e: any) => setEditFormData({ ...editFormData, birthdate: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#E5DDD5',
                    color: '#1F2B4A',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 15,
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
                <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                  Leeftijd: {editFormData.birthdate ? calculateAge(editFormData.birthdate) : 'Onbekend'} jaar
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#1F2B4A' }}>
                Instagram
              </label>
              <input
                type="text"
                value={editFormData.instagram}
                onChange={(e: any) => setEditFormData({ ...editFormData, instagram: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
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

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#1F2B4A' }}>
                E-mail
              </label>
              <input
                type="email"
                value={editFormData.email}
                onChange={(e: any) => setEditFormData({ ...editFormData, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
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

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#1F2B4A' }}>
                Telefoonnummer
              </label>
              <input
                type="tel"
                value={editFormData.phone}
                onChange={(e: any) => setEditFormData({ ...editFormData, phone: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
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

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#1F2B4A' }}>
                Woonplaats
              </label>
              <input
                type="text"
                value={editFormData.city}
                onChange={(e: any) => setEditFormData({ ...editFormData, city: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
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

            <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={handleDeleteFromModal}
                style={{
                  padding: '12px 24px',
                  background: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                Model Verwijderen
              </button>
              
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={handleCancelEdit}
                  style={{
                    padding: '12px 24px',
                    background: '#E5DDD5',
                    color: '#1F2B4A',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  Annuleren
                </button>
                <button
                  onClick={handleSaveEdit}
                  style={{
                    padding: '12px 24px',
                    background: '#2B3E72',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  Opslaan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox voor foto's */}
      {lightboxImage && (
        <div 
          onClick={() => {
            setLightboxImage(null);
            setImageZoom(1);
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: 40,
            cursor: 'zoom-out'
          }}
        >
          <div style={{
            position: 'absolute',
            top: 20,
            right: 20,
            color: '#fff',
            fontSize: 40,
            cursor: 'pointer',
            zIndex: 2001,
            background: 'rgba(0,0,0,0.5)',
            borderRadius: '50%',
            width: 50,
            height: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1
          }}>
            ×
          </div>
          
          <div style={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 12,
            background: 'rgba(0,0,0,0.6)',
            padding: '12px 20px',
            borderRadius: 30,
            zIndex: 2001
          }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setImageZoom(Math.max(0.5, imageZoom - 0.25));
              }}
              style={{
                background: '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 18,
                fontWeight: 600
              }}
            >
              −
            </button>
            <span style={{ color: '#fff', fontSize: 16, alignSelf: 'center', minWidth: 60, textAlign: 'center' }}>
              {Math.round(imageZoom * 100)}%
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setImageZoom(Math.min(3, imageZoom + 0.25));
              }}
              style={{
                background: '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 18,
                fontWeight: 600
              }}
            >
              +
            </button>
          </div>

          <img 
            src={lightboxImage}
            alt="Model foto"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              objectFit: 'contain',
              transform: `scale(${imageZoom})`,
              transition: 'transform 0.2s ease',
              cursor: 'grab'
            }}
            onWheel={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const delta = e.deltaY > 0 ? -0.1 : 0.1;
              setImageZoom(Math.max(0.5, Math.min(3, imageZoom + delta)));
            }}
          />
        </div>
      )}
      
      <style>{`
        /* Responsive grid voor modellen */
        .models-grid {
          display: grid;
          gap: 20px;
          grid-template-columns: repeat(4, 1fr);
        }

        /* 3 kolommen op medium schermen */
        @media (max-width: 1400px) {
          .models-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        /* 2 kolommen op kleinere schermen */
        @media (max-width: 1024px) {
          .models-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        /* 1 kolom op mobiel */
        @media (max-width: 640px) {
          .models-grid {
            grid-template-columns: 1fr;
          }
        }

      `}</style>
    </div>
  );
}
