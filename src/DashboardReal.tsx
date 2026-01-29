import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  extra_photos?: string[] | null;
  contract_pdf: string | null;
  created_at?: string;
};

export default function Dashboard() {
  // Terms document state
  const [activeTerms, setActiveTerms] = useState<{ document_url: string, id: number } | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTermsMenu, setShowTermsMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Fetch active terms document (nu als losse functie)
  const fetchActiveTerms = async () => {
    const { data, error } = await supabase
      .from('terms_and_conditions')
      .select('id, document_url')
      .eq('is_active', true)
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .single();
    console.log('fetchActiveTerms result:', { data, error });
    if (!error && data) {
      setActiveTerms(data);
    } else {
      setActiveTerms(null);
    }
  };

  useEffect(() => {
    fetchActiveTerms();
  }, []); // Only run on mount

  // Voorwaarden upload preview state
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [selectedTermsFile, setSelectedTermsFile] = useState<File | null>(null);
  // Functie om leeftijd te berekenen uit geboortedatum
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
  const [searchParams] = useSearchParams();
  const [models, setModels] = useState<Model[]>([]);
  const [filteredModels, setFilteredModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [minAge, setMinAge] = useState<number>(0);
  const [maxAge, setMaxAge] = useState<number>(100);
  const [showFilters, setShowFilters] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [editFormData, setEditFormData] = useState<Model | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [loggedInEmployees, setLoggedInEmployees] = useState<string[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [imageZoom, setImageZoom] = useState(1);
  const [highlightedModelId, setHighlightedModelId] = useState<string | null>(null);
  const modelRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Notitie systeem state
  const [viewingNotesFor, setViewingNotesFor] = useState<Model | null>(null);
  const [modelNotes, setModelNotes] = useState<any[]>([]);
  const [showAddNoteForm, setShowAddNoteForm] = useState(false);
  const [newNote, setNewNote] = useState({
    note_text: '',
    shoot_name: '',
    compensation_type: '',
    compensation_amount: ''
  });
  const [currentEmployeeName, setCurrentEmployeeName] = useState<string>('Medewerker');

  // Quitclaim modal state
  const [viewingQuitclaimFor, setViewingQuitclaimFor] = useState<Model | null>(null);

  // Foto gallery state
  const [viewingPhotosFor, setViewingPhotosFor] = useState<Model | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [editExtraPhotos, setEditExtraPhotos] = useState<string[]>([]);

  // Terms upload state
  const [showTermsUpload, setShowTermsUpload] = useState(false);


  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);



  useEffect(() => {
    fetchModels();
    fetchEmployees();


    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterModels();
  }, [models, searchTerm, genderFilter, cityFilter, minAge, maxAge]);

  // Check voor model parameter in URL en scroll naar model
  useEffect(() => {
    const modelId = searchParams.get('model');
    if (modelId && models.length > 0) {
      setHighlightedModelId(modelId);

      // Wacht tot de DOM is gerenderd en scroll naar model
      setTimeout(() => {
        const modelElement = modelRefs.current[modelId];
        if (modelElement) {
          modelElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });

          // Verwijder highlight na 5 seconden
          setTimeout(() => {
            setHighlightedModelId(null);
          }, 5000);
        }
      }, 300);
    }
  }, [searchParams, models]);

  const fetchModels = async () => {
    try {
      const { data, error } = await supabase
        .from("models")
        .select("*")
        .order("created_at", { ascending: true }); // Oudste eerst bovenaan

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

      // Zet de eerste medewerker als current employee naam voor notities
      if (employeeNames.length > 0) {
        setCurrentEmployeeName(employeeNames[0]);
      }
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
      filtered = filtered.filter((model) => model.city === cityFilter);
      console.log("After city filter:", filtered.length); // DEBUG
    }

    // Leeftijdsfilter
    filtered = filtered.filter((model) => {
      const age = calculateAge(model.birthdate);
      // Als er geen leeftijd is en de filter is op default (0-100), toon het talent
      if (age === null) return minAge === 0 && maxAge === 100;
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
    navigate('/manage-shoots');
  };

  const handleTermsUpload = async (file: File) => {
    try {
      // Upload to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `terms-${Date.now()}.${fileExt}`;
      const filePath = `terms/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('terms')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('terms')
        .getPublicUrl(filePath);

      // Deactivate old terms
      await supabase
        .from('terms_and_conditions')
        .update({ is_active: false })
        .eq('is_active', true);

      // Insert new terms
      const { error: insertError } = await supabase
        .from('terms_and_conditions')
        .insert([{
          document_url: urlData.publicUrl,
          uploaded_by: currentEmployeeName,
          is_active: true
        }]);

      if (insertError) throw insertError;

      // Na upload direct opnieuw ophalen
      await fetchActiveTerms();

      alert('✅ Voorwaarden succesvol geüpload!');
      setShowTermsUpload(false);
    } catch (error) {
      console.error('Error uploading terms:', error);
      alert('❌ Fout bij uploaden: ' + (error as Error).message);
    }
  };

  // Notitie functies
  const fetchNotesForModel = async (modelId: string) => {
    try {
      const { data, error } = await supabase
        .from('model_notes')
        .select('*')
        .eq('model_id', modelId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setModelNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const handleViewNotes = async (model: Model) => {
    setViewingNotesFor(model);
    await fetchNotesForModel(model.id);
  };

  const handleAddNote = async () => {
    if (!viewingNotesFor || !newNote.note_text.trim()) {
      alert('Vul minimaal een notitie in');
      return;
    }

    try {
      const { error } = await supabase
        .from('model_notes')
        .insert([{
          model_id: viewingNotesFor.id,
          employee_name: currentEmployeeName,
          note_text: newNote.note_text,
          shoot_name: newNote.shoot_name || null,
          compensation_type: newNote.compensation_type || null,
          compensation_amount: newNote.compensation_amount ? parseFloat(newNote.compensation_amount) : null
        }]);

      if (error) throw error;

      // Refresh notes
      await fetchNotesForModel(viewingNotesFor.id);

      // Reset form en sluit het
      setShowAddNoteForm(false);
      setNewNote({
        note_text: '',
        shoot_name: '',
        compensation_type: '',
        compensation_amount: ''
      });

      alert('Notitie toegevoegd!');
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Fout bij toevoegen notitie');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm('Weet je zeker dat je deze notitie wilt verwijderen?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('model_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      // Refresh notes
      if (viewingNotesFor) {
        await fetchNotesForModel(viewingNotesFor.id);
      }

      alert('Notitie verwijderd!');
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Fout bij verwijderen notitie');
    }
  };

  const handleCloseNotes = () => {
    setViewingNotesFor(null);
    setModelNotes([]);
    setShowAddNoteForm(false);
    setNewNote({
      note_text: '',
      shoot_name: '',
      compensation_type: '',
      compensation_amount: ''
    });
  };

  const handleContactModel = (model: Model) => {
    const subject = encodeURIComponent("Opdracht The Unposed Collective");
    const body = encodeURIComponent(
      `Beste ${model.first_name},\n\nWij zouden je graag willen vragen voor een opdracht.\n\nMet vriendelijke groet,\nThe Unposed Collective`
    );
    window.location.href = `mailto:${model.email}?subject=${subject}&body=${body}`;
  };

  const handleEditModel = (model: Model) => {
    setEditingModel(model);
    setEditFormData({ ...model });
    setEditExtraPhotos(model.extra_photos || []);
  };

  const handleCancelEdit = () => {
    setEditingModel(null);
    setEditFormData(null);
  };

  const handleSaveEdit = async () => {
    if (!editFormData || !editingModel) return;

    try {
      const updateData = {
        ...editFormData,
        extra_photos: editExtraPhotos.length > 0 ? editExtraPhotos : null
      };

      const { error } = await supabase
        .from('models')
        .update(updateData)
        .eq('id', editingModel.id);

      if (error) throw error;

      fetchModels();
      setEditingModel(null);
      setEditFormData(null);
      setEditExtraPhotos([]);
      alert('✅ Talent succesvol bijgewerkt!');
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

  const handleExtraPhotoUpload = (e: any) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: any) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setEditExtraPhotos(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleRemoveExtraPhoto = (index: number) => {
    setEditExtraPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteFromModal = async () => {
    if (!editingModel) return;

    const confirmed = window.confirm(
      `Weet je zeker dat je ${editingModel.first_name} ${editingModel.last_name} wil verwijderen?`
    );

    if (confirmed) {
      try {
        const { error } = await supabase.rpc('delete_user_complete', {
          target_user_id: editingModel.id
        });

        if (error) throw error;

        fetchModels();
        setEditingModel(null);
        setEditFormData(null);
        alert('✅ Talent succesvol verwijderd!');
      } catch (error) {
        console.error('Error deleting model:', error);
        alert('❌ Fout bij verwijderen: ' + ((error as Error).message || JSON.stringify(error)));
      }
    }
  };

  const handleDeleteModel = async (model: Model) => {
    const confirmed = window.confirm(
      `Weet je zeker dat je ${model.first_name} ${model.last_name} wil verwijderen?`
    );

    if (confirmed) {
      try {
        const { error } = await supabase.rpc('delete_user_complete', {
          target_user_id: model.id
        });

        if (error) throw error;

        // Refresh the models list
        fetchModels();
        alert('✅ Talent succesvol verwijderd!');
      } catch (error) {
        console.error('Error deleting model:', error);
        alert('❌ Fout bij verwijderen: ' + ((error as Error).message || JSON.stringify(error)));
      }
    }
  };

  // Verwijder voorwaarden document uit storage en database
  const handleDeleteTerms = async () => {
    if (!activeTerms) return;
    setShowTermsModal(false);
    try {
      // Verwijder uit storage
      const url = activeTerms.document_url;
      const pathMatch = url.match(/\/terms\/(.+)$/);
      if (pathMatch && pathMatch[1]) {
        const filePath = `terms/${pathMatch[1]}`;
        await supabase.storage.from('terms').remove([filePath]);
      }
      // Verwijder alle actieve voorwaarden uit database
      await supabase.from('terms_and_conditions').delete().eq('is_active', true);
      setActiveTerms(null);
      alert('✅ Algemene voorwaarden verwijderd!');
      await fetchActiveTerms();
    } catch (err) {
      alert('❌ Fout bij verwijderen van voorwaarden.');
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
      <header style={{ background: 'transparent', padding: '16px 20px' }}>
        <div className="header-container" style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="header-top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <MiesLogo size={70} />

            <div className="header-buttons" style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0, marginLeft: 'auto' }}>

              <button
                onClick={handleManageShoots}
                className="header-btn shoots-btn"
                style={{
                  background: 'transparent',
                  color: '#1F2B4A',
                  border: '2px solid #fff',
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
                  e.currentTarget.style.background = '#fff';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span className="btn-text">Shoots Beheren</span>
              </button>
              <div ref={userMenuRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="header-btn logout-btn"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: 8,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Account"
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 2px 8px rgba(44,62,80,0.18))' }}>
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-2.5 3.5-4 8-4s8 1.5 8 4" />
                  </svg>
                </button>
                {showUserMenu && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: 8,
                    background: '#fff',
                    borderRadius: 8,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    padding: 4,
                    zIndex: 100,
                    whiteSpace: 'nowrap'
                  }}>
                    <button
                      onClick={handleLogout}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 16px',
                        background: 'transparent',
                        border: 'none',
                        color: '#1F2B4A',
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: 'pointer',
                        borderRadius: 4
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      Uitloggen
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* mobile-quote verwijderd, alles via desktop-quote */}
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>


        {/* Terms PDF Modal */}
        {showTermsModal && activeTerms && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
          }} onClick={() => setShowTermsModal(false)}>
            <div style={{ background: '#fff', borderRadius: 12, maxWidth: 700, width: '90vw', maxHeight: '80vh', overflow: 'auto', position: 'relative', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }} onClick={e => e.stopPropagation()}>
              <iframe src={activeTerms.document_url} title="Privacyverklaring" style={{ width: '100%', height: '70vh', border: 'none', borderRadius: 8 }} />
              <div style={{ display: 'flex', gap: 12, marginTop: 16, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowTermsModal(false)}
                  style={{ padding: '10px 24px', background: '#E5DDD5', color: '#1F2B4A', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                >Annuleren</button>
                <button
                  onClick={handleDeleteTerms}
                  style={{ padding: '10px 24px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                >Verwijder privacyverklaring</button>
              </div>
            </div>
          </div>
        )}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 42, margin: 0, fontWeight: 700, color: '#1F2B4A' }}>The Unposed Collective</h1>
        </div>

        <div style={{ background: '#fff', padding: 24, borderRadius: 12, marginBottom: 32, border: '1px solid rgba(0, 0, 0, 0.08)', boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.5)' }}>
          {/* Zoekbalk + Filter toggle knop voor mobiel */}
          <div className="search-row" style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <input
              placeholder="Zoek op naam of email..."
              value={searchTerm}
              onChange={(e: any) => setSearchTerm(e.target.value)}
              style={{ flex: 1, padding: '12px 16px', background: '#E5DDD5', color: '#1F2B4A', border: 'none', borderRadius: 8, fontSize: 15, fontFamily: 'inherit' }}
            />
            <button
              className="filter-toggle-btn"
              onClick={() => setShowFilters(!showFilters)}
              style={{
                padding: '12px 16px',
                background: '#E5DDD5',
                color: '#1F2B4A',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'none',
                alignItems: 'center',
                gap: 6,
                fontFamily: 'inherit'
              }}
            >
              🔍 {(genderFilter !== 'all' || cityFilter !== 'all' || minAge > 0 || maxAge < 100) && <span style={{ background: '#EF4444', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>!</span>}
            </button>
          </div>

          {/* Desktop filters - altijd zichtbaar */}
          <div className="filters-desktop" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 16, alignItems: 'center' }}>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <input
                type="number"
                placeholder="Min"
                min="0"
                max="100"
                value={minAge === 0 ? '' : minAge}
                onChange={(e) => setMinAge(e.target.value === '' ? 0 : parseInt(e.target.value))}
                style={{ padding: '12px 16px', background: '#E5DDD5', border: 'none', borderRadius: 8, fontSize: 15, color: '#1F2B4A', fontFamily: 'inherit' }}
              />
              <input
                type="number"
                placeholder="Max"
                min="0"
                max="100"
                value={maxAge === 100 ? '' : maxAge}
                onChange={(e) => setMaxAge(e.target.value === '' ? 100 : parseInt(e.target.value))}
                style={{ padding: '12px 16px', background: '#E5DDD5', border: 'none', borderRadius: 8, fontSize: 15, color: '#1F2B4A', fontFamily: 'inherit' }}
              />
            </div>

            {/* Reset filter knop */}
            <button
              onClick={() => {
                setGenderFilter('all');
                setCityFilter('all');
                setMinAge(0);
                setMaxAge(100);
                setSearchTerm('');
              }}
              style={{
                padding: '12px 16px',
                background: (genderFilter !== 'all' || cityFilter !== 'all' || minAge > 0 || maxAge < 100 || searchTerm !== '') ? '#EF4444' : '#E5DDD5',
                color: (genderFilter !== 'all' || cityFilter !== 'all' || minAge > 0 || maxAge < 100 || searchTerm !== '') ? '#fff' : '#9CA3AF',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: (genderFilter !== 'all' || cityFilter !== 'all' || minAge > 0 || maxAge < 100 || searchTerm !== '') ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
              disabled={genderFilter === 'all' && cityFilter === 'all' && minAge === 0 && maxAge === 100 && searchTerm === ''}
              onMouseEnter={(e) => {
                if (genderFilter !== 'all' || cityFilter !== 'all' || minAge > 0 || maxAge < 100 || searchTerm !== '') {
                  e.currentTarget.style.background = '#DC2626';
                }
              }}
              onMouseLeave={(e) => {
                if (genderFilter !== 'all' || cityFilter !== 'all' || minAge > 0 || maxAge < 100 || searchTerm !== '') {
                  e.currentTarget.style.background = '#EF4444';
                }
              }}
            >
              Reset
            </button>
          </div>

          {/* Mobiel filters - uitklapbaar */}
          <div className="filters-mobile" style={{ display: 'none' }}>
            {showFilters && (
              <div style={{ marginTop: 12 }}>
                {/* Geslacht en Locatie op één rij */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}
                    style={{ flex: 1, minWidth: 0, padding: '8px 6px', background: '#E5DDD5', color: genderFilter === 'all' ? '#9CA3AF' : '#1F2B4A', border: 'none', borderRadius: 6, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}
                  >
                    <option value="all">Geslacht</option>
                    <option value="man">Man</option>
                    <option value="vrouw">Vrouw</option>
                    <option value="anders">Anders</option>
                  </select>

                  <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}
                    style={{ flex: 1, minWidth: 0, padding: '8px 6px', background: '#E5DDD5', color: cityFilter === 'all' ? '#9CA3AF' : '#1F2B4A', border: 'none', borderRadius: 6, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}
                  >
                    <option value="all">Locatie</option>
                    {Array.from(new Set(models.map(m => m.city))).sort().map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                {/* Leeftijd op één rij - uitgelijnd met bovenstaande velden */}
                <div style={{ display: 'flex', gap: 6 }}>
                  <div style={{ flex: 1, display: 'flex', gap: 4, alignItems: 'center' }}>
                    <input
                      type="number"
                      placeholder="Min leeftijd"
                      min="0"
                      max="100"
                      value={minAge === 0 ? '' : minAge}
                      onChange={(e) => setMinAge(e.target.value === '' ? 0 : parseInt(e.target.value))}
                      style={{ flex: 1, minWidth: 0, padding: '8px 6px', background: '#E5DDD5', border: 'none', borderRadius: 6, fontSize: 12, color: '#1F2B4A', fontFamily: 'inherit' }}
                    />
                  </div>
                  <div style={{ flex: 1, display: 'flex', gap: 4, alignItems: 'center' }}>
                    <input
                      type="number"
                      placeholder="Max leeftijd"
                      min="0"
                      max="100"
                      value={maxAge === 100 ? '' : maxAge}
                      onChange={(e) => setMaxAge(e.target.value === '' ? 100 : parseInt(e.target.value))}
                      style={{ flex: 1, minWidth: 0, padding: '8px 6px', background: '#E5DDD5', border: 'none', borderRadius: 6, fontSize: 12, color: '#1F2B4A', fontFamily: 'inherit' }}
                    />
                    {/* Reset knop alleen als filters actief zijn */}
                    {(genderFilter !== 'all' || cityFilter !== 'all' || minAge > 0 || maxAge < 100) && (
                      <button
                        onClick={() => { setGenderFilter('all'); setCityFilter('all'); setMinAge(0); setMaxAge(100); }}
                        style={{ padding: '8px 10px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Aantal talenten teller - op beige achtergrond */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2B3E72" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span style={{ fontSize: 15, color: '#1F2B4A', fontWeight: 600 }}>
              {filteredModels.length} {filteredModels.length === 1 ? 'talent' : 'talenten'}
            </span>
            {filteredModels.length !== models.length && (
              <span style={{ fontSize: 14, color: '#6B7280', fontWeight: 500 }}>
                van {models.length}
              </span>
            )}
          </div>
        </div>

        <div className="models-grid">
          {filteredModels.map((model) => (
            <div
              key={model.id}
              ref={(el) => { modelRefs.current[model.id] = el; }}
              style={{
                background: '#fff',
                borderRadius: 10,
                overflow: 'hidden',
                border: highlightedModelId === model.id
                  ? '2px solid #2B3E72'
                  : '1px solid rgba(0, 0, 0, 0.08)',
                boxShadow: highlightedModelId === model.id
                  ? 'inset 0 1px 0 0 rgba(255, 255, 255, 0.5), 0 2px 8px rgba(43, 62, 114, 0.15)'
                  : 'inset 0 1px 0 0 rgba(255, 255, 255, 0.5)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                transform: highlightedModelId === model.id ? 'scale(1.02)' : 'scale(1)'
              }}
            >
              {/* Foto bovenaan */}
              <div
                className="model-photo"
                onClick={() => {
                  if (model.photo_url) {
                    setViewingPhotosFor(model);
                    setCurrentPhotoIndex(0);
                  }
                }}
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
                  <>
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
                    {/* Badge voor aantal extra foto's */}
                    {model.extra_photos && model.extra_photos.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        bottom: 10,
                        right: 10,
                        background: 'rgba(0,0,0,0.6)',
                        color: '#fff',
                        padding: '6px 12px',
                        borderRadius: 20,
                        fontSize: 13,
                        fontWeight: 600,
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        zIndex: 2
                      }}>
                        +{model.extra_photos.length}
                      </div>
                    )}
                  </>
                ) : (
                  `${model.first_name.charAt(0)}${model.last_name.charAt(0)}`
                )}

                {/* Naam linksboven in foto */}
                <div className="model-name-overlay" style={{
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
                  <h3 className="model-name-text" style={{ fontSize: 14, fontWeight: 600, margin: 0, color: '#fff', letterSpacing: '0.3px' }}>
                    {model.first_name} {model.last_name}
                  </h3>
                </div>
              </div>

              {/* Info onderaan */}
              <div className="model-info" style={{ flex: 1, padding: 16, position: 'relative' }}>
                {/* Knoppen rechtsboven */}
                <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => handleViewNotes(model)}
                    className="model-action-btn"
                    style={{
                      background: 'rgba(255,255,255,0.9)',
                      border: '1px solid #E5DDD5',
                      borderRadius: 6,
                      padding: '6px 10px',
                      cursor: 'pointer',
                      fontSize: 18,
                      lineHeight: 1,
                      fontFamily: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Notities"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleEditModel(model)}
                    className="model-action-btn"
                    style={{
                      background: 'rgba(255,255,255,0.9)',
                      border: '1px solid #E5DDD5',
                      borderRadius: 6,
                      padding: '6px 10px',
                      cursor: 'pointer',
                      fontSize: 18,
                      lineHeight: 1,
                      fontFamily: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Bewerken"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <p style={{ color: '#6B7280', margin: 0, fontSize: 13, marginBottom: 10 }}>
                    {(() => {
                      if (model.gender === 'man' || model.gender === 'male') return 'Man';
                      if (model.gender === 'vrouw' || model.gender === 'female') return 'Vrouw';
                      if (model.gender === 'anders' || model.gender === 'other') return 'Anders';
                      return model.gender;
                    })()} • {model.birthdate ? `${calculateAge(model.birthdate)} jaar` : 'Leeftijd onbekend'}
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
                      style={{
                        color: '#2B3E72',
                        textDecoration: 'none',
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'color 0.2s, text-decoration 0.2s'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.textDecoration = 'underline';
                        e.currentTarget.style.color = '#2563eb';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.textDecoration = 'none';
                        e.currentTarget.style.color = '#2B3E72';
                      }}
                    >
                      {model.instagram}
                    </a>
                  </div>
                )}

                <div className="model-bottom-btns" style={{ display: 'flex', gap: 8, marginTop: 12 }}>
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
                      <span>Quitclaim</span>
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
                      onClick={() => setViewingQuitclaimFor(model)}
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
                      <span>Bekijk Quitclaim</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredModels.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 12, border: '1px solid rgba(0, 0, 0, 0.08)', boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.5)' }}>
            <p style={{ color: '#6B7280', fontSize: 16 }}>Geen modellen gevonden</p>
          </div>
        )}

        {/* Aangemelde collega's sectie onderaan */}
        <div style={{ background: '#fff', padding: 24, borderRadius: 12, marginTop: 40, border: '1px solid rgba(0, 0, 0, 0.08)', boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.5)', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#1F2B4A' }}>
              Geregistreerde collega's
            </h3>
            <button
              onClick={() => {
                if (activeTerms) {
                  setShowTermsModal(true);
                } else {
                  setShowTermsUpload(true);
                }
              }}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                padding: '6px 12px',
                background: 'transparent',
                color: '#9CA3AF',
                border: '1px solid #E5E7EB',
                borderRadius: 6,
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.2s'
              }}
            >
              Wijzig privacyverklaring
            </button>
          </div>
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
              Talent bewerken
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
                    <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2B3E72" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                        <circle cx="12" cy="13" r="4"></circle>
                      </svg>
                    </div>
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

            {/* Extra Foto's Sectie */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#1F2B4A' }}>
                Extra foto's ({editExtraPhotos.length})
              </label>

              {/* Grid van extra foto's */}
              {editExtraPhotos.length > 0 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 12,
                  marginBottom: 12
                }}>
                  {editExtraPhotos.map((photo, index) => (
                    <div key={index} style={{ position: 'relative' }}>
                      <img
                        src={photo}
                        alt={`Extra foto ${index + 1}`}
                        style={{
                          width: '100%',
                          aspectRatio: '1',
                          objectFit: 'cover',
                          borderRadius: 8
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

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
                  Leeftijd: {editFormData.birthdate ? `${calculateAge(editFormData.birthdate)} jaar • ${formatDateNL(editFormData.birthdate, true)}` : 'Onbekend'}
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
                Talent Verwijderen
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

      {/* Foto Gallery Modal */}
      {viewingPhotosFor && (
        <div
          onClick={() => {
            setViewingPhotosFor(null);
            setCurrentPhotoIndex(0);
            setImageZoom(1);
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: 20
          }}
        >
          {/* Header met naam en sluiten */}
          <div style={{
            position: 'absolute',
            top: 20,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 20px',
            zIndex: 2001
          }}>
            <h3 style={{ margin: 0, color: '#fff', fontSize: 20, fontWeight: 600 }}>
              {viewingPhotosFor.first_name} {viewingPhotosFor.last_name}
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setViewingPhotosFor(null);
                setCurrentPhotoIndex(0);
                setImageZoom(1);
              }}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: '#fff',
                fontSize: 28,
                width: 50,
                height: 50,
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
          </div>

          {/* Main foto display */}
          {(() => {
            const allPhotos = [
              viewingPhotosFor.photo_url,
              ...(viewingPhotosFor.extra_photos || [])
            ].filter(Boolean) as string[];

            return (
              <>
                {/* Navigatie pijlen */}
                {allPhotos.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentPhotoIndex(prev =>
                          prev === 0 ? allPhotos.length - 1 : prev - 1
                        );
                      }}
                      style={{
                        position: 'absolute',
                        left: 20,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(255,255,255,0.2)',
                        border: 'none',
                        color: '#fff',
                        fontSize: 32,
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        cursor: 'pointer',
                        zIndex: 2001,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ‹
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentPhotoIndex(prev =>
                          prev === allPhotos.length - 1 ? 0 : prev + 1
                        );
                      }}
                      style={{
                        position: 'absolute',
                        right: 20,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(255,255,255,0.2)',
                        border: 'none',
                        color: '#fff',
                        fontSize: 32,
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        cursor: 'pointer',
                        zIndex: 2001,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ›
                    </button>
                  </>
                )}

                {/* Huidige foto */}
                <img
                  src={allPhotos[currentPhotoIndex]}
                  alt={`Foto ${currentPhotoIndex + 1}`}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    maxWidth: '85%',
                    maxHeight: '75vh',
                    objectFit: 'contain',
                    borderRadius: 8,
                    transform: `scale(${imageZoom})`,
                    transition: 'transform 0.2s ease'
                  }}
                  onWheel={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const delta = e.deltaY > 0 ? -0.1 : 0.1;
                    setImageZoom(Math.max(0.5, Math.min(3, imageZoom + delta)));
                  }}
                />

                {/* Foto counter */}
                <div style={{
                  position: 'absolute',
                  bottom: 100,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: 20,
                  fontSize: 14,
                  fontWeight: 500
                }}>
                  {currentPhotoIndex + 1} / {allPhotos.length}
                </div>

                {/* Thumbnail strip onderaan */}
                {allPhotos.length > 1 && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: 'absolute',
                      bottom: 20,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      display: 'flex',
                      gap: 8,
                      padding: 8,
                      background: 'rgba(0,0,0,0.6)',
                      borderRadius: 12,
                      maxWidth: '90%',
                      overflowX: 'auto'
                    }}
                  >
                    {allPhotos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`Thumbnail ${index + 1}`}
                        onClick={() => setCurrentPhotoIndex(index)}
                        style={{
                          width: 60,
                          height: 60,
                          objectFit: 'cover',
                          borderRadius: 6,
                          cursor: 'pointer',
                          opacity: currentPhotoIndex === index ? 1 : 0.5,
                          border: currentPhotoIndex === index ? '2px solid #fff' : '2px solid transparent',
                          transition: 'all 0.2s ease'
                        }}
                      />
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      <style>{`
        /* Desktop filters visible by default */
        .filters-desktop {
          display: grid;
        }
        .filters-mobile {
          display: none;
        }
        .filter-toggle-btn {
          display: none !important;
        }
        .search-row {
          margin-bottom: 16px;
        }

        /* Responsive grid voor modellen */
        .models-grid {
          display: grid;
          gap: 20px;
          grid-template-columns: repeat(4, 1fr);
        }

        /* Desktop quote altijd zichtbaar */
        .desktop-quote {
          display: block;
        }

        /* 3 kolommen op kleinere desktop/grote tablet */
        @media (max-width: 1100px) {
          .models-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        /* 2 kolommen op tablets */
        @media (max-width: 850px) {
          .models-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          /* Kleinere quote tekst op tablets */
          .desktop-quote {
            font-size: 10px !important;
            padding: 0 4px !important;
          }
        }



        /* 2 kolommen op mobiel */
        @media (max-width: 640px) {
          .models-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }
          /* Filters: hide desktop, show mobile toggle */
          .filters-desktop {
            display: none !important;
          }
          .filters-mobile {
            display: block !important;
          }
          .filter-toggle-btn {
            display: flex !important;
          }
          .search-row {
            margin-bottom: 0;
          }
          /* Quote: altijd tonen tussen logo en knoppen */
          .desktop-quote {
            display: block !important;
            font-size: 9px !important;
            padding: 0 2px !important;
            max-width: 100vw;
            white-space: normal;
            word-break: break-word;
          }
          /* Header-top flex-wrap zodat alles past */
          .header-top {
            flex-wrap: wrap;
          }
          /* Header buttons smaller */
          .header-btn {
            padding: 6px 10px !important;
            font-size: 12px !important;
          }
          .header-buttons {
            gap: 8px !important;
          }
          .btn-text {
            display: none;
          }
          /* Model cards op mobiel */
          .models-grid > div {
            border-radius: 8px !important;
          }
          /* Foto minder langwerpig - vierkanter */
          .model-photo {
            height: 140px !important;
          }
          /* Model info compacter */
          .model-info {
            padding: 8px !important;
          }
          /* Naam in foto kleiner */
          .model-name-overlay {
            padding: 3px 6px !important;
            top: 6px !important;
            left: 6px !important;
          }
          .model-name-text {
            font-size: 10px !important;
          }
          /* Info tekst kleiner */
          .model-info p {
            font-size: 9px !important;
            margin-bottom: 3px !important;
            line-height: 1.3 !important;
          }
          /* Actie knoppen kleiner */
          .model-action-btn {
            padding: 3px 5px !important;
            font-size: 12px !important;
          }
          /* Contact/Quitclaim knoppen */
          .model-bottom-btns {
            gap: 4px !important;
            margin-top: 6px !important;
            flex-wrap: wrap;
          }
          .model-bottom-btns button,
          .model-bottom-btns label {
            padding: 5px 6px !important;
            font-size: 9px !important;
            flex: 1 1 45% !important;
            min-width: 0 !important;
          }
          /* Main padding kleiner */
          main {
            padding: 16px !important;
          }
          /* Filter box compacter */
          main > div:nth-child(2) {
            padding: 16px !important;
            margin-bottom: 16px !important;
          }
          /* Database titel met marge */
          main > div:first-child {
           
            margin-bottom: 16px !important;
          }
          /* Titel kleiner */
          main h1 {
            font-size: 28px !important;
          }
        }

      `}</style>

      {/* Notities Modal */}
      {viewingNotesFor && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',

          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            maxWidth: 800,
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            {/* Header */}
            <div style={{
              padding: 24,
              borderBottom: '2px solid #E5DDD5',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              background: '#fff',
              zIndex: 10
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 24, color: '#1F2B4A' }}>
                  Notities voor {viewingNotesFor.first_name} {viewingNotesFor.last_name}
                </h2>
              </div>
              <button
                onClick={handleCloseNotes}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 24,
                  cursor: 'pointer',
                  color: '#6B7280',
                  padding: 8
                }}
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: 24 }}>
              {/* Nieuwe notitie knop/formulier */}
              {!showAddNoteForm ? (
                <button
                  onClick={() => setShowAddNoteForm(true)}
                  style={{
                    width: '100%',
                    padding: 16,
                    background: '#2B3E72',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    marginBottom: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#1F2B4A'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#2B3E72'}
                >

                  <span>Nieuwe notitie toevoegen</span>
                </button>
              ) : (
                <div style={{
                  background: '#F9FAFB',
                  borderRadius: 8,
                  padding: 20,
                  marginBottom: 24,
                  border: '2px solid #2B3E72'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ margin: 0, fontSize: 18, color: '#1F2B4A' }}>
                      Nieuwe notitie toevoegen
                    </h3>
                    <button
                      onClick={() => setShowAddNoteForm(false)}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: 20,
                        cursor: 'pointer',
                        color: '#6B7280',
                        padding: 4
                      }}
                      title="Annuleren"
                    >
                      ✕
                    </button>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#1F2B4A', fontWeight: 500 }}>
                      Notitie *
                    </label>
                    <textarea
                      value={newNote.note_text}
                      onChange={(e) => setNewNote({ ...newNote, note_text: e.target.value })}
                      placeholder="Bijv. Shoot voor La Cazuela gedaan op 15 december..."
                      rows={3}
                      style={{
                        width: '100%',
                        padding: 12,
                        background: '#fff',
                        border: '1px solid #E5E7EB',
                        borderRadius: 6,
                        fontSize: 14,
                        fontFamily: 'inherit',
                        resize: 'vertical',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#1F2B4A', fontWeight: 500 }}>
                        Shoot naam (optioneel)
                      </label>
                      <input
                        type="text"
                        value={newNote.shoot_name}
                        onChange={(e) => setNewNote({ ...newNote, shoot_name: e.target.value })}
                        placeholder="La Cazuela Zomercampagne"
                        style={{
                          width: '100%',
                          padding: 12,
                          background: '#fff',
                          border: '1px solid #E5E7EB',
                          borderRadius: 6,
                          fontSize: 14,
                          fontFamily: 'inherit',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#1F2B4A', fontWeight: 500 }}>
                        Soort vergoeding
                      </label>
                      <select
                        value={newNote.compensation_type}
                        onChange={(e) => setNewNote({ ...newNote, compensation_type: e.target.value })}
                        style={{
                          width: '100%',
                          padding: 12,
                          background: '#fff',
                          border: '1px solid #E5E7EB',
                          borderRadius: 6,
                          fontSize: 14,
                          fontFamily: 'inherit',
                          cursor: 'pointer',
                          boxSizing: 'border-box'
                        }}
                      >
                        <option value="">-- Selecteer --</option>
                        <option value="financiële vergoeding">Financiële vergoeding</option>
                        <option value="cadeaubon">Cadeaubon</option>
                        <option value="geen">Geen</option>
                      </select>
                    </div>
                  </div>

                  {(newNote.compensation_type === 'financiële vergoeding' || newNote.compensation_type === 'cadeaubon') && (
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#1F2B4A', fontWeight: 500 }}>
                        Bedrag (€)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newNote.compensation_amount}
                        onChange={(e) => setNewNote({ ...newNote, compensation_amount: e.target.value })}
                        placeholder="150.00"
                        style={{
                          width: '100%',
                          padding: 12,
                          background: '#fff',
                          border: '1px solid #E5E7EB',
                          borderRadius: 6,
                          fontSize: 14,
                          fontFamily: 'inherit',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      onClick={handleAddNote}
                      style={{
                        flex: 1,
                        padding: 12,
                        background: '#2B3E72',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'inherit'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#1F2B4A'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#2B3E72'}
                    >
                      Opslaan
                    </button>
                    <button
                      onClick={() => {
                        setShowAddNoteForm(false);
                        setNewNote({
                          note_text: '',
                          shoot_name: '',
                          compensation_type: '',
                          compensation_amount: ''
                        });
                      }}
                      style={{
                        padding: 12,
                        background: '#E5E7EB',
                        color: '#1F2B4A',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        minWidth: 100
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#D1D5DB'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#E5E7EB'}
                    >
                      Annuleren
                    </button>
                  </div>
                </div>
              )}

              {/* Bestaande notities */}
              <div>
                <h3 style={{ margin: '0 0 16px 0', fontSize: 18, color: '#1F2B4A' }}>
                  Eerder toegevoegde notities ({modelNotes.length})
                </h3>

                {modelNotes.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: 40,
                    color: '#9CA3AF',
                    fontSize: 14
                  }}>
                    Nog geen notities toegevoegd voor dit model
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {modelNotes.map((note) => (
                      <div key={note.id} style={{
                        background: '#fff',
                        border: '1px solid #E5E7EB',
                        borderRadius: 8,
                        padding: 16,
                        position: 'relative'
                      }}>
                        {/* Verwijder knop rechtsboven */}
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          style={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            background: '#FEE2E2',
                            border: 'none',
                            borderRadius: 4,
                            padding: '4px 8px',
                            cursor: 'pointer',
                            fontSize: 12,
                            color: '#DC2626',
                            fontWeight: 600,
                            fontFamily: 'inherit',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#FEE2E2';
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#FEE2E2';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                          title="Notitie verwijderen"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                        </button>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, paddingRight: 40 }}>
                          <div style={{ fontSize: 12, color: '#6B7280' }}>
                            {note.employee_name}
                          </div>
                          <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                            {formatDateNL(note.created_at, true)}
                          </div>
                        </div>

                        {note.shoot_name && (
                          <div style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: '#2B3E72',
                            marginBottom: 8
                          }}>
                            {note.shoot_name}
                          </div>
                        )}

                        <div style={{
                          fontSize: 14,
                          color: '#1F2B4A',
                          lineHeight: 1.6,
                          marginBottom: 8,
                          whiteSpace: 'pre-wrap'
                        }}>
                          {note.note_text}
                        </div>

                        {note.compensation_type && (
                          <div style={{
                            fontSize: 13,
                            color: '#6B7280',
                            padding: '6px 12px',
                            background: '#F3F4F6',
                            borderRadius: 4,
                            display: 'inline-block'
                          }}>
                            {note.compensation_type === 'bedrag' && `€${note.compensation_amount}`}
                            {note.compensation_type === 'eten' && 'Eten betaald'}
                            {note.compensation_type === 'cadeaubon' && `Cadeaubon €${note.compensation_amount}`}
                            {note.compensation_type === 'geen' && 'Geen vergoeding'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quitclaim Modal */}
      {viewingQuitclaimFor && viewingQuitclaimFor.contract_pdf && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            width: '95%',
            maxWidth: 1200,
            height: '95vh',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '2px solid #E5DDD5',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#fff',
              flexShrink: 0
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, color: '#1F2B4A' }}>
                  📄 Quitclaim - {viewingQuitclaimFor.first_name} {viewingQuitclaimFor.last_name}
                </h2>
              </div>
              <button
                onClick={() => setViewingQuitclaimFor(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 28,
                  cursor: 'pointer',
                  color: '#6B7280',
                  padding: '4px 8px'
                }}
              >
                ×
              </button>
            </div>

            {/* PDF/Document Viewer - volledig gevuld */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              background: '#525659',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {viewingQuitclaimFor.contract_pdf.startsWith('data:application/pdf') ? (
                <iframe
                  src={viewingQuitclaimFor.contract_pdf}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none'
                  }}
                  title={`Quitclaim ${viewingQuitclaimFor.first_name} ${viewingQuitclaimFor.last_name}`}
                />
              ) : (
                <img
                  src={viewingQuitclaimFor.contract_pdf}
                  alt={`Quitclaim ${viewingQuitclaimFor.first_name} ${viewingQuitclaimFor.last_name}`}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain'
                  }}
                />
              )}
            </div>

            {/* Footer met knoppen */}
            <div style={{
              padding: '16px 20px',
              borderTop: '2px solid #E5DDD5',
              display: 'flex',
              gap: 12,
              justifyContent: 'flex-end',
              background: '#fff'
            }}>
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = viewingQuitclaimFor.contract_pdf!;
                  link.download = `${viewingQuitclaimFor.first_name}_${viewingQuitclaimFor.last_name}_quitclaim.pdf`;
                  link.click();
                }}
                style={{
                  background: '#1F2B4A',
                  color: '#fff',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontFamily: 'inherit'
                }}
              >
                📥 Download PDF
              </button>
              <button
                onClick={async () => {
                  if (window.confirm(`Weet je zeker dat je de quitclaim van ${viewingQuitclaimFor.first_name} ${viewingQuitclaimFor.last_name} wilt verwijderen?`)) {
                    const { error } = await supabase
                      .from('models')
                      .update({ contract_pdf: null })
                      .eq('id', viewingQuitclaimFor.id);

                    if (error) {
                      console.error('Error deleting quitclaim:', error);
                      alert('❌ Kon quitclaim niet verwijderen.');
                      return;
                    }

                    // Update local state
                    setModels(prevModels =>
                      prevModels.map(m =>
                        m.id === viewingQuitclaimFor.id ? { ...m, contract_pdf: null } : m
                      )
                    );
                    setViewingQuitclaimFor(null);
                    alert('✅ Quitclaim succesvol verwijderd!');
                  }
                }}
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontFamily: 'inherit'
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
      )}

      {/* Terms Upload Modal */}
      {showTermsUpload && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
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
            maxWidth: 500,
            width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ margin: 0, marginBottom: 24, fontSize: 24, fontWeight: 700, color: '#1F2B4A' }}>
              Upload privacyverklaring
            </h2>
            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 20 }}>
              Upload een <span style={{ textDecoration: 'underline', fontWeight: 600 }}>PDF</span> document met de privacyverklaring die modellen moeten accepteren bij registratie.
            </p>

            <div style={{ width: '100%', boxSizing: 'border-box', marginBottom: 20 }}>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.type !== 'application/pdf') {
                      alert('Alleen PDF bestanden zijn toegestaan');
                      return;
                    }
                    const fileURL = URL.createObjectURL(file);
                    setPdfPreviewUrl(fileURL);
                    setSelectedTermsFile(file);
                  }
                }}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '12px',
                  border: '2px dashed #6B7280',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  margin: 0
                }}
              />
            </div>

            {/* PDF preview */}
            {pdfPreviewUrl && (
              <div style={{
                width: '100%',
                boxSizing: 'border-box',
                border: '2px solid #2B3E72',
                borderRadius: 8,
                marginBottom: 20,
                padding: 8,
                background: '#F9FAFB',
                textAlign: 'center',
                maxHeight: 400,
                overflow: 'auto',
              }}>
                <iframe
                  src={pdfPreviewUrl}
                  title="Voorwaarden preview"
                  style={{ width: '100%', height: 350, border: 'none', background: '#fff', boxSizing: 'border-box' }}
                />
                <div style={{ fontSize: 13, color: '#2B3E72', marginTop: 8, fontWeight: 600 }}>
                  Voorbeeld van je PDF
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => {
                  setShowTermsUpload(false);
                  setPdfPreviewUrl(null);
                  setSelectedTermsFile(null);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#E5DDD5',
                  color: '#1F2B4A',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                Annuleren
              </button>
              {selectedTermsFile && (
                <button
                  onClick={() => {
                    handleTermsUpload(selectedTermsFile);
                    setPdfPreviewUrl(null);
                    setSelectedTermsFile(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#2B3E72',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  Uploaden
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
