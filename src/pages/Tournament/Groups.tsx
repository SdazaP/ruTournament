import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaLayerGroup, FaInfoCircle, FaCogs, FaUsers, FaClock, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { MdCategory } from 'react-icons/md';
import { db, CategoryLocal, CompetitorLocal, GroupLocal } from '../../common/db';

const Groups = () => {
  const { id } = useParams<{ id: string }>();
  const [categories, setCategories] = useState<CategoryLocal[]>([]);
  const [competitors, setCompetitors] = useState<CompetitorLocal[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [stationsCount, setStationsCount] = useState<number>(2);

  // Cargar datos
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
  
  // Extraer rondas de la categoria actual
  const rounds = activeCategory?.rounds || [];

  // Extraer grupos ya guardados o iniciar arreglo vacio 
  const activeRound = rounds.find(r => r.num === selectedRound);
  const savedGroups: GroupLocal[] = activeRound?.groups || [];

  // Helper para sumar minutos a una hora HH:MM string
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

  // Helper para diferencia en minutos
  const diffMinutes = (start: string, end: string) => {
    if (!start || !end) return 0;
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    return (h2 * 60 + m2) - (h1 * 60 + m1);
  };

  // Función núcleo de generación de grupos y staff
  const handleGenerateGroups = async () => {
    if (!activeCategory || !activeRound || !id) return;

    // 1. Filtrar los competidores que sí participan en esta categoría
    let participatingCompetitors = competitors.filter(c => c.categories.includes(activeCategory.id!));
    
    // 1.5 Validar si es una ronda posterior (Ronda > 1), entonces solo filtramos a los que "Avanzaron" desde la ronda anterior
    if (selectedRound > 1) {
        const previousRound = activeCategory.rounds.find(r => r.num === selectedRound - 1);
        if (!previousRound) {
            return alert('Error: no se encontró la ronda anterior.');
        }
        if (!previousRound.results || previousRound.results.length === 0) {
            return alert('Aún no se han subido los resultados de la ronda anterior. No se puede determinar quién pasa a esta ronda.');
        }

        const toAdvance = previousRound.competitorsToAdvance;
        let advancedIds: string[] = [];

        if (toAdvance === 'all') {
            advancedIds = previousRound.results.map(r => r.idCompetitor);
        } else {
            const count = Number(toAdvance);
            // Tomamos en consideración que 'previousRound.results' ya viene ordenado de la pestaña "Resultados", 
            // de caso contrario al menos tomará a los N primeros de la lista que tengan tiempo.
            advancedIds = previousRound.results.slice(0, count).map(r => r.idCompetitor);
        }

        participatingCompetitors = participatingCompetitors.filter(c => advancedIds.includes(c.id!));
        
        if (participatingCompetitors.length === 0) {
            return alert('Ningún competidor avanzó a esta ronda según los resultados anteriores.');
        }
    }
    
    // Aleatorizar el array base para que los grupos no queden idénticos siempre
    const shuffledComp = [...participatingCompetitors].sort(() => Math.random() - 0.5);

    // 2. Determinar cantidad de grupos basados en competencia
    const totalCompetitors = shuffledComp.length;
    if (totalCompetitors === 0) return alert('No hay competidores participando en esta categoría.');

    const qtyGroups = Math.ceil(totalCompetitors / stationsCount);
    
    // 3. Crear los grupos base (sin staff todavía)
    const newGroups: GroupLocal[] = [];
    
    // Fraccionar tiempos
    const totalDuration = diffMinutes(activeCategory.startTime || '10:00', activeCategory.endTime || '11:00');
    const minsPerGroup = Math.floor(Math.max(totalDuration / qtyGroups, 10)); // Mínimo 10 min por grupo
    let currentStart = activeCategory.startTime || '10:00';

    // Distribuir competidores (round-robin o chunks)
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

    // Llenar competidores en chunks equilibrados
    shuffledComp.forEach((comp, index) => {
        newGroups[index % qtyGroups].competitors.push(comp.id!);
    });

    // 4. Asignar Staff cruzado
    // Requisitos básicos:
    // Jueces: 1 por estación (= stationsCount)
    // Runners: 1 por cada 5 estaciones (Mínimo 1, Máximo 2 normalmente)
    // Scramblers: Mínimo 1, o +1 por cada 5 estaciones.
    const reqJudges = stationsCount;
    const reqRunners = Math.max(1, Math.floor(stationsCount / 5));
    const reqScramblers = Math.max(1, Math.floor(stationsCount / 5));

    // Llevar cuenta de cuántas veces alguien ha sido staff para balancear
    const staffCount: Record<string, number> = {};
    shuffledComp.forEach(c => staffCount[c.id!] = 0);

    newGroups.forEach((group) => {
        const tryFillRole = (role: 'judge' | 'runner' | 'scrambler', needed: number) => {
            // Buscamos candidatos:
            // 1. Que NO participen en el grupo actual
            // 2. Que tengan asignado el roi en el selectedCategory (que se definió en Staffing.tsx)
            let candidates = shuffledComp.filter(c => 
                !group.competitors.includes(c.id!) && 
                (c.assignedRoles?.[activeCategory.id!] || []).includes(role)
            );

            // Ordenarlos priorizando a los que tienen menos carga de staff global
            candidates.sort((a, b) => staffCount[a.id!] - staffCount[b.id!]);

            for (let k = 0; k < needed; k++) {
                if (candidates.length > 0) {
                    const picked = candidates.shift()!; // Remover el primero (el que menos carga tiene)
                    group.staff[role].push(picked.id!);
                    staffCount[picked.id!]++;
                } else {
                    // Juez Faltante
                    group.staff[role].push(`missing`);
                }
            }
        };

        tryFillRole('judge', reqJudges);
        tryFillRole('runner', reqRunners);
        tryFillRole('scrambler', reqScramblers);
    });

    // 5. Guardar en Base de Datos de forma segura respetando las rondas existentes
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
        
        // Actualizar UI
        setCategories(currentTourneyObj.categories);
    }
  };

  // Helpers visuales
  const getCompetitorName = (cid: string) => {
      if(cid === 'missing') return 'Vacante Faltante';
      const c = competitors.find(c => c.id === cid);
      return c ? c.name : 'Desconocido';
  }

  return (
    <div className="text-white p-4 md:p-6 lg:p-8">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <FaLayerGroup className="text-blue-400" /> Generación de Grupos y Roles
          </h2>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-16 text-gray-400 flex flex-col items-center gap-3">
          <FaInfoCircle size={32} />
          <p>No hay categorías registradas en este torneo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Panel Lateral: Configuración */}
          <div className="lg:col-span-1 bg-gray-800 rounded-lg border border-gray-700 p-5 flex flex-col gap-5 h-fit">
            <h3 className="text-lg font-semibold border-b border-gray-700 pb-2 flex items-center gap-2">
               <FaCogs className="text-gray-400"/> Controles
            </h3>
            
            <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-400 flex items-center gap-1">
                    <MdCategory /> Categoría Activa
                </label>
                <select
                    value={selectedCategory}
                    onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        setSelectedRound(1); // Reset round al cambiar categoría
                    }}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                    {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                        {cat.name}
                    </option>
                    ))}
                </select>
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-400">Ronda</label>
                <select
                    value={selectedRound}
                    onChange={(e) => setSelectedRound(Number(e.target.value))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                    {rounds.map((r) => (
                    <option key={r.num} value={r.num}>
                        Ronda {r.num}
                    </option>
                    ))}
                </select>
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-400" title="Define la cantidad de mesas simultáneas en tu competencia">
                    Estaciones / Mesas
                </label>
                <input
                    type="number"
                    min="1"
                    max="50"
                    value={stationsCount}
                    onChange={(e) => setStationsCount(Number(e.target.value))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </div>

            <button 
                onClick={handleGenerateGroups}
                className="mt-4 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
                <FaLayerGroup /> {savedGroups.length > 0 ? 'Regenerar Grupos' : 'Auto-Generar'}
            </button>
            <p className="text-xs text-gray-500 text-center mt-1 leading-relaxed">
               Divide automáticamente a los competidores basándose en el inventario de estaciones y cruza asignaciones de roles.
            </p>
          </div>

          {/* Panel Derecha: Canvas de Grupos */}
          <div className="lg:col-span-3">
             
             {savedGroups.length === 0 ? (
                 <div className="h-full min-h-[300px] border-2 border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center text-gray-500 p-8 text-center bg-gray-800/30">
                    <FaUsers size={40} className="mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold text-gray-400 mb-2">No se han generado grupos</h3>
                    <p className="max-w-md mx-auto text-sm">
                        Presiona "Auto-Generar" en el panel lateral para repartir matemáticamente a los competidores en base a {stationsCount} estaciones, respetando los roles pre-aprobados en la pestaña Staffing.
                    </p>
                 </div>
             ) : (
                 <div className="flex flex-col gap-6">
                    {/* Header Banner */}
                    <div className="flex flex-wrap gap-4 items-center justify-between bg-blue-900/20 border border-blue-900 p-4 rounded-lg">
                       <div>
                           <h3 className="font-semibold text-blue-400 flex items-center gap-2"><FaCheck /> Grupos Listos</h3>
                           <p className="text-sm text-gray-400 mt-1">
                               Se procesaron {savedGroups.reduce((acc, curr) => acc + curr.competitors.length, 0)} competidores en {savedGroups.length} grupos distintos.
                           </p>
                       </div>
                       <div className="flex items-center gap-3 bg-gray-900 rounded-md p-2 px-4 shadow-inner text-sm text-gray-300">
                          <span className="flex flex-col">
                             <span className="text-xs text-gray-500">Cronograma</span>
                             <span className="font-mono text-gray-200">
                                {activeCategory?.startTime || '10:00'} a {activeCategory?.endTime || '11:00'}
                             </span>
                          </span>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {savedGroups.map(group => (
                            <div key={group.id} className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden flex flex-col shadow-lg hover:border-gray-600 transition-colors">
                                {/* Cabecera de grupo */}
                                <div className="bg-gray-750 p-3 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
                                   <span className="font-bold text-white text-lg">{group.name}</span>
                                   <span className="flex items-center gap-1 text-xs px-2 py-1 bg-gray-700 rounded-full font-mono text-gray-300">
                                       <FaClock className="text-blue-400" /> {group.startTime} - {group.endTime}
                                   </span>
                                </div>
                                
                                {/* Lista del Group */}
                                <div className="p-4 flex-1">
                                    <div className="mb-4">
                                        <h4 className="text-xs uppercase font-bold text-gray-500 mb-2 tracking-wider">Competidores ({group.competitors.length})</h4>
                                        <div className="text-sm text-gray-300 bg-gray-900/40 rounded p-2 max-h-32 overflow-y-auto">
                                            {group.competitors.map((cid, i) => (
                                                <div key={cid} className="truncate">
                                                    <span className="text-gray-500 mr-2">{i+1}.</span> 
                                                    {getCompetitorName(cid)}
                                                </div>
                                            ))}
                                            {group.competitors.length === 0 && <span className="italic text-gray-600">Vacío</span>}
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-700 pt-3">
                                        <h4 className="text-xs uppercase font-bold text-gray-500 mb-2 tracking-wider">Rol Asignado (Staff)</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex flex-col">
                                                <span className="text-gray-400 text-xs mb-1">Jueces ({group.staff.judge.length})</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {group.staff.judge.map((cid, idx) => (
                                                        <span key={`j-${idx}`} className={`px-2 py-0.5 rounded text-xs ${cid === 'missing' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-gray-700 text-gray-200'}`}>
                                                            {getCompetitorName(cid)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-col">
                                                <span className="text-gray-400 text-xs mb-1">Runners ({group.staff.runner.length})</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {group.staff.runner.map((cid, idx) => (
                                                        <span key={`r-${idx}`} className={`px-2 py-0.5 rounded text-xs ${cid === 'missing' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-gray-700 text-gray-200'}`}>
                                                            {getCompetitorName(cid)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex flex-col">
                                                <span className="text-gray-400 text-xs mb-1">Scramblers ({group.staff.scrambler.length})</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {group.staff.scrambler.map((cid, idx) => (
                                                        <span key={`s-${idx}`} className={`px-2 py-0.5 rounded text-xs ${cid === 'missing' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-gray-700 text-gray-200'}`}>
                                                            {getCompetitorName(cid)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Advetencias en tarjetas si faltan recursos */}
                                {(group.staff.judge.includes('missing') || group.staff.runner.includes('missing') || group.staff.scrambler.includes('missing')) && (
                                   <div className="bg-yellow-900/30 p-2 text-xs flex items-center justify-center gap-2 text-yellow-400 border-t border-yellow-900/50">
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
      )}
    </div>
  );
};

export default Groups;
