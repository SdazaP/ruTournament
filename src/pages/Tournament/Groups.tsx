import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaLayerGroup, FaInfoCircle, FaCogs, FaUsers, FaClock, FaCheck, FaExclamationTriangle, FaGavel, FaRunning, FaRandom, FaTrash, FaLock } from 'react-icons/fa';
import { MdCategory } from 'react-icons/md';
import { db, CategoryLocal, CompetitorLocal, GroupLocal } from '../../common/db';
import { useTournamentStatus } from '../../hooks/useTournamentStatus';


const Groups = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isFinalized, status } = useTournamentStatus(id);
  const [competitors, setCompetitors] = useState<CompetitorLocal[]>([]);
  const [categories, setCategories] = useState<CategoryLocal[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [stationsCount, setStationsCount] = useState<number>(2);
  const [showOverwriteModal, setShowOverwriteModal] = useState(false);
  const [showNoCompetitorsModal, setShowNoCompetitorsModal] = useState(false);
  const [showDeleteGroupsModal, setShowDeleteGroupsModal] = useState(false);
  const [showNoResultsModal, setShowNoResultsModal] = useState(false);


  useEffect(() => {
    if (!id) return;
    db.tournaments.get(id).then((t) => {
      if (!t) return;
      setCategories(t.categories || []);
      setCompetitors(t.competitors || []);
      
      if (t.categories && t.categories.length > 0) {
        setSelectedCategory(t.categories[0].id!);
      }
    });
  }, [id]);


  const activeCategory = categories.find(c => c.id === selectedCategory);
  const isRedBull = activeCategory && (activeCategory as any).format === 'redbull';
  const rounds = activeCategory?.rounds || [];
  const activeRound = rounds.find(r => r.num === selectedRound);
  const savedGroups: GroupLocal[] = activeRound?.groups || [];


  const addMinutes = (timeString: string, minsToAdd: number) => {
    if (!timeString) return '';
    const [h, m] = timeString.split(':').map(Number);
    let date = new Date();
    date.setHours(h, m, 0);
    date.setMinutes(date.getMinutes() + minsToAdd);
    const rh = date.getHours().toString().padStart(2, '0');
    const rm = date.getMinutes().toString().padStart(2, '0');
    return `${rh}:${rm}`;
  };


  const diffMinutes = (start: string, end: string) => {
    if (!start || !end) return 0;
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    return (h2 * 60 + m2) - (h1 * 60 + m1);
  };


  const actuallyGenerateGroups = async () => {
    if (!activeCategory || !activeRound || !id) return;

    let participatingCompetitors = competitors.filter(c => c.categories.includes(activeCategory.id!));
    
    if (selectedRound > 1) {
        const previousRound = activeCategory.rounds.find(r => r.num === selectedRound - 1);
        if (!previousRound) {
            return alert('Error: no se encontró la ronda anterior.');
        }
        if (!previousRound.results || previousRound.results.length === 0) {
            setShowNoResultsModal(true);
            return;
        }

        const toAdvance = previousRound.competitorsToAdvance;
        let advancedIds: string[] = [];

        if (toAdvance === 'all') {
            advancedIds = previousRound.results.map(r => r.idCompetitor);
        } else {
            const count = Number(toAdvance);
            advancedIds = previousRound.results.slice(0, count).map(r => r.idCompetitor);
        }

        participatingCompetitors = participatingCompetitors.filter(c => advancedIds.includes(c.id!));
        
        if (participatingCompetitors.length === 0) {
            return alert('Ningún competidor avanzó a esta ronda según los resultados anteriores.');
        }
    }
    
    const shuffledComp = [...participatingCompetitors].sort(() => Math.random() - 0.5);

    const totalCompetitors = shuffledComp.length;
    if (totalCompetitors === 0) {
      setShowNoCompetitorsModal(true);
      return;
    }

    const qtyGroups = Math.ceil(totalCompetitors / stationsCount);
    const newGroups: GroupLocal[] = [];
    
    const totalDuration = diffMinutes(activeCategory.startTime || '10:00', activeCategory.endTime || '11:00');
    const minsPerGroup = Math.floor(Math.max(totalDuration / qtyGroups, 10));
    let currentStart = activeCategory.startTime || '10:00';

    for (let i = 0; i < qtyGroups; i++) {
        const groupEndTime = addMinutes(currentStart, minsPerGroup);
        const groupName = `Grupo ${i + 1}`;
        newGroups.push({
            id: `g-${Date.now()}-${i}`,
            name: groupName,
            startTime: currentStart,
            endTime: groupEndTime,
            competitors: [],
            staff: { judge: [], runner: [], scrambler: [] }
        });
        currentStart = groupEndTime;
    }

    shuffledComp.forEach((comp, index) => {
        newGroups[index % qtyGroups].competitors.push(comp.id!);
    });

    const reqJudges = stationsCount;
    const reqRunners = Math.max(1, Math.floor(stationsCount / 5));
    const reqScramblers = Math.max(1, Math.floor(stationsCount / 5));

    const staffCount: Record<string, number> = {};
    shuffledComp.forEach(c => staffCount[c.id!] = 0);

    newGroups.forEach((group) => {
        const tryFillRole = (role: 'judge' | 'runner' | 'scrambler', needed: number) => {
            let candidates = shuffledComp.filter(c => 
                !group.competitors.includes(c.id!) && 
                (c.assignedRoles?.[activeCategory.id!] || []).includes(role)
            );

            candidates.sort((a, b) => staffCount[a.id!] - staffCount[b.id!]);

            for (let k = 0; k < needed; k++) {
                if (candidates.length > 0) {
                    const picked = candidates.shift()!;
                    group.staff[role].push(picked.id!);
                    staffCount[picked.id!]++;
                } else {
                    group.staff[role].push(`missing`);
                }
            }
        };

        tryFillRole('judge', reqJudges);
        tryFillRole('runner', reqRunners);
        tryFillRole('scrambler', reqScramblers);
    });

    const currentTourneyObj = await db.tournaments.get(id);
    if(currentTourneyObj) {
        currentTourneyObj.categories = currentTourneyObj.categories.map(cat => {
            if(cat.id === activeCategory.id) {
                return {
                    ...cat,
                    rounds: cat.rounds.map(r => {
                        if (r.num === selectedRound) {
                            return { ...r, groups: newGroups };
                        }
                        return r;
                    })
                }
            }
            return cat;
        });
        await db.tournaments.put(currentTourneyObj as any);
        setCategories(currentTourneyObj.categories);
    }
  };


  const getCompetitorName = (cid: string) => {
      if(cid === 'missing') return 'Vacante Faltante';
      const c = competitors.find(c => c.id === cid);
      return c ? c.name : 'Desconocido';
  }


  const handleGenerateGroupsClick = () => {
    if (savedGroups.length > 0) {
      setShowOverwriteModal(true);
    } else {
      actuallyGenerateGroups();
    }
  };


  const handleDeleteGroups = () => {
    setShowDeleteGroupsModal(true);
  };


  const confirmDeleteGroups = async () => {
    if (!id || !activeCategory) return;
    setShowDeleteGroupsModal(false);

    const tournament = await db.tournaments.get(id);
    if (tournament) {
      tournament.categories = tournament.categories.map((cat: any) => {
        if (cat.id !== selectedCategory) return cat;
        return {
          ...cat,
          rounds: cat.rounds.map((r: any) => {
            if (r.num !== selectedRound) return r;
            return { ...r, groups: [], scrambles: [] };
          })
        };
      });
      await db.tournaments.put(tournament as any);
      setCategories(tournament.categories);
    }
  };


  return (
    <div className="text-gray-900 dark:text-white p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <FaLayerGroup className="text-blue-400" /> Generación de Grupos y Roles
          </h2>
        </div>
      </div>

      {status === 'proximamente' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40 rounded-lg px-4 py-3 flex items-center gap-3 text-blue-700 dark:text-blue-300 text-sm mb-6">
          <FaClock className="flex-shrink-0" />
          <span>
            <strong className="text-blue-900 dark:text-white">Torneo Próximamente.</strong> Puedes generar horarios pero la carga de resultados está deshabilitada hasta que actives el torneo.
          </span>
        </div>
      )}

      {categories.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400 flex flex-col items-center gap-3">
          <FaInfoCircle size={32} />
          <p>No hay categorías registradas en este torneo.</p>
        </div>
      ) : categories.every(c => (c as any).format === 'redbull') ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400 flex flex-col items-center gap-3 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
          <FaLayerGroup size={40} className="opacity-50 mb-2" />
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-300">Formato Red Bull</h3>
          <p className="max-w-md text-sm">
            El formato Red Bull no utiliza grupos físicos con horarios. Los enfrentamientos
            se gestionan directamente en la sección de <strong>Resultados &gt; Formato RB</strong>.
          </p>
        </div>
      ) : (
        <>
          {activeCategory && (activeCategory as any).format === 'redbull' && (
            <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700/50 rounded-lg p-4 text-sm text-yellow-800 dark:text-yellow-300 mb-6 flex items-start gap-3">
              <FaInfoCircle className="mt-0.5 flex-shrink-0" />
              <span>La categoría <strong>{activeCategory.name}</strong> usa formato Red Bull y no necesita grupos. Selecciona una categoría WCA arriba para usar el generador de horarios.</span>
            </div>
          )}

          <div className="bg-gray-100/70 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <FaInfoCircle /> Significado de los roles de Staff
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-300 dark:border-gray-600 items-start gap-3">
                <div className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 p-2 rounded-full flex-shrink-0">
                  <FaGavel size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-blue-700 dark:text-blue-300 capitalize">Judge (Juez)</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Llama al competidor, supervisa que siga las normas de inspección/resolución y firma los tiempos oficiales.</p>
                </div>
              </div>

              <div className="flex bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-300 dark:border-gray-600 items-start gap-3">
                <div className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 p-2 rounded-full flex-shrink-0">
                  <FaRunning size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-green-700 dark:text-green-300 capitalize">Runner (Corredor)</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Lleva los cubos revueltos desde la mesa de Scramblers a las estaciones de los Jueces.</p>
                </div>
              </div>

              <div className="flex bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-300 dark:border-gray-600 items-start gap-3">
                <div className="bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400 p-2 rounded-full flex-shrink-0">
                  <FaRandom size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-purple-700 dark:text-purple-300 capitalize">Scrambler (Mezclador)</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Aplica las mezclas oficiales a cada cubo usando un cover, asegurando que no se filtre información.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 flex flex-col gap-5 h-fit">
              <h3 className="text-lg font-semibold border-b dark:border-gray-700 border-gray-200 pb-2 flex items-center gap-2">
                <FaCogs className="text-gray-400" /> Controles
              </h3>

              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <MdCategory /> Categoría Activa
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedRound(1);
                  }}
                  className="w-full bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600 dark:text-gray-400">Ronda</label>
                <select
                  value={selectedRound}
                  onChange={(e) => setSelectedRound(Number(e.target.value))}
                  disabled={isRedBull}
                  className={`w-full bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${isRedBull ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {rounds.map((r) => (
                    <option key={r.num} value={r.num}>
                      Ronda {r.num}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600 dark:text-gray-400" title="Define la cantidad de mesas simultáneas en tu competencia">
                  Estaciones / Mesas
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={stationsCount}
                  onChange={(e) => setStationsCount(Number(e.target.value))}
                  disabled={isRedBull}
                  className={`w-full bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${isRedBull ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>

              <button
                onClick={() => !isFinalized && handleGenerateGroupsClick()}
                disabled={isFinalized || isRedBull}
                title={
                  isRedBull ? 'No disponible para formato Red Bull' :
                  isFinalized ? 'El torneo está Finalizado.' : ''
                }
                className={`mt-4 w-full px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  isFinalized || isRedBull
                    ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 opacity-60 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isFinalized ? <FaLock /> : <FaLayerGroup />}
                {isFinalized ? 'Bloqueado' : savedGroups.length > 0 ? 'Regenerar Grupos' : 'Auto-Generar'}
              </button>

              {savedGroups.length > 0 && !isFinalized && (
                <button
                  onClick={handleDeleteGroups}
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <FaTrash size={12} /> Eliminar Grupos
                </button>
              )}

              <p className="text-xs text-gray-600 dark:text-gray-500 text-center mt-1 leading-relaxed">
                Divide automáticamente a los competidores basándose en el inventario de estaciones y cruza asignaciones de roles.
              </p>
            </div>

            <div className="lg:col-span-3">
              {savedGroups.length === 0 ? (
                <div className="h-full min-h-[300px] border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 p-8 text-center bg-gray-100 dark:bg-gray-800">
                  <FaUsers size={40} className="mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-400 mb-2">No se han generado grupos</h3>
                  <p className="max-w-md mx-auto text-sm">
                    Presiona "Auto-Generar" en el panel lateral para repartir matemáticamente a los competidores en base a {stationsCount} estaciones, respetando los roles pre-aprobados en la pestaña Staffing.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-wrap gap-4 items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2"><FaCheck /> Grupos Listos</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Se procesaron {savedGroups.reduce((acc, curr) => acc + curr.competitors.length, 0)} competidores en {savedGroups.length} grupos distintos.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-md p-2 px-4 shadow-inner text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                      <span className="flex flex-col">
                        <span className="text-xs text-gray-500">Cronograma</span>
                        <span className="font-mono text-gray-900 dark:text-gray-200">
                          {activeCategory?.startTime || '10:00'} a {activeCategory?.endTime || '11:00'}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {savedGroups.map(group => (
                      <div key={group.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                        <div className="bg-gray-50 dark:bg-gray-900 p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                          <span className="font-bold text-gray-900 dark:text-white text-lg">{group.name}</span>
                          <span className="flex items-center gap-1 text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full font-mono text-gray-700 dark:text-gray-300">
                            <FaClock className="text-blue-400" /> {group.startTime} - {group.endTime}
                          </span>
                        </div>

                        <div className="p-4 flex-1">
                          <div className="mb-4">
                            <h4 className="text-xs uppercase font-bold text-gray-500 mb-2 tracking-wider">Competidores ({group.competitors.length})</h4>
                            <div className="text-sm text-gray-800 dark:text-gray-300 dark:bg-gray-900 bg-gray-50 rounded p-2 max-h-32 overflow-y-auto">
                              {group.competitors.map((cid, i) => (
                                <div key={cid} className="truncate">
                                  <span className="text-gray-500 mr-2">{i+1}.</span>
                                  {getCompetitorName(cid)}
                                </div>
                              ))}
                              {group.competitors.length === 0 && <span className="italic text-gray-500 dark:text-gray-400">Vacío</span>}
                            </div>
                          </div>

                          <div className="border-t dark:border-gray-700 border-gray-200 pt-3">
                            <h4 className="text-xs uppercase font-bold text-gray-500 mb-2 tracking-wider">Rol Asignado (Staff)</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex flex-col">
                                <span className="text-gray-600 dark:text-gray-400 text-xs mb-1">Jueces ({group.staff.judge.length})</span>
                                <div className="flex flex-wrap gap-1">
                                  {group.staff.judge.map((cid, idx) => (
                                    <span key={`j-${idx}`} className={`px-2 py-0.5 rounded text-xs ${cid === 'missing' ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}>
                                      {getCompetitorName(cid)}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="flex flex-col">
                                <span className="text-gray-600 dark:text-gray-400 text-xs mb-1">Runners ({group.staff.runner.length})</span>
                                <div className="flex flex-wrap gap-1">
                                  {group.staff.runner.map((cid, idx) => (
                                    <span key={`r-${idx}`} className={`px-2 py-0.5 rounded text-xs ${cid === 'missing' ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}>
                                      {getCompetitorName(cid)}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="flex flex-col">
                                <span className="text-gray-600 dark:text-gray-400 text-xs mb-1">Scramblers ({group.staff.scrambler.length})</span>
                                <div className="flex flex-wrap gap-1">
                                  {group.staff.scrambler.map((cid, idx) => (
                                    <span key={`s-${idx}`} className={`px-2 py-0.5 rounded text-xs ${cid === 'missing' ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}>
                                      {getCompetitorName(cid)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {(group.staff.judge.includes('missing') || group.staff.runner.includes('missing') || group.staff.scrambler.includes('missing')) && (
                          <div className="bg-yellow-50 dark:bg-yellow-900/30 p-2 text-xs flex items-center justify-center gap-2 text-yellow-800 dark:text-yellow-400 border-t border-yellow-200 dark:border-yellow-900/50">
                            <FaExclamationTriangle /> Se requieren más voluntarios
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {showOverwriteModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-gray-300 dark:border-gray-600 overflow-hidden transform transition-all">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/20 text-red-500 mb-4 mx-auto">
                <FaInfoCircle size={24} />
              </div>
              <h3 className="text-xl font-bold text-center dark:text-white text-gray-900 mb-2">Renovar Grupos</h3>
              <p className="text-gray-600 dark:text-gray-400 text-center text-sm mb-6">
                Ya existen grupos programados para esta ronda. Volver a generarlos destruirá la distribución actual y <strong>eliminará por completo</strong> cualquier mezcla (scramble) oficial que hayas generado específicamente para ellos. ¿Continuar de todas formas?
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowOverwriteModal(false)}
                  className="flex-1 py-2.5 px-4 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 rounded-lg transition-colors font-medium text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setShowOverwriteModal(false);
                    actuallyGenerateGroups();
                  }}
                  className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm flex justify-center"
                >
                  Sí, Destruir y Regenerar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNoResultsModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-gray-300 dark:border-gray-600 overflow-hidden transform transition-all">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-500/20 text-yellow-500 mb-4 mx-auto">
                <FaExclamationTriangle size={22} />
              </div>
              <h3 className="text-xl font-bold text-center dark:text-white text-gray-900 mb-2">Resultados no disponibles</h3>
              <p className="text-gray-600 dark:text-gray-400 text-center text-sm mb-4">
                Aún no se han registrado los resultados de la <strong>Ronda {selectedRound - 1}</strong>. Para poder generar los grupos de esta ronda, primero es necesario determinar quién avancó.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40 rounded-lg p-3 text-xs text-blue-700 dark:text-blue-300 mb-6 flex items-start gap-2">
                <FaInfoCircle className="mt-0.5 flex-shrink-0" />
                <span>Ve a la sección de <strong>Resultados</strong> de esta categoría, sube los tiempos de la ronda anterior y luego regresa para continuar con la generación de grupos.</span>
              </div>
              <button
                onClick={() => setShowNoResultsModal(false)}
                className="w-full py-2.5 px-4 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 rounded-lg transition-colors font-medium text-sm"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {showNoCompetitorsModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-gray-300 dark:border-gray-600 overflow-hidden transform transition-all">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-500/20 text-yellow-500 mb-4 mx-auto">
                <FaUsers size={22} />
              </div>
              <h3 className="text-xl font-bold text-center dark:text-white text-gray-900 mb-2">Sin Competidores</h3>
              <p className="text-gray-600 dark:text-gray-400 text-center text-sm mb-6">
                No hay competidores inscritos en esta categoría. Para generar grupos primero debes agregar competidores y asignarlos a sus categorías.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setShowNoCompetitorsModal(false);
                    navigate(`/dashboard/tournament/${id}/competitors`);
                  }}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2"
                >
                  <FaUsers /> Ir a Categorías y Roles
                </button>
                <button
                  onClick={() => setShowNoCompetitorsModal(false)}
                  className="w-full py-2.5 px-4 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 rounded-lg transition-colors font-medium text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteGroupsModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-gray-300 dark:border-gray-600 overflow-hidden transform transition-all">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/20 text-red-500 mb-4 mx-auto">
                <FaTrash size={20} />
              </div>
              <h3 className="text-xl font-bold text-center dark:text-white text-gray-900 mb-2">Eliminar Grupos de la Ronda</h3>
              <p className="text-gray-600 dark:text-gray-400 text-center text-sm mb-4">
                ¿Estás seguro de que deseas eliminar todos los grupos de la <strong>Ronda {selectedRound}</strong> de <strong>{activeCategory?.name}</strong>?
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700/50 rounded-lg p-3 text-xs text-yellow-800 dark:text-yellow-400 mb-6 flex items-start gap-2">
                <FaExclamationTriangle className="mt-0.5 flex-shrink-0" />
                <span>También se eliminarán las mezclas oficiales asociadas a esta ronda. Esta acción no se puede deshacer.</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowDeleteGroupsModal(false)}
                  className="flex-1 py-2.5 px-4 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 rounded-lg transition-colors font-medium text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteGroups}
                  className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm flex justify-center"
                >
                  Sí, Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;