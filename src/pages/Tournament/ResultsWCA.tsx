import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../common/db';
import { FaEdit, FaSave, FaTimes, FaTrash, FaInfoCircle } from 'react-icons/fa';
import {
  MdOutlineTimer,
  MdLeaderboard,
  MdCategory,
  MdPeople,
} from 'react-icons/md';
import { BsTrophyFill, BsGraphUp } from 'react-icons/bs';
import { TimeRecord, Penalty } from '../../common/db';

export const normalizeTime = (t: any): TimeRecord => {
  if (t !== null && typeof t === 'object' && 'base' in t) {
    return t as TimeRecord;
  }
  if (typeof t === 'number') {
    return { base: t > 0 ? t : 0, penalty: t < 0 ? 'DNF' : '' };
  }
  return { base: 0, penalty: '' };
};

const getSolveValue = (t: TimeRecord) => {
  if (t.penalty === 'DNF' || t.base <= 0) return -1;
  return t.base + (t.penalty === '+2' ? 2 : 0);
};

export const calculateRulesStats = (times: TimeRecord[], format: 'ao3' | 'ao5') => {
  const solves = times.map(t => getSolveValue(t));
  const finishedSolves = solves.filter(s => s > 0);
  const dnfsCount = solves.filter(s => s < 0).length;
  
  let best = -1;
  if (finishedSolves.length > 0) best = Math.min(...finishedSolves);

  // Consideramos todo digitado si hay bases > 0 o DNF directo
  const allEntered = times.every(t => t.base > 0 || t.penalty === 'DNF');
  if (!allEntered) return { best, average: 0 };

  let average = 0;
  if (format === 'ao3') {
    if (dnfsCount > 0) average = -1;
    else average = solves.reduce((a, b) => a + b, 0) / 3;
  } else if (format === 'ao5') {
    if (dnfsCount >= 2) average = -1;
    else {
      const valid = solves.filter(s => s > 0).sort((a, b) => a - b);
      if (dnfsCount === 1) {
        valid.shift();
        average = valid.reduce((a, b) => a + b, 0) / 3;
      } else {
        valid.shift();
        valid.pop();
        average = valid.reduce((a, b) => a + b, 0) / 3;
      }
    }
  }

  return { 
    best: best > 0 ? Math.floor(best * 100) / 100 : -1, 
    average: average > 0 ? Math.floor(average * 100) / 100 : -1 
  };
};

export const sortWCA = (a: any, b: any) => {
  const getWeight = (avg: number) => {
    if (avg > 0) return 1;    // Valid average
    if (avg === -1) return 2; // DNF
    return 3;                 // Not completed (0)
  };

  const weightA = getWeight(a.average);
  const weightB = getWeight(b.average);

  if (weightA !== weightB) return weightA - weightB;

  if (weightA === 1) {
    if (a.average !== b.average) return a.average - b.average;
    const bestA = a.best > 0 ? a.best : Infinity;
    const bestB = b.best > 0 ? b.best : Infinity;
    return bestA - bestB; // Ascendente por Best si hay empate en Average
  }

  // Si ambos son DNF o sin tiempo, ordenar por Best
  const bestA = a.best > 0 ? a.best : (a.best === -1 ? Infinity - 1 : Infinity);
  const bestB = b.best > 0 ? b.best : (b.best === -1 ? Infinity - 1 : Infinity);
  if (bestA !== bestB) return bestA - bestB;

  // Sino, empata
  return a.name?.localeCompare(b.name || '');
};

export const formatTimeDisplay = (t: any, isMobile: boolean = false): React.ReactNode => {
  const time = normalizeTime(t);
  if (time.base === 0 && time.penalty !== 'DNF') return '-';
  
  if (time.penalty === 'DNF') {
    if (isMobile) {
      return <span className="text-red-500 font-bold">DNF</span>;
    }
    return <span className="text-red-400">({time.base > 0 ? time.base.toFixed(2) : '-'}) DNF</span>;
  }
  
  if (time.penalty === '+2') {
    if (isMobile) {
      return <span className="text-yellow-500 font-bold">{(time.base + 2).toFixed(2)}</span>;
    }
    return <span className="text-yellow-400">{time.base.toFixed(2)} +2 = {(time.base + 2).toFixed(2)}</span>;
  }
  
  return time.base.toFixed(2);
};

type Participant = {
  id: string;
  name: string;
  times: TimeRecord[];
  best: number;
  average: number;
};

type Round = {
  roundNumber: number;
  format: 'ao3' | 'ao5';
  participants: Participant[];
};

type Category = {
  id: string;
  name: string;
  rounds: Round[];
};

const ResultsWCA = () => {
  const { id, categoryName } = useParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [isMobileView, setIsMobileView] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingParticipant, setEditingParticipant] =
    useState<Participant | null>(null);
  const [tempTimes, setTempTimes] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [advancingCompetitors, setAdvancingCompetitors] = useState<
    {
      id: string;
      name: string;
      average: number;
      best: number;
    }[]
  >([]);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!id) return;
    db.tournaments.get(id).then(tournament => {
      if (!tournament) {
        console.warn('Torneo no encontrado con ID:', id);
        return;
      }

    const selectedCategories = tournament.categories.map((cat) => {
      const categoryRounds = (cat.rounds || [])
        .filter((round) => round.num && round.format) // Agregado
        .map((round) => {
          const participants = tournament.competitors
            .filter((comp) => (comp.categories || []).includes(cat.id as string))
            .map((comp) => {
              const result = (round.results || []).find(
                (r) => r.idCompetitor === comp.id,
              );
              const rawTimes = result?.times || [];
              const times = rawTimes.map(normalizeTime);
              const calculated = calculateRulesStats(times, round.format as 'ao3'|'ao5');
              const best = calculated.best;
              const average = result?.media && parseFloat(result.media) || calculated.average;

              return {
                id: comp.id as string, // <- ya no lo conviertes a número
                name: comp.name as string,
                times,
                best,
                average,
              };
            });

          return {
            roundNumber: round.num,
            format: round.format as 'ao3' | 'ao5',
            participants,
          };
        });

      return {
        id: cat.id as string,
        name: cat.name,
        rounds: categoryRounds,
      };
    });

    setCategories(selectedCategories);

    if (categoryName) {
      const found = selectedCategories.find(
        (c) => c.name.toLowerCase() === categoryName.toLowerCase(),
      );
      if (found) {
        setSelectedCategory(found.id);
        setSelectedRound(1);
        return;
      }
    }

    // Si no se encontró por nombre, selecciona la primera disponible
    if (selectedCategories.length > 0) {
      setSelectedCategory(selectedCategories[0].id);
      setSelectedRound(1);
    }
    }); // END THEN
  }, [id, categoryName]);

  useEffect(() => {
    if (!id || !selectedCategory || !selectedRound) return;
    
    db.tournaments.get(id).then(tournament => {
      if (!tournament) return;
      const category = tournament.categories.find((c: any) => c.id === selectedCategory);
      if (!category) return;
      const currentRoundObj = category.rounds.find((r: any) => r.num === selectedRound);
      if (!currentRoundObj) return;

      const participantsWithResults = (currentRoundObj.results || [])
        .map((result: any) => {
          const competitor = tournament.competitors.find(
            (c: any) => c.id === result.idCompetitor,
          );
          const loadedTimes = result.times.map(normalizeTime);
          const computed = calculateRulesStats(loadedTimes, currentRoundObj.format as 'ao3'|'ao5');
          return {
            id: result.idCompetitor,
            name: competitor?.name || '',
            average: parseFloat(result.media) || 0,
            best: computed.best > 0 ? computed.best : 0,
          };
        })
        .sort(sortWCA);

      const nextRoundNum = selectedRound + 1;
      const nextRound = category.rounds.find((r: any) => r.num === nextRoundNum);
      
      if (!nextRound) {
        setAdvancingCompetitors([]);
        return;
      }
      
      const competitorsToAdvance =
        String(currentRoundObj.competitorsToAdvance) === 'all' 
          ? participantsWithResults.length 
          : Number(currentRoundObj.competitorsToAdvance) || (currentRoundObj.format === 'ao5' ? 12 : 8);

      setAdvancingCompetitors(participantsWithResults.slice(0, competitorsToAdvance));
    });
  }, [id, selectedCategory, selectedRound]);

  const currentCategory = categories.find((c) => c.id.toString() === selectedCategory.toString());
  const currentRound = currentCategory?.rounds.find(
    (r) => Number(r.roundNumber) === Number(selectedRound),
  );

  // Calculate stats original removido, ya usamos calculateRulesStats()


  const startEditing = (participant: Participant) => {
    setEditingParticipant(participant);
    setTempTimes([...participant.times]);
  };

  const handleTimeChange = (index: number, value: string) => {
    // Validar formato decimal numérico positivo (Max 2 decimales)
    if (value !== '' && !/^\d*\.?\d{0,2}$/.test(value)) {
      setErrorMsg('⚠️ Formato incorrecto: Máximo 2 decimales permitidos (ej. 9.53).');
      setTimeout(() => setErrorMsg(''), 4000);
      return; // Ignora el cambio si tiene más de 2 decimales
    }
    setErrorMsg('');
    const newTimes = [...tempTimes];
    newTimes[index] = { ...newTimes[index], base: value }; // Almacenamos temporalmente como string
    setTempTimes(newTimes);
  };

  const handlePenaltyChange = (index: number, penalty: Penalty) => {
    const newTimes = [...tempTimes];
    // Si la misma penalidad ya estaba activa, la apagamos
    newTimes[index] = { ...newTimes[index], penalty: newTimes[index].penalty === penalty ? '' : penalty };
    setTempTimes(newTimes);
  };

  const saveChanges = async () => {
    if (!editingParticipant || !currentRound || !id || !selectedCategory)
      return;

    // Parsear el input string temporal a números antes de guardar y calcular estadísticas
    const parsedTimes = tempTimes.map(t => ({
      ...t,
      base: typeof t.base === 'string' ? parseFloat(t.base) || 0 : t.base || 0
    }));

    const { best, average } = calculateRulesStats(parsedTimes, currentRound.format);

    // Actualiza el estado local
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== selectedCategory) return cat;
        return {
          ...cat,
          rounds: cat.rounds.map((round) => {
            if (round.roundNumber !== selectedRound) return round;
            return {
              ...round,
              participants: round.participants.map((p) => {
                if (p.id !== editingParticipant.id) return p;
                return { ...p, times: parsedTimes, best, average };
              }),
            };
          }),
        };
      }),
    );

    // Actualiza Dexie
    const currentTournament = await db.tournaments.get(id);
    if (currentTournament) {
       const category = currentTournament.categories.find((c: any) => c.id === selectedCategory);
       if (category) {
         const round = category.rounds.find((r: any) => r.num === selectedRound);
         if (round) {
           if (!round.results) round.results = [];
           const existingIndex = round.results.findIndex((r: any) => r.idCompetitor === editingParticipant.id);
           const updatedResult = {
             idCompetitor: editingParticipant.id.toString(),
             times: tempTimes,
             media: average.toFixed(2),
           };
           if (existingIndex >= 0) {
             round.results[existingIndex] = updatedResult as any;
           } else {
             round.results.push(updatedResult as any);
           }
           await db.tournaments.put(currentTournament as any);
         }
       }
    }

    cancelEditing();
  };

  const cancelEditing = () => {
    setEditingParticipant(null);
    setTempTimes([]);
    setErrorMsg('');
  };

  const renderTimeCell = (
    participant: Participant,
    originalTime: any,
    index: number,
  ) => {
    if (editMode && editingParticipant?.id === participant.id) {
      const currentTime = tempTimes[index] || { base: 0, penalty: '' };
      return (
        <div className="flex flex-col sm:flex-row items-center gap-1 w-full justify-center">
          <input
            type="text"
            inputMode="decimal"
            value={currentTime.base === 0 && currentTime.base !== "0" ? '' : currentTime.base}
            onChange={(e) => handleTimeChange(index, e.target.value)}
            className="w-16 bg-gray-800 border border-blue-500 rounded px-1 py-1 text-center text-sm"
            placeholder="0.00"
          />
          <div className="flex sm:flex-col gap-1">
            <button 
              onClick={() => handlePenaltyChange(index, '+2')}
              className={`text-[10px] sm:text-[9px] px-1 py-0.5 rounded ${currentTime.penalty === '+2' ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-400'}`}
            >
              +2
            </button>
            <button 
              onClick={() => handlePenaltyChange(index, 'DNF')}
              className={`text-[10px] sm:text-[9px] px-1 py-0.5 rounded ${currentTime.penalty === 'DNF' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-400'}`}
            >
              DNF
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`w-full py-1 text-center ${
          editMode ? 'cursor-pointer hover:bg-gray-700' : ''
        }`}
        onClick={() => editMode && startEditing(participant)}
      >
        {formatTimeDisplay(originalTime, isMobileView)}
      </div>
    );
  };

  return (
    <div className="text-white p-4 md:p-6 lg:p-8">
      {/* Encabezado y controles */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <MdLeaderboard className="text-blue-400" /> Resultados
        </h2>

        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          {/* Botón de edición */}
          <button
            onClick={() => setEditMode(!editMode)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-2 ${
              editMode
                ? 'bg-yellow-600 hover:bg-yellow-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {editMode ? (
              <>
                <FaTimes /> Desactivar Edición
              </>
            ) : (
              <>
                <FaEdit /> Activar Edición
              </>
            )}
          </button>

          {/* Selectores */}
          <div className="flex flex-col md:flex-row gap-3 flex-1">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs sm:text-sm text-gray-400 mb-1 flex items-center gap-1">
                <MdCategory size={14} /> Categoría
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedRound(1);
                  cancelEditing();
                }}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={editMode && !!editingParticipant}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs sm:text-sm text-gray-400 mb-1 flex items-center gap-1">
                <MdOutlineTimer size={14} /> Ronda
              </label>
              <select
                value={selectedRound}
                onChange={(e) => {
                  setSelectedRound(parseInt(e.target.value));
                  cancelEditing();
                }}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={editMode && !!editingParticipant}
              >
                {currentCategory?.rounds.map((round) => (
                  <option key={round.roundNumber} value={round.roundNumber}>
                    Ronda {round.roundNumber} ({round.format.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Leyenda WCA */}
      <div className="flex flex-wrap gap-4 text-xs sm:text-sm text-gray-400 bg-gray-800/80 p-3 rounded-lg mb-4 items-center justify-center">
        <div className="flex items-center gap-1"><BsTrophyFill className="text-yellow-400" /> Best (Mejor)</div>
        <div className="flex items-center gap-1"><BsGraphUp className="text-green-400" /> Average (Promedio)</div>
        <div className="flex items-center gap-1"><span className="text-yellow-500 font-bold">+2</span> Penalización 2 seg</div>
        <div className="flex items-center gap-1"><span className="text-red-500 font-bold">DNF</span> Did Not Finish</div>
      </div>

      {/* Controles de edición activa */}
      {editMode && editingParticipant && (
        <div className="flex flex-col gap-3 mb-4 p-3 bg-gray-700 rounded-lg">
          <div className="flex flex-wrap gap-3 items-center">
            <span className="font-medium flex items-center gap-2">
              <FaInfoCircle className="text-yellow-400" /> Editando:{' '}
              {editingParticipant.name}
            </span>
            <div className="flex gap-2">
              <button
                onClick={saveChanges}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm flex items-center gap-2"
              >
                <FaSave /> Guardar
              </button>
              <button
                onClick={cancelEditing}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm flex items-center gap-2"
              >
                <FaTimes /> Cancelar
              </button>
            </div>
          </div>
          {errorMsg && (
            <div className="text-red-200 text-xs sm:text-sm font-semibold bg-red-900/50 p-2 rounded w-fit border border-red-500/50">
              {errorMsg}
            </div>
          )}
        </div>
      )}

      {/* Tabla de resultados */}
      {currentRound ? (
        <div className="overflow-x-auto">
          {isMobileView ? (
            // Vista móvil - Tarjetas
            <div className="space-y-3">
              {[...currentRound.participants]
                .sort(sortWCA)
                .map((participant) => (
                  <div
                    key={participant.id}
                    className={`bg-gray-750 rounded-lg p-3 ${
                      editMode ? 'border border-gray-600' : ''
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium truncate">
                        {participant.name}
                      </h3>
                      <div className="flex gap-2">
                        <span className="text-xs bg-blue-600 px-2 py-1 rounded flex items-center gap-1">
                          <BsTrophyFill size={10} />{' '}
                          {participant.best > 0
                            ? participant.best.toFixed(2)
                            : participant.best === -1 ? 'DNF' : '-'}
                        </span>
                        <span className="text-xs bg-green-600 px-2 py-1 rounded flex items-center gap-1">
                          <BsGraphUp size={10} />{' '}
                          {participant.average > 0
                            ? participant.average.toFixed(2)
                            : participant.average === -1 ? 'DNF' : '-'}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`grid ${
                        currentRound.format === 'ao5'
                          ? 'grid-cols-5'
                          : 'grid-cols-3'
                      } gap-2`}
                    >
                      {Array.from({
                        length: currentRound.format === 'ao5' ? 5 : 3,
                      }).map((_, index) => {
                        const time = participant.times[index] || { base: 0, penalty: '' };
                        return (
                          <div
                            key={index}
                            className="flex flex-col items-center"
                          >
                            <label className="text-xs text-gray-400 flex items-center gap-1">
                              <MdOutlineTimer size={10} /> T{index + 1}
                            </label>
                            {renderTimeCell(participant, time, index)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            // Vista de escritorio - Tabla
            <table className="w-full bg-gray-750 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-700">
                  {/* Columna Participante */}
                  <th className="px-4 py-3 text-left min-w-[180px] w-1/4">
                    <div className="flex items-center gap-2">
                      <MdPeople className="text-blue-400" />
                      <span>Participante</span>
                    </div>
                  </th>

                  {/* Columnas de tiempos */}
                  {Array.from({
                    length: currentRound.format === 'ao5' ? 5 : 3,
                  }).map((_, index) => (
                    <th
                      key={`time-header-${index}`}
                      className="px-2 py-3 text-center min-w-[80px]"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <MdOutlineTimer className="text-gray-300 mb-1" />
                        <span className="text-xs font-normal">
                          T{index + 1}
                        </span>
                      </div>
                    </th>
                  ))}

                  {/* Columna Best */}
                  <th className="px-3 py-3 text-center min-w-[100px]">
                    <div className="flex flex-col items-center justify-center">
                      <BsTrophyFill className="text-yellow-400 mb-1" />
                      <span className="text-xs font-normal">Best</span>
                    </div>
                  </th>

                  {/* Columna Avg */}
                  <th className="px-3 py-3 text-center min-w-[100px]">
                    <div className="flex flex-col items-center justify-center">
                      <BsGraphUp className="text-green-400 mb-1" />
                      <span className="text-xs font-normal">Avg</span>
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody>
                {[...currentRound.participants]
                  .sort(sortWCA)
                  .map((participant) => (
                    <tr
                      key={participant.id}
                      className={`border-b border-gray-700 ${
                        editMode ? 'hover:bg-gray-700/50' : ''
                      }`}
                    >
                      {/* Nombre del participante */}
                      <td className="px-4 py-3 truncate max-w-[180px] font-medium">
                        {participant.name}
                      </td>

                      {/* Tiempos */}
                      {Array.from({
                        length: currentRound.format === 'ao5' ? 5 : 3,
                      }).map((_, index) => {
                        const time = participant.times[index] || { base: 0, penalty: '' };
                        return (
                          <td key={index} className="px-2 py-3">
                            {renderTimeCell(participant, time, index)}
                          </td>
                        );
                      })}

                      {/* Mejor tiempo */}
                      <td className="px-3 py-3 text-center font-medium text-blue-400">
                        {participant.best > 0
                          ? participant.best.toFixed(2)
                          : participant.best === -1 ? 'DNF' : '-'}
                      </td>

                      {/* Promedio */}
                      <td className="px-3 py-3 text-center font-medium text-green-400">
                        {participant.average > 0
                          ? participant.average.toFixed(2)
                          : participant.average === -1 ? 'DNF' : '-'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400 flex flex-col items-center gap-2">
          <FaInfoCircle size={24} />
          No hay datos disponibles para mostrar
        </div>
      )}

      {/* Notificación del modo edición */}
      {editMode && !editingParticipant && (
        <div className="fixed bottom-4 right-4 bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in flex items-center gap-2">
          <FaEdit /> Modo edición activado
        </div>
      )}

      {/* Footer Area */}
      <div className="mt-12 pt-6 border-t border-gray-700 pb-8">
        <div className="bg-gray-800/50 rounded-lg p-5 mb-6 text-sm text-gray-400">
          <h4 className="font-semibold text-gray-300 mb-2">💡 ¿Cómo funciona esta sección?</h4>
          <p>
            En esta sección registras y consolidas los tiempos obtenidos por los competidores en cada ronda. 
            Utiliza el botón <strong>Activar edición</strong> para insertar o editar, presiona la celda del tiempo directamente para editar. Asegúrate de registrar los tiempos correctamente (en segundos y con hasta dos decimales).
            Utiliza los botones de penalización "+2" y "DNF" según el reglamento competitivo. Los promedios oficiales y sus respectivos descartes de peores y mejores tiempos se calcularán automáticamente.
          </p>
        </div>
        <div className="text-center text-xs text-gray-500">
          © 2026 ruTournament - Sebastian Daza Pérez
        </div>
      </div>

    </div>
  );
};

export default ResultsWCA;
