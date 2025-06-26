import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TableTournament from '../../components/Tables/TableTournament';
import TableCompetitors from '../../components/Tables/TableCompetitors';
import { newTournament, newCategory, newCompetitor, newCompetitorToCategory } from '../../utils/localStorage';

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
  category: string;
};

export default function TournamentWelcome() {
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
    { name: '', category: "3x3" }
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
    setCompetitors(prev => [...prev, { name: '', category: "3x3" }]);
  };

  const handleUpdateCompetitor = (index: number, field: keyof CompetitorData, value: string) => {
    const updatedCompetitors = [...competitors];
    updatedCompetitors[index][field] = value;
    setCompetitors(updatedCompetitors);
  };

  const handleRemoveCompetitor = (index: number) => {
    if (competitors.length > 1) {
      setCompetitors(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleFinalize = () => {
    // Crear el torneo
    const tournamentId = Date.now().toString();
    const tournament = {
      ...tournamentData,
      id: tournamentId,
      date: new Date().toISOString().split('T')[0],
      categories: [],
      competitors: []
    };
    
    // Agregar el torneo al localStorage
    newTournament(tournament);

    // Agregar categorías
    categories.forEach(cat => {
      newCategory(tournamentId, {
        id: Date.now().toString(),
        name: cat.category,
        format: cat.mode,
        rounds: [] // Las rondas se agregarán después
      });
    });

    // Agregar competidores
    competitors.forEach(comp => {
      if (comp.name.trim()) {
        const competitorId = Date.now().toString();
        newCompetitor(tournamentId, {
          id: competitorId,
          name: comp.name,
          categories: [categories.findIndex(c => c.category === comp.category) + 1].map(n => `c${n}`)
        });
      }
    });

    // Redirigir al dashboard
    navigate('/dashboard');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="flex items-center justify-center w-full p-4 md:p-10">
            <div className="w-full max-w-6xl h-full flex flex-col items-center justify-center">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 md:mb-10 text-white text-center">
                Bienvenido
              </h1>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 w-full">
                <div className="flex flex-col items-center gap-4 md:gap-6">
                  <div className="w-20 h-20 md:w-32 md:h-32 bg-gray-700 rounded-full flex items-center justify-center text-lg text-white">
                    Logo
                  </div>
                  <label className="text-base md:text-lg font-medium text-white text-center">
                    Ingresa el nombre del torneo
                  </label>
                  <input
                    name="name"
                    type="text"
                    value={tournamentData.name}
                    onChange={handleInputChange}
                    placeholder="Ingrese el nombre"
                    className="w-full rounded-lg border border-gray-600 py-2 md:py-3 px-4 text-white bg-gray-800 outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-3 md:gap-4">
                  <label className="text-base md:text-lg font-medium text-white text-center lg:text-left">
                    Descripción del Torneo
                  </label>
                  <textarea
                    name="description"
                    rows={4}
                    value={tournamentData.description}
                    onChange={handleInputChange}
                    placeholder="Ingrese la descripción"
                    className="w-full rounded-lg border border-gray-600 py-2 md:py-3 px-4 text-white bg-gray-800 outline-none focus:border-blue-500"
                  ></textarea>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mt-6 md:mt-10 w-full sm:w-auto">
                <button
                  className="px-6 py-2 md:px-8 md:py-3 bg-blue-500 text-white text-base md:text-lg rounded shadow-md hover:bg-blue-600"
                  onClick={() => setCurrentStep(2)}
                  disabled={!tournamentData.name}
                >
                  Siguiente
                </button>
                <Link to="/" className="w-full sm:w-auto">
                  <button className="w-full px-6 py-2 md:px-8 md:py-3 bg-red-500 text-white text-base md:text-lg rounded shadow-md hover:bg-red-700">
                    Cancelar
                  </button>
                </Link>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="flex items-center justify-center w-full p-4 md:p-10">
            <div className="w-full max-w-6xl h-full flex flex-col items-center justify-center">
              <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-4 my-4">
                <div className="w-20 h-20 md:w-32 md:h-32 bg-gray-700 rounded-full flex items-center justify-center text-lg text-white">
                  Logo
                </div>
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white text-center">
                  {tournamentData.name || 'Nombre del Torneo'}
                </h1>
              </div>
              <h2 className="text-2xl md:text-4xl font-bold text-gray-400 my-4 text-center">
                Categorías
              </h2>
              <div className="w-full">
                <TableTournament 
                  tournamentData={categories}
                  onAddRow={() => handleAddCategory({
                    category: "3x3",
                    rounds: "Final directa",
                    mode: "WCA",
                    avg_mode: "ao5"
                  })}
                  onChange={handleUpdateCategory}
                  onRemove={handleRemoveCategory}
                />
              </div>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mt-6 md:mt-10">
                <button
                  className="px-6 py-2 md:px-8 md:py-3 bg-gray-500 text-white text-base md:text-lg rounded shadow-md hover:bg-gray-600"
                  onClick={() => setCurrentStep(1)}
                >
                  Anterior
                </button>
                <button
                  className="px-6 py-2 md:px-8 md:py-3 bg-blue-500 text-white text-base md:text-lg rounded shadow-md hover:bg-blue-600"
                  onClick={() => setCurrentStep(3)}
                  disabled={categories.length === 0}
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="flex items-center justify-center w-full p-4 md:p-10">
            <div className="w-full max-w-6xl h-full flex flex-col items-center justify-center">
              <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-4 my-4">
                <div className="w-20 h-20 md:w-32 md:h-32 bg-gray-700 rounded-full flex items-center justify-center text-lg text-white">
                  Logo
                </div>
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white text-center">
                  {tournamentData.name || 'Nombre del Torneo'}
                </h1>
              </div>
              <h2 className="text-2xl md:text-4xl font-bold text-gray-400 my-4 text-center">
                Lista de competidores
              </h2>
              <div className="w-full">
                <TableCompetitors 
                  competitors={competitors}
                  categories={categories.map(c => c.category)}
                  onAddRow={handleAddCompetitor}
                  onChange={handleUpdateCompetitor}
                  onRemove={handleRemoveCompetitor}
                />
              </div>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mt-6 md:mt-10">
                <button
                  className="px-6 py-2 md:px-8 md:py-3 bg-gray-500 text-white text-base md:text-lg rounded shadow-md hover:bg-gray-600"
                  onClick={() => setCurrentStep(2)}
                >
                  Anterior
                </button>
                <button
                  className="px-6 py-2 md:px-8 md:py-3 bg-blue-500 text-white text-base md:text-lg rounded shadow-md hover:bg-blue-600"
                  onClick={handleFinalize}
                  disabled={competitors.length === 0 || competitors.some(c => !c.name.trim())}
                >
                  Finalizar
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return renderStep();
}