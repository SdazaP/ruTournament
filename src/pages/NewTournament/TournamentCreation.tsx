import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TableCompetitors from '../../components/Tables/TableCompetitors';
import { db } from '../../common/db';
import { isDuplicateName, findDuplicateNames } from '../../common/validation';
import { WCA_EVENT_CONFIG } from '../../common/wcaEvents';
import { FaTrophy, FaLayerGroup, FaUsers, FaArrowRight, FaArrowLeft, FaCheck, FaEdit, FaClock, FaTrash, FaLock, FaRandom } from 'react-icons/fa';
import { MdCategory, MdOutlineTimer } from 'react-icons/md';
import { BsTrophyFill, BsGraphUp } from 'react-icons/bs';
import { GiLaurelsTrophy } from 'react-icons/gi';

type CategoryData = {
  name: string;
  format: 'WCA' | 'RedBull';
  startTime: string;
  endTime: string;
  rounds: { roundNumber: number; format: 'ao3' | 'ao5'; competitorsToAdvance: number | 'all'; isFinal: boolean; isSeeding?: boolean }[];
  bracketMode: 'random' | 'manual';
  hasSeeding: boolean;
  seedingFormat: 'ao3' | 'ao5';
};

type CompetitorData = {
  name: string;
  categories: string[];
};

const PREDEFINED_CATEGORIES = [
  "3x3", "2x2", "4x4", "5x5", "6x6", "7x7",
  "3x3 OH", "Clock", "Megaminx", "Pyraminx", "Skewb", "Square-1",
];

export default function TournamentCreation() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [tournamentData, setTournamentData] = useState({
    name: '',
    description: '',
    location: 'Tlaxcala, México',
    status: 'activo' as string,
  });
  const [categories, setCategories] = useState<CategoryData[]>([
    { name: '3x3', format: 'WCA', startTime: '10:00', endTime: '11:00',
      rounds: [{ roundNumber: 1, format: 'ao5', competitorsToAdvance: 'all', isFinal: true }],
      bracketMode: 'random', hasSeeding: false, seedingFormat: 'ao5' },
  ]);
  const [competitors, setCompetitors] = useState<CompetitorData[]>([
    { name: '', categories: ['3x3'] },
  ]);

  const [configurePhase, setConfigurePhase] = useState<'list' | 'config'>('list');
  const [configuringIndex, setConfiguringIndex] = useState(0);
  const [competitorNameErrors, setCompetitorNameErrors] = useState<Record<number, string>>({});
  const [customCatName, setCustomCatName] = useState('');
  const [newCatFormat, setNewCatFormat] = useState<'WCA' | 'RedBull'>('WCA');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTournamentData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddCategoryForEvent = (eventName: string) => {
    if (categories.length >= 10) return;
    setCategories(prev => [...prev, {
      name: eventName, format: 'WCA',
      startTime: '10:00', endTime: '11:00',
      rounds: [{ roundNumber: 1, format: 'ao5', competitorsToAdvance: 'all', isFinal: true }],
      bracketMode: 'random', hasSeeding: false, seedingFormat: 'ao5',
    }]);
  };

  const handleAddCustomCategory = () => {
    if (categories.length >= 10) return;
    const name = customCatName.trim();
    if (!name || categories.some(c => c.name.toLowerCase() === name.toLowerCase())) return;
    setCategories(prev => [...prev, {
      name, format: newCatFormat,
      startTime: '10:00', endTime: '11:00',
      rounds: [{ roundNumber: 1, format: 'ao5', competitorsToAdvance: 'all', isFinal: true }],
      bracketMode: 'random', hasSeeding: false, seedingFormat: 'ao5',
    }]);
    setCustomCatName('');
  };

  const handleRemoveCategory = (idx: number) => {
    if (categories.length > 1) setCategories(prev => prev.filter((_, i) => i !== idx));
  };

  const updateCurrentCategory = (field: keyof CategoryData, value: any) => {
    setCategories(prev => {
      const copy = [...prev];
      copy[configuringIndex] = { ...copy[configuringIndex], [field]: value };
      return copy;
    });
  };

  const handleUpdateSchedule = (field: 'startTime' | 'endTime', value: string) => {
    updateCurrentCategory(field, value);
  };

  const handleUpdateFormat = (format: 'WCA' | 'RedBull') => {
    const cat = categories[configuringIndex];
    if (format === 'RedBull') {
      setCategories(prev => {
        const copy = [...prev];
        copy[configuringIndex] = {
          ...copy[configuringIndex], format,
          rounds: [{ roundNumber: 1, format: 'ao5', competitorsToAdvance: 'all', isFinal: true }],
          bracketMode: 'random', hasSeeding: false, seedingFormat: 'ao5',
        };
        return copy;
      });
    } else {
      updateCurrentCategory('format', format);
    }
  };

  const handleUpdateRoundFormat = (roundIdx: number, format: 'ao3' | 'ao5') => {
    setCategories(prev => {
      const copy = [...prev];
      const rounds = [...copy[configuringIndex].rounds];
      rounds[roundIdx] = { ...rounds[roundIdx], format };
      copy[configuringIndex] = { ...copy[configuringIndex], rounds };
      return copy;
    });
  };

  const handleUpdateCompetitorsToAdvance = (roundIdx: number, value: number | 'all') => {
    setCategories(prev => {
      const copy = [...prev];
      const rounds = [...copy[configuringIndex].rounds];
      rounds[roundIdx] = { ...rounds[roundIdx], competitorsToAdvance: value };
      copy[configuringIndex] = { ...copy[configuringIndex], rounds };
      return copy;
    });
  };

  const handleAddRound = () => {
    setCategories(prev => {
      const copy = [...prev];
      const cat = copy[configuringIndex];
      if (cat.format !== 'WCA') return prev;
      const rounds = cat.rounds.map(r => ({ ...r, isFinal: false }));
      const lastRound = rounds[rounds.length - 1];
      rounds.push({
        roundNumber: (lastRound?.roundNumber || 0) + 1,
        format: 'ao5', competitorsToAdvance: 0, isFinal: true,
      });
      copy[configuringIndex] = { ...cat, rounds };
      return copy;
    });
  };

  const handleDeleteRound = (roundIdx: number) => {
    setCategories(prev => {
      const copy = [...prev];
      const rounds = copy[configuringIndex].rounds.filter((_, i) => i !== roundIdx);
      if (rounds.length > 0) rounds[rounds.length - 1].isFinal = true;
      copy[configuringIndex] = { ...copy[configuringIndex], rounds };
      return copy;
    });
  };

  const startConfigure = () => {
    setConfiguringIndex(0);
    setConfigurePhase('config');
  };

  const saveAndNext = () => {
    if (configuringIndex + 1 < categories.length) {
      setConfiguringIndex(prev => prev + 1);
    } else {
      setConfigurePhase('list');
      setCurrentStep(3);
    }
  };

  const backToPhaseA = () => {
    setConfigurePhase('list');
  };

  const handleAddCompetitor = () => {
    setCompetitors(prev => [...prev, { name: '', categories: [categories[0]?.name || ''] }]);
  };

  const handleUpdateCompetitor = (index: number, field: keyof CompetitorData, value: any) => {
    setCompetitors(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
    if (field === 'name') {
      setCompetitorNameErrors(prev => {
        if (!prev[index]) return prev;
        const next = { ...prev };
        delete next[index];
        return next;
      });
    }
  };

  const handleValidateName = (index: number) => {
    const name = competitors[index]?.name;
    if (!name || !name.trim()) return;
    const allNames = competitors.map((c) => c.name);
    if (isDuplicateName(name, allNames, index)) {
      setCompetitorNameErrors((prev) => ({ ...prev, [index]: 'Ya existe un competidor con ese nombre' }));
    } else {
      setCompetitorNameErrors((prev) => {
        if (!prev[index]) return prev;
        const next = { ...prev };
        delete next[index];
        return next;
      });
    }
  };

  const handleRemoveCompetitor = (index: number) => {
    if (competitors.length > 1) setCompetitors(prev => prev.filter((_, i) => i !== index));
  };

  const handleFinalize = async () => {
    const validCompetitors = competitors.filter(comp => comp.name.trim() !== '');
    const dupNames = findDuplicateNames(validCompetitors.map(c => c.name));
    if (dupNames.length > 0) {
      alert(`Hay competidores duplicados: ${dupNames.join(', ')}. Corrige los nombres antes de finalizar.`);
      return;
    }

    const tournamentId = Date.now().toString();

    const builtCategories = categories.map((cat, index) => {
      const categoryObj: any = {
        id: tournamentId + index,
        name: cat.name,
        format: cat.format.toLowerCase(),
        startTime: cat.startTime,
        endTime: cat.endTime,
      };

      if (cat.format === 'WCA') {
        categoryObj.rounds = cat.rounds.map((r, ri) => ({
          num: r.roundNumber, format: r.format, results: [],
          competitorsToAdvance: r.competitorsToAdvance,
          isFinal: r.isFinal,
        }));
      } else {
        categoryObj.bracketMode = cat.bracketMode;
        categoryObj.hasSeeding = cat.hasSeeding;
        categoryObj.seedingFormat = cat.seedingFormat;
        const rounds: any[] = [];
        if (cat.hasSeeding) {
          rounds.push({ num: 1, format: cat.seedingFormat, results: [], competitorsToAdvance: 'all', isFinal: false, isSeeding: true });
          rounds.push({ num: 2, format: 'rb', results: [], competitorsToAdvance: 'all', isFinal: true, matches: [], bracketMode: cat.bracketMode });
        } else {
          rounds.push({ num: 1, format: 'rb', results: [], competitorsToAdvance: 'all', isFinal: true, matches: [], bracketMode: cat.bracketMode });
        }
        categoryObj.rounds = rounds;
      }

      return categoryObj;
    });

    const builtCompetitors = validCompetitors
      .map((comp, ci) => {
        const foundCategoryIds = comp.categories.map(catName =>
          builtCategories.find(c => c.name === catName)?.id
        ).filter(Boolean);
        return { id: tournamentId + 'c' + ci, name: comp.name, categories: foundCategoryIds as string[] };
      });

    const tournament = {
      ...tournamentData, id: tournamentId,
      date: new Date().toISOString().split('T')[0],
      categories: builtCategories, competitors: builtCompetitors,
    };

    await db.tournaments.add(tournament as any);
    navigate(`/dashboard/tournament/${tournamentId}`);
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

        {currentStep === 2 && configurePhase === 'list' && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-2 text-gray-200">Categorías y Eventos</h2>
            <p className="text-gray-400 mb-6 border-b border-gray-700 pb-4">
              Selecciona los eventos del torneo ({categories.length}/10)
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
              {PREDEFINED_CATEGORIES.map((event) => {
                const config = WCA_EVENT_CONFIG[event];
                const added = categories.find(c => c.name === event);
                const atLimit = !added && categories.length >= 10;
                return (
                  <button
                    key={event}
                    onClick={() => {
                      if (added) {
                        handleRemoveCategory(categories.indexOf(added));
                      } else if (!atLimit) {
                        handleAddCategoryForEvent(event);
                      }
                    }}
                    disabled={atLimit}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all ${
                      added
                        ? (added.format === 'WCA'
                            ? 'bg-blue-600/20 border-blue-500/50 text-white'
                            : 'bg-red-600/20 border-red-500/50 text-white')
                        : atLimit
                          ? 'bg-gray-800 border-gray-700 text-gray-600 opacity-40 cursor-not-allowed'
                          : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300 opacity-70 hover:opacity-100 cursor-pointer'
                    }`}
                  >
                    <span className={`text-xl font-bold ${added && config ? config.color : ''}`}>
                      {config?.abbr || event}
                    </span>
                    <span className="text-[11px] leading-tight text-center">{event}</span>
                    {added && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        added.format === 'WCA' ? 'bg-blue-600 text-blue-200' : 'bg-red-600 text-red-200'
                      }`}>
                        {added.format === 'WCA' ? 'WCA' : 'RB'}
                      </span>
                    )}
                    {!added && !atLimit && (
                      <span className="text-[10px] text-gray-600">Agregar</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3 mb-6">
              <input type="text" placeholder="Otra categoría personalizada..."
                value={customCatName}
                onChange={(e) => setCustomCatName(e.target.value)}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
              <select value={newCatFormat} onChange={(e) => setNewCatFormat(e.target.value as 'WCA' | 'RedBull')}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm">
                <option value="WCA">WCA</option>
                <option value="RedBull">Red Bull</option>
              </select>
              <button onClick={handleAddCustomCategory}
                disabled={!customCatName.trim() || categories.length >= 10 || categories.some(c => c.name.toLowerCase() === customCatName.trim().toLowerCase())}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
                + Añadir
              </button>
            </div>

            {categories.length > 0 && (
              <div className="flex justify-end">
                <button onClick={startConfigure}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                  Configurar categorías <FaArrowRight />
                </button>
              </div>
            )}
          </div>
        )}

        {currentStep === 2 && configurePhase === 'config' && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-2 text-gray-200 border-b border-gray-700 pb-4">
              Configurando {categories[configuringIndex]?.name} — {configuringIndex + 1} de {categories.length}
            </h2>

            <div className="space-y-4">
              {/* Horario */}
              <div>
                <label className="text-xs text-gray-400 block mb-1 flex items-center gap-1"><FaClock size={10} /> Horario</label>
                <div className="flex items-center gap-2">
                  <input type="time" value={categories[configuringIndex]?.startTime || '10:00'}
                    onChange={(e) => handleUpdateSchedule('startTime', e.target.value)}
                    className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  <span className="text-gray-300">a</span>
                  <input type="time" value={categories[configuringIndex]?.endTime || '11:00'}
                    onChange={(e) => handleUpdateSchedule('endTime', e.target.value)}
                    className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>

              {/* Formato */}
              <div>
                <label className="text-xs text-gray-400 block mb-1">Formato</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateFormat('WCA')}
                    className={`px-4 py-1.5 rounded text-sm transition-colors ${
                      categories[configuringIndex]?.format === 'WCA'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    WCA
                  </button>
                  <button
                    onClick={() => handleUpdateFormat('RedBull')}
                    className={`px-4 py-1.5 rounded text-sm transition-colors ${
                      categories[configuringIndex]?.format === 'RedBull'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    Red Bull
                  </button>
                </div>
              </div>

              {/* WCA */}
              {categories[configuringIndex]?.format === 'WCA' && (
                <div>
                  <label className="text-xs text-gray-400 block mb-2">Rondas</label>
                  <div className="space-y-2">
                    {categories[configuringIndex]?.rounds.map((r, ri) => (
                      <div key={ri} className="flex items-center gap-2 bg-gray-750 rounded p-2">
                        <span className="text-sm text-gray-300 min-w-[80px]">{r.isFinal ? '🏆 Final' : `Ronda ${r.roundNumber}`}:</span>
                        <select value={r.format} onChange={(e) => handleUpdateRoundFormat(ri, e.target.value as 'ao5' | 'ao3')}
                          className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm">
                          <option value="ao5">AO5</option>
                          <option value="ao3">AO3</option>
                        </select>
                        {r.isFinal && <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">Final</span>}
                        {!r.isFinal && (
                          <div className="flex items-center gap-2 text-sm ml-4">
                            <span className="text-gray-500">Avanzan:</span>
                            <select value={r.competitorsToAdvance} onChange={(e) => handleUpdateCompetitorsToAdvance(ri, e.target.value === 'all' ? 'all' : parseInt(e.target.value) || 0)}
                              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm">
                              <option value="0">Ninguno</option>
                              <option value="4">4</option>
                              <option value="8">8</option>
                              <option value="10">10</option>
                              <option value="12">12</option>
                              <option value="16">16</option>
                              <option value="all">Todos</option>
                            </select>
              </div>
                        )}
                        {categories[configuringIndex]?.rounds.length > 1 && (
                          <button onClick={() => handleDeleteRound(ri)} className="text-xs bg-red-600 hover:bg-red-700 px-2 py-1 rounded ml-auto">×</button>
                        )}
                      </div>
                    ))}
                    <button onClick={handleAddRound} className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded">+ Añadir ronda</button>
                  </div>
                </div>
              )}

              {/* RedBull */}
              {categories[configuringIndex]?.format === 'RedBull' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Generación de brackets</label>
                    <select value={categories[configuringIndex]?.bracketMode || 'random'}
                      onChange={(e) => updateCurrentCategory('bracketMode', e.target.value as 'random' | 'manual')}
                      className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm w-full md:w-auto">
                      <option value="random">Aleatorio</option>
                      <option value="manual">Manual</option>
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={categories[configuringIndex]?.hasSeeding || false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const cat = categories[configuringIndex];
                          if (checked) {
                            const fmt = cat.seedingFormat || 'ao5';
                            updateCurrentCategory('hasSeeding', true);
                            setCategories(prev => { const copy = [...prev]; copy[configuringIndex] = { ...copy[configuringIndex], rounds: [
                              { roundNumber: 1, format: fmt, competitorsToAdvance: 'all', isFinal: false, isSeeding: true },
                              { roundNumber: 2, format: 'ao5' as any, competitorsToAdvance: 'all', isFinal: true },
                            ]}; return copy; });
                          } else {
                            updateCurrentCategory('hasSeeding', false);
                            setCategories(prev => { const copy = [...prev]; copy[configuringIndex] = { ...copy[configuringIndex], rounds: [
                              { roundNumber: 1, format: 'ao5' as any, competitorsToAdvance: 'all', isFinal: true },
                            ]}; return copy; });
                          }
                        }}
                        className="w-4 h-4 bg-gray-700 border-gray-600 rounded" />
                      <span className="text-xs text-gray-400">Ronda de clasificación previa</span>
                    </label>
                    {categories[configuringIndex]?.hasSeeding && (
                      <div className="mt-2 ml-6">
                        <select value={categories[configuringIndex]?.seedingFormat || 'ao5'}
                          onChange={(e) => updateCurrentCategory('seedingFormat', e.target.value as 'ao3' | 'ao5')}
                          className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-xs">
                          <option value="ao5">AO5</option>
                          <option value="ao3">AO3</option>
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="bg-gray-700/30 rounded p-3 text-xs text-gray-400">
                    {categories[configuringIndex]?.hasSeeding
                      ? <p><strong>Clasificación {categories[configuringIndex].seedingFormat?.toUpperCase()}</strong> + brackets. Mejores promedios reciben pase directo.</p>
                      : <p>Las rondas se generan automáticamente al crear los brackets en <strong>Resultados → Formato RB</strong>.</p>
                    }
                  </div>
                </div>
              )}
            </div>

            {/* Navegación fase B */}
            <div className="mt-8 flex justify-between border-t border-gray-700 pt-4">
              <button onClick={backToPhaseA} className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-sm">
                <FaArrowLeft /> Volver a lista
              </button>
              <button onClick={saveAndNext} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm">
                {configuringIndex + 1 < categories.length ? (
                  <>Guardar y siguiente <FaArrowRight /></>
                ) : (
                  <>Finalizar configuración <FaCheck /></>
                )}
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-2 text-gray-200">Competidores</h2>
            <p className="text-gray-400 mb-6 border-b border-gray-700 pb-4">Registra a los competidores y asígnales sus categorías</p>
            
            <div className="w-full overflow-hidden rounded-lg">
              <TableCompetitors 
                competitors={competitors}
                categories={categories.map(c => c.name)}
                onAddRow={handleAddCompetitor}
                onChange={handleUpdateCompetitor}
                onRemove={handleRemoveCompetitor}
                nameErrors={competitorNameErrors}
                onNameBlur={handleValidateName}
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
          ) : currentStep === 2 && configurePhase === 'list' ? (
             <button onClick={() => setCurrentStep(1)} className="flex items-center gap-2 px-6 py-2.5 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors">
               <FaArrowLeft /> Atrás
             </button>
          ) : (
             <button onClick={() => { setCurrentStep(prev => prev - 1); setConfigurePhase('list'); }}
               className="flex items-center gap-2 px-6 py-2.5 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors">
               <FaArrowLeft /> Atrás
             </button>
          )}
        </div>

        <div>
          {currentStep === 1 && (
             <button onClick={() => setCurrentStep(2)} disabled={!tournamentData.name.trim()}
               className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
               Siguiente <FaArrowRight />
             </button>
          )}
          {currentStep === 2 && configurePhase === 'list' && (
             <button onClick={startConfigure} disabled={categories.length === 0}
               className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
               Siguiente: Configurar <FaArrowRight />
             </button>
          )}
          {currentStep === 3 && (
             <button onClick={handleFinalize} disabled={competitors.every(c => !c.name.trim())}
               className="flex items-center gap-2 px-8 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-900/20">
               <FaCheck /> Finalizar y Crear
             </button>
          )}
        </div>
      </div>
    </div>
  );
}