import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TableTournament from '../../components/Tables/TableTournament';
import TableCompetitors from '../../components/Tables/TableCompetitors';
import { db } from '../../common/db';
import { FaTrophy, FaLayerGroup, FaUsers, FaArrowRight, FaArrowLeft, FaCheck } from 'react-icons/fa';
type TournamentData = {
  name: string;
  description: string;
  location: string;
  status: string;
};

type CategoryData = {
  category: string;
  rounds: string;
  mode: string;
  avg_mode: string;
};

type CompetitorData = {
  name: string;
  categories: string[];
};

export default function TournamentCreation() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [tournamentData, setTournamentData] = useState<TournamentData>({
    name: '',
    description: '',
    location: 'Tlaxcala, México',
    status: 'activo'
  });
  const [categories, setCategories] = useState<CategoryData[]>([
    {
      category: "3x3",
      rounds: "Final directa",
      mode: "WCA",
      avg_mode: "ao5",
    }
  ]);
  const [competitors, setCompetitors] = useState<CompetitorData[]>([
    { name: '', categories: ["3x3"] }
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTournamentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddCategory = (newCategory: CategoryData) => {
    setCategories(prev => [...prev, newCategory]);
  };

  const handleUpdateCategory = (index: number, field: keyof CategoryData, value: string) => {
    const updatedCategories = [...categories];
    updatedCategories[index][field] = value;
    setCategories(updatedCategories);
  };

  const handleRemoveCategory = (index: number) => {
    if (categories.length > 1) {
      setCategories(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleAddCompetitor = () => {
    setCompetitors(prev => [...prev, { name: '', categories: ["3x3"] }]);
  };

  const handleUpdateCompetitor = (index: number, field: keyof CompetitorData, value: any) => {
    const updatedCompetitors = [...competitors];
    updatedCompetitors[index] = { ...updatedCompetitors[index], [field]: value };
    setCompetitors(updatedCompetitors);
  };

  const handleRemoveCompetitor = (index: number) => {
    if (competitors.length > 1) {
      setCompetitors(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleFinalize = async () => {
    // Generar ID del torneo
    const tournamentId = Date.now().toString();

    // Construir categorías
    const builtCategories = categories.map((cat, index) => {
      // Parsear cantidad de rondas
      let numRounds = 1;
      const roundsMatch = cat.rounds.match(/\d+/);
      if (roundsMatch) {
        numRounds = parseInt(roundsMatch[0], 10);
      } else if (cat.rounds.includes("Ronda única") || cat.rounds.includes("Final directa")) {
        numRounds = 1;
      }

      // Crear esqueleto de rondas
      const roundsArr = Array.from({ length: numRounds }).map((_, i) => ({
        num: i + 1,
        format: cat.avg_mode,
        results: [],
        competitorsToAdvance: 0,
        isFinal: i === numRounds - 1
      }));

      return {
        id: Date.now().toString() + index, // IDs únicos
        name: cat.category,
        format: cat.mode.toLowerCase(),
        rounds: roundsArr
      };
    });

    // Construir competidores
    const builtCompetitors = competitors
      .filter(comp => comp.name.trim() !== '')
      .map((comp, index) => {
        const foundCategoryIds = comp.categories.map(catName => 
          builtCategories.find(c => c.name === catName)?.id
        ).filter(Boolean); // mantener solo los truthy
        
        return {
          id: Date.now().toString() + "c" + index,
          name: comp.name,
          categories: foundCategoryIds as string[]
        };
      });

    // Crear el objeto torneo final
    const tournament = {
      ...tournamentData,
      id: tournamentId,
      date: new Date().toISOString().split('T')[0],
      categories: builtCategories,
      competitors: builtCompetitors
    };
    
    // Agregar el torneo directamente a IndexedDB con Dexie
    await db.tournaments.add(tournament);

    // Redirigir al dashboard
    navigate('/dashboard');
  };

  const steps = [
    { id: 1, title: 'Información', icon: <FaTrophy /> },
    { id: 2, title: 'Categorías', icon: <FaLayerGroup /> },
    { id: 3, title: 'Competidores', icon: <FaUsers /> },
  ];

  return (
    <div className="min-h-screen text-white p-4 md:p-6 lg:p-8 mx-auto max-w-6xl">
      {/* Header & Stepper */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6 flex items-center gap-3">
          <FaTrophy className="text-blue-500" />
          Crear Nuevo Torneo
        </h1>
        
        <div className="flex items-center justify-between relative max-w-3xl mx-auto">
          <div className="absolute left-0 top-1/2 -z-10 h-1 w-full -translate-y-1/2 rounded bg-gray-700"></div>
          <div 
            className="absolute left-0 top-1/2 -z-10 h-1 -translate-y-1/2 rounded bg-blue-500 transition-all duration-300"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          ></div>
          
          {steps.map(step => (
            <div key={step.id} className="flex flex-col items-center gap-2">
              <div 
                className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full text-lg sm:text-xl font-bold transition-colors ${
                  currentStep >= step.id 
                    ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]' 
                    : 'bg-gray-800 text-gray-500 border-2 border-gray-700'
                }`}
              >
                {step.icon}
              </div>
              <span className={`text-xs sm:text-sm font-medium ${currentStep >= step.id ? 'text-white' : 'text-gray-500'}`}>
                {step.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6 sm:p-8">
        {currentStep === 1 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 text-gray-200 border-b border-gray-700 pb-4">Información Básica</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-400">Nombre del Torneo *</label>
                  <input
                    name="name"
                    type="text"
                    value={tournamentData.name}
                    onChange={handleInputChange}
                    placeholder="Ej. Tlaxcala Open 2026"
                    className="w-full rounded-lg border border-gray-600 bg-gray-900 p-3 text-white outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-400">Ubicación</label>
                  <input
                    name="location"
                    type="text"
                    value={tournamentData.location}
                    onChange={handleInputChange}
                    placeholder="Ej. Centro de Convenciones"
                    className="w-full rounded-lg border border-gray-600 bg-gray-900 p-3 text-white outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-400">Descripción del Torneo</label>
                <textarea
                  name="description"
                  rows={5}
                  value={tournamentData.description}
                  onChange={handleInputChange}
                  placeholder="Detalles, horarios, reglas especiales..."
                  className="w-full h-full rounded-lg border border-gray-600 bg-gray-900 p-3 text-white outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                ></textarea>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-2 text-gray-200">Categorías y Eventos</h2>
            <p className="text-gray-400 mb-6 border-b border-gray-700 pb-4">Añade los eventos oficiales que formarán parte de tu torneo</p>
            
            <div className="w-full overflow-hidden rounded-lg">
              <TableTournament 
                tournamentData={categories}
                onAddRow={() => {
                  const options = ["3x3", "4x4", "3x3 OH", "2x2", "Pyraminx", "Megaminx", "Skewb", "Square-1"];
                  const used = categories.map(c => c.category);
                  const nextAvail = options.find(opt => !used.includes(opt)) || options[0];
                  handleAddCategory({ category: nextAvail, rounds: "Final directa", mode: "WCA", avg_mode: "ao5" });
                }}
                onChange={handleUpdateCategory}
                onRemove={handleRemoveCategory}
              />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-2 text-gray-200">Competidores</h2>
            <p className="text-gray-400 mb-6 border-b border-gray-700 pb-4">Registra a los participantes y asígnales sus categorías</p>
            
            <div className="w-full overflow-hidden rounded-lg">
              <TableCompetitors 
                competitors={competitors}
                categories={categories.map(c => c.category)}
                onAddRow={handleAddCompetitor}
                onChange={handleUpdateCompetitor}
                onRemove={handleRemoveCompetitor}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          {currentStep === 1 ? (
             <Link to="/dashboard" className="inline-block">
               <button className="px-6 py-2.5 bg-gray-700 text-gray-300 font-medium rounded-lg hover:bg-gray-600 transition-colors">
                 Cancelar
               </button>
             </Link>
          ) : (
             <button
               onClick={() => setCurrentStep(prev => prev - 1)}
               className="flex items-center gap-2 px-6 py-2.5 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors"
             >
               <FaArrowLeft /> Atrás
             </button>
          )}
        </div>
        
        <div>
          {currentStep < 3 ? (
             <button
               onClick={() => setCurrentStep(prev => prev + 1)}
               disabled={currentStep === 1 && !tournamentData.name.trim()}
               className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
             >
               Siguiente <FaArrowRight />
             </button>
          ) : (
             <button
               onClick={handleFinalize}
               disabled={competitors.length === 0 || competitors.some(c => !c.name.trim())}
               className="flex items-center gap-2 px-8 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-900/20"
             >
               <FaCheck /> Finalizar y Crear
             </button>
          )}
        </div>
      </div>
    </div>
  );
}