import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Mail, Instagram } from "lucide-react";
import logo from "@/assets/Head logo.png";

type Model = {
  id: string;
  first_name: string;
  last_name: string;
  gender: string;
  age: number;
  instagram: string;
  email: string;
  phone: string;
  photo_url: string | null;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [models, setModels] = useState<Model[]>([]);
  const [filteredModels, setFilteredModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [ageFilter, setAgeFilter] = useState<string>("all");

  useEffect(() => {
    checkAuth();
    fetchModels();
  }, []);

  useEffect(() => {
    filterModels();
  }, [models, searchTerm, genderFilter, ageFilter]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
    }
  };

  const fetchModels = async () => {
    try {
      const { data, error } = await supabase
        .from("models")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setModels(data || []);
    } catch (error) {
      console.error("Error fetching models:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterModels = () => {
    let filtered = [...models];

    if (searchTerm) {
      filtered = filtered.filter(
        (model) =>
          model.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          model.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          model.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (genderFilter !== "all") {
      filtered = filtered.filter((model) => model.gender === genderFilter);
    }

    if (ageFilter !== "all") {
      const [min, max] = ageFilter.split("-").map(Number);
      filtered = filtered.filter((model) => {
        if (max) {
          return model.age >= min && model.age <= max;
        }
        return model.age >= min;
      });
    }

    setFilteredModels(filtered);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleContactModel = (model: Model) => {
    const subject = encodeURIComponent("Opdracht The Unposed Collective");
    const body = encodeURIComponent(
      `Beste ${model.first_name},\n\nWij zouden je graag willen vragen voor een opdracht.\n\nMet vriendelijke groet,\nThe Unposed Collective`
    );
    window.location.href = `mailto:${model.email}?subject=${subject}&body=${body}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Laden...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <img src={logo} alt="Mies Media" className="h-12" />
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Uitloggen
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">The Unposed Collective</h1>
          <p className="text-muted-foreground">Beheer en zoek modellen</p>
        </div>

        <div className="bg-card p-6 rounded-lg shadow-sm mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Zoek op naam of email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="md:col-span-2"
            />

            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Geslacht" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle geslachten</SelectItem>
                <SelectItem value="man">Man</SelectItem>
                <SelectItem value="vrouw">Vrouw</SelectItem>
                <SelectItem value="anders">Anders</SelectItem>
              </SelectContent>
            </Select>

            <Select value={ageFilter} onValueChange={setAgeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Leeftijd" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle leeftijden</SelectItem>
                <SelectItem value="16-20">16-20</SelectItem>
                <SelectItem value="21-25">21-25</SelectItem>
                <SelectItem value="26-30">26-30</SelectItem>
                <SelectItem value="31-99">31+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {filteredModels.map((model) => (
            <Card key={model.id} className="hover:shadow-lg transition-shadow overflow-hidden">
              {model.photo_url && (
                <div className="w-full" style={{ height: '500px' }}>
                  <img
                    src={model.photo_url}
                    alt={`${model.first_name} ${model.last_name}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  {model.first_name} {model.last_name}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {model.gender} • {model.age} jaar
                </p>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <div>
                  <p className="text-xs font-medium text-foreground">E-mail</p>
                  <p className="text-xs text-muted-foreground">{model.email}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">Telefoon</p>
                  <p className="text-xs text-muted-foreground">{model.phone}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Instagram className="h-3 w-3 text-muted-foreground" />
                  <a
                    href={`https://instagram.com/${model.instagram.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    {model.instagram}
                  </a>
                </div>
                <Button
                  onClick={() => handleContactModel(model)}
                  className="w-full mt-3"
                  variant="default"
                  size="sm"
                >
                  <Mail className="h-3 w-3 mr-2" />
                  Contact opnemen
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredModels.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Geen modellen gevonden</p>
          </div>
        )}
      </main>
    </div>
  );
}
