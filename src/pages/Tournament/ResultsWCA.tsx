import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../common/db';
import { FaEdit, FaSave, FaTimes, FaInfoCircle, FaLock, FaUsers, FaLayerGroup } from 'react-icons/fa';
import { useTournamentStatus } from '../../hooks/useTournamentStatus';
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
    return { ...t, base: Number(t.base) || 0 } as TimeRecord;
  }
  if (typeof t === 'number') {
    return { base: t > 0 ? t : 0, penalty: t < 0 ? 'DNF' : '' };
  }
  if (typeof t === 'string' && !isNaN(Number(t))) {
    const num = Number(t);
    return { base: num > 0 ? num : 0, penalty: num < 0 ? 'DNF' : '' };
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
    best: best > 0 ? Math.round(best * 100) / 100 : -1, 
    average: average > 0 ? Math.round(average * 100) / 100 : -1 
  };
};

export const sortWCA = (a: any, b: any) => {
  const getWeight = (avg: number) => {
    if (avg > 0) return 1;
    if (avg === -1) return 2;
    return 3;
  };

  const weightA = getWeight(a.average);
  const weightB = getWeight(b.average);

  if (weightA !== weightB) return weightA - weightB;

  if (weightA === 1) {
    if (a.average !== b.average) return a.average - b.average;
    const bestA = a.best > 0 ? a.best : Infinity;
    const bestB = b.best > 0 ? b.best : Infinity;
    return bestA - bestB;
  }

  const bestA = a.best > 0 ? a.best : (a.best === -1 ? Infinity - 1 : Infinity);
  const bestB = b.best > 0 ? b.best : (b.best === -1 ? Infinity - 1 : Infinity);
  if (bestA !== bestB) return bestA - bestB;

  return a.name?.localeCompare(b.name || '');
};

export const parseTimeToSeconds = (val: string | number): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  if (typeof val === 'string' && val.includes(':')) {
    const parts = val.split(':');
    const m = parseInt(parts[0], 10) || 0;
    const s = parseFloat(parts[1]) || 0;
    return m * 60 + s;
  }
  return parseFloat(val) || 0;
};

export const formatSecondsToDisplay = (seconds: number): string => {
  if (typeof seconds !== 'number' || isNaN(seconds)) return '-';
  if (seconds < 60) return seconds.toFixed(2);
  const m = Math.floor(seconds / 60);
  const s = seconds - m * 60;
  return `${m}:${s < 10 ? '0' : ''}${s.toFixed(2)}`;
};

export const formatTimeDisplay = (t: any, isMobile: boolean = false): React.ReactNode => {
  const time = normalizeTime(t);
  if (time.base === 0 && time.penalty !== 'DNF') return '-';
  
  if (time.penalty === 'DNF') {
    if (isMobile) {
      return <span className="text-red-600 dark:text-red-500 font-bold">DNF</span>;
    }
    return <span className="text-red-600 dark:text-red-400">({time.base > 0 ? formatSecondsToDisplay(time.base) : '-'}) DNF</span>;
  }
  
  if (time.penalty === '+2') {
    if (isMobile) {
      return <span className="text-yellow-600 dark:text-yellow-500 font-bold">{formatSecondsToDisplay(time.base + 2)}</span>;
    }
    return <span className="text-yellow-700 dark:text-yellow-400">{formatSecondsToDisplay(time.base)} +2 = {formatSecondsToDisplay(time.base + 2)}</span>;
  }
  
  return formatSecondsToDisplay(time.base);
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
  const { canUploadResults, status } = useTournamentStatus(id);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [isMobileView, setIsMobileView] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingParticipant, setEditingParticipant] =
    useState<Participant | null>(null);
  const [tempTimes, setTempTimes] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [dataVersion, setDataVersion] = useState(0);
  const prevId = useRef<string | undefined>(undefined);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!id) return;
    const idChanged = prevId.current !== id;
    prevId.current = id;
    db.tournaments.get(id).then(tournament => {
      if (!tournament) {
        console.warn('Torneo no encontrado con ID:', id);
        return;
      }

      const selectedCategories = tournament.categories
        .filter((cat) => !cat.format || cat.format === 'wca')
        .map((cat) => {
          const categoryRounds = (cat.rounds || [])
            .filter((round) => round.num && round.format)
            .map((round, _, allRounds) => {
              let allowedIds: string[] | null = null;
              
              if (round.num > 1) {
                const prevRound = allRounds.find((r: any) => r.num === round.num - 1);
                if (prevRound && prevRound.results) {
                  const prevResultsWithStats = (prevRound.results || []).map((res: any) => {
                    const loadedTimes = (res.times || []).map(normalizeTime);
                    const computed = calculateRulesStats(loadedTimes, prevRound.format as 'ao3'|'ao5');
                    return {
                      id: res.idCompetitor,
                      name: '',
                      average: parseFloat(res.media) || 0,
                      best: computed.best > 0 ? computed.best : 0,
                    };
                  }).sort(sortWCA);
                  
                  const cToAdvance = String(prevRound.competitorsToAdvance) === 'all' 
                    ? prevResultsWithStats.length 
                    : Number(prevRound.competitorsToAdvance) || (prevRound.format === 'ao5' ? 12 : 8);
                    
                  allowedIds = prevResultsWithStats.slice(0, cToAdvance).map((r: any) => r.id);
                } else {
                  allowedIds = [];
                }
              }

              const participants = tournament.competitors
                .filter((comp) => {
                  if (!(comp.categories || []).includes(cat.id as string)) return false;
                  if (allowedIds !== null && !allowedIds.includes(comp.id as string)) return false;
                  return true;
                })
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
                    id: comp.id as string,
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

      if (idChanged) {
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

        if (selectedCategories.length > 0) {
          setSelectedCategory(selectedCategories[0].id);
          setSelectedRound(1);
        }
      }
    });
  }, [id, categoryName, dataVersion]);

  useEffect(() => {
    if (!id || !selectedCategory || !selectedRound) return;
    
    db.tournaments.get(id).then(tournament => {
      if (!tournament) return;
      const category = tournament.categories.find((c: any) => c.id === selectedCategory);
      if (!category) return;
      const currentRoundObj = category.rounds.find((r: any) => r.num === selectedRound);
      if (!currentRoundObj) return;
    });
  }, [id, selectedCategory, selectedRound]);

  const currentCategory = categories.find((c) => c.id.toString() === selectedCategory.toString());
  const currentRound = currentCategory?.rounds.find(
    (r) => Number(r.roundNumber) === Number(selectedRound),
  );

  const startEditing = (participant: Participant) => {
    setEditingParticipant(participant);
    setTempTimes([...participant.times]);
  };

  const handleTimeChange = (index: number, value: string) => {
    if (value !== '' && !/^(\d+:)?\d*\.?\d{0,2}$/.test(value)) {
      setErrorMsg('⚠️ Formato incorrecto: Usa SS.CC o M:SS.CC (ej. 1:07.78 o 9.53).');
      setTimeout(() => setErrorMsg(''), 4000);
      return; 
    }
    setErrorMsg('');
    const newTimes = [...tempTimes];
    newTimes[index] = { ...newTimes[index], base: value };
    setTempTimes(newTimes);
  };

  const handleTimeBlur = (index: number, value: string) => {
    if (!value || value.includes('.') || value.includes(':')) return;
    
    let formatted = value;
    const len = value.length;
    
    if (len <= 2) {
      formatted = (parseInt(value, 10) / 100).toFixed(2);
    } else if (len === 3 || len === 4) {
      const centis = value.slice(-2);
      const secs = parseInt(value.slice(0, -2), 10);
      formatted = `${secs}.${centis}`;
    } else if (len >= 5) {
      const centis = value.slice(-2);
      const secs = value.slice(-4, -2).padStart(2, '0');
      const mins = parseInt(value.slice(0, -4), 10);
      formatted = `${mins}:${secs}.${centis}`;
    }

    const newTimes = [...tempTimes];
    newTimes[index] = { ...newTimes[index], base: formatted };
    setTempTimes(newTimes);
  };

  const handlePenaltyChange = (index: number, penalty: Penalty) => {
    const newTimes = [...tempTimes];
    newTimes[index] = { ...newTimes[index], penalty: newTimes[index].penalty === penalty ? '' : penalty };
    setTempTimes(newTimes);
  };

  const saveChanges = async (shouldCancel: boolean = true) => {
    if (!editingParticipant || !currentRound || !id || !selectedCategory)
      return;

    const parsedTimes = tempTimes.map(t => ({
      ...t,
      base: parseTimeToSeconds(t.base)
    }));

    const { best, average } = calculateRulesStats(parsedTimes, currentRound.format);

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
            times: parsedTimes,
            media: average.toFixed(2),
          };
          if (existingIndex >= 0) {
            round.results[existingIndex] = updatedResult as any;
          } else {
            round.results.push(updatedResult as any);
          }
          await db.tournaments.put(currentTournament as any);
          setDataVersion(v => v + 1);
        }
      }
    }

    if (shouldCancel) {
      cancelEditing();
    }
  };

  const handleRowClick = async (participant: Participant) => {
    if (!editMode) return;
    if (editingParticipant && editingParticipant.id !== participant.id) {
      await saveChanges(false);
    }
    startEditing(participant);
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
            onBlur={(e) => handleTimeBlur(index, e.target.value)}
            className="w-16 bg-white text-gray-900 dark:bg-gray-800 dark:text-white border border-blue-500 rounded px-1 py-1 text-center text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="0.00"
          />
          <div className="flex sm:flex-col gap-1">
            <button 
              onClick={() => handlePenaltyChange(index, '+2')}
              tabIndex={-1}
              className={`text-[10px] sm:text-[9px] px-1 py-0.5 rounded ${
                currentTime.penalty === '+2'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              +2
            </button>
            <button 
              onClick={() => handlePenaltyChange(index, 'DNF')}
              tabIndex={-1}
              className={`text-[10px] sm:text-[9px] px-1 py-0.5 rounded ${
                currentTime.penalty === 'DNF'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              DNF
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`w-full py-1 text-center rounded ${
          editMode ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : ''
        }`}
        onClick={() => handleRowClick(participant)}
      >
        {formatTimeDisplay(originalTime, isMobileView)}
      </div>
    );
  };

  return (
    <div className="text-gray-900 dark:text-white p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <MdLeaderboard className="text-blue-500 dark:text-blue-400" /> Resultados
        </h2>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={() => canUploadResults && setEditMode(!editMode)}
            disabled={!canUploadResults}
            title={!canUploadResults ? `El torneo está en estado "${status}" — no se pueden cargar resultados.` : ''}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-2 ${
              !canUploadResults
                ? 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300 opacity-60 cursor-not-allowed border border-gray-300 dark:border-gray-600'
                : editMode
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {!canUploadResults ? <FaLock /> : editMode ? <FaTimes /> : <FaEdit />}
            {!canUploadResults ? 'Bloqueado' : editMode ? 'Desactivar Edición' : 'Activar Edición'}
          </button>

          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
                <MdCategory size={14} /> Categoría
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedRound(1);
                  cancelEditing();
                }}
                className="w-full bg-white text-gray-900 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
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
              <label className="block text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
                <MdOutlineTimer size={14} /> Ronda
              </label>
              <select
                value={selectedRound}
                onChange={(e) => {
                  setSelectedRound(parseInt(e.target.value));
                  cancelEditing();
                }}
                className="w-full bg-white text-gray-900 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
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

      {currentCategory && currentRound && (
        <div className="mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg p-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
          <span className="flex items-center gap-1.5">
            <FaUsers className="text-blue-500 dark:text-blue-400" size={14} />
            <strong className="text-gray-900 dark:text-white">{currentRound.participants.length}</strong> competidores
          </span>
          <span className="text-gray-400 dark:text-gray-600">|</span>
          <span className="flex items-center gap-1.5">
            <MdOutlineTimer className="text-blue-500 dark:text-blue-400" size={14} />
            Formato: <strong className="text-gray-900 dark:text-white">{currentRound.format.toUpperCase()}</strong>
          </span>
          <span className="text-gray-400 dark:text-gray-600">|</span>
          <span className="flex items-center gap-1.5">
            <FaLayerGroup className="text-blue-500 dark:text-blue-400" size={14} />
            Ronda {currentRound.roundNumber} de {currentCategory.rounds.length}
          </span>
          {currentRound.competitorsToAdvance !== 'all' && currentRound.competitorsToAdvance > 0 && currentRound.roundNumber < currentCategory.rounds.length && (
            <>
              <span className="text-gray-400 dark:text-gray-600">|</span>
              <span>Avanzan <strong className="text-gray-900 dark:text-white">{currentRound.competitorsToAdvance}</strong></span>
            </>
          )}
        </div>
      )}

      {!canUploadResults && (
        <div className="mb-4 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 flex items-center gap-3 text-gray-700 dark:text-gray-300 text-sm">
          <FaLock className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
          <span>
            {status === 'finalizado'
              ? <><strong className="text-gray-900 dark:text-white">Torneo Finalizado.</strong> Los resultados son de solo lectura. Para modificarlos, reactiva el torneo desde el Panel.</>
              : <><strong className="text-gray-900 dark:text-white">Torneo Próximamente.</strong> La carga de resultados está deshabilitada. Actívalo desde el Panel para permitir modificaciones.</>
            }
          </span>
        </div>
      )}

      <div className="flex flex-wrap gap-4 text-xs sm:text-sm text-gray-700 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg mb-4 items-center justify-center">
        <div className="flex items-center gap-1"><BsTrophyFill className="text-yellow-500 dark:text-yellow-400" /> Best (Mejor)</div>
        <div className="flex items-center gap-1"><BsGraphUp className="text-green-500 dark:text-green-400" /> Average (Promedio)</div>
        <div className="flex items-center gap-1"><span className="text-yellow-600 dark:text-yellow-500 font-bold">+2</span> Penalización 2 seg</div>
        <div className="flex items-center gap-1"><span className="text-red-600 dark:text-red-500 font-bold">DNF</span> Did Not Finish</div>
      </div>

      {editMode && editingParticipant && (
        <div className="flex flex-col gap-3 mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex flex-wrap gap-3 items-center">
            <span className="font-medium flex items-center gap-2 text-gray-900 dark:text-white">
              <FaInfoCircle className="text-yellow-500 dark:text-yellow-400" /> Editando: {editingParticipant.name}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => saveChanges(true)}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm flex items-center gap-2"
              >
                <FaSave /> Guardar
              </button>
              <button
                onClick={cancelEditing}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm flex items-center gap-2"
              >
                <FaTimes /> Cancelar
              </button>
            </div>
          </div>
          {errorMsg && (
            <div className="text-red-700 dark:text-red-200 text-xs sm:text-sm font-semibold bg-red-100 dark:bg-red-900/50 p-2 rounded w-fit border border-red-300 dark:border-red-500/50">
              {errorMsg}
            </div>
          )}
        </div>
      )}

      {currentRound ? (
        <div className="overflow-x-auto">
          {isMobileView ? (
            <div className="space-y-3">
              {[...currentRound.participants]
                .sort(sortWCA)
                .map((participant) => (
                  <div
                    key={participant.id}
                    className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 ${
                      editMode ? 'shadow-sm' : ''
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2 gap-3">
                      <h3 className="font-medium truncate text-gray-900 dark:text-white">
                        {participant.name}
                      </h3>
                      <div className="flex gap-2">
                        <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded flex items-center gap-1">
                          <BsTrophyFill size={10} />
                          {participant.best > 0
                            ? formatSecondsToDisplay(participant.best)
                            : participant.best === -1 ? 'DNF' : '-'}
                        </span>
                        <span className="text-xs bg-green-600 text-white px-2 py-1 rounded flex items-center gap-1">
                          <BsGraphUp size={10} />
                          {participant.average > 0
                            ? formatSecondsToDisplay(participant.average)
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
                            <label className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
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
            <table className="w-full bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white">
                  <th className="px-4 py-3 text-left min-w-[180px] w-1/4">
                    <div className="flex items-center gap-2">
                      <MdPeople className="text-blue-500 dark:text-blue-400" />
                      <span>Competidor</span>
                    </div>
                  </th>

                  {Array.from({
                    length: currentRound.format === 'ao5' ? 5 : 3,
                  }).map((_, index) => (
                    <th
                      key={`time-header-${index}`}
                      className="px-2 py-3 text-center min-w-[80px]"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <MdOutlineTimer className="text-gray-500 dark:text-gray-300 mb-1" />
                        <span className="text-xs font-normal">
                          T{index + 1}
                        </span>
                      </div>
                    </th>
                  ))}

                  <th className="px-3 py-3 text-center min-w-[100px]">
                    <div className="flex flex-col items-center justify-center">
                      <BsTrophyFill className="text-yellow-500 dark:text-yellow-400 mb-1" />
                      <span className="text-xs font-normal">Best</span>
                    </div>
                  </th>

                  <th className="px-3 py-3 text-center min-w-[100px]">
                    <div className="flex flex-col items-center justify-center">
                      <BsGraphUp className="text-green-500 dark:text-green-400 mb-1" />
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
                      className={`border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white ${
                        editMode ? 'hover:bg-gray-100 dark:hover:bg-gray-700' : ''
                      }`}
                    >
                      <td className="px-4 py-3 truncate max-w-[180px] font-medium">
                        {participant.name}
                      </td>

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

                      <td className="px-3 py-3 text-center font-medium text-blue-600 dark:text-blue-400">
                        {participant.best > 0
                          ? formatSecondsToDisplay(participant.best)
                          : participant.best === -1 ? 'DNF' : '-'}
                      </td>

                      <td className="px-3 py-3 text-center font-medium text-green-600 dark:text-green-400">
                        {participant.average > 0
                          ? formatSecondsToDisplay(participant.average)
                          : participant.average === -1 ? 'DNF' : '-'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 flex flex-col items-center gap-2">
          <FaInfoCircle size={24} />
          No hay datos disponibles para mostrar
        </div>
      )}

      {editMode && !editingParticipant && (
        <div className="fixed bottom-4 right-4 bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in flex items-center gap-2">
          <FaEdit /> Modo edición activado
        </div>
      )}

      <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700 pb-8">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-5 mb-6 text-sm text-gray-700 dark:text-gray-400">
          <h4 className="font-semibold text-gray-900 dark:text-gray-300 mb-2">💡 ¿Cómo funciona esta sección?</h4>
          <p>
            En esta sección registras y consolidas los tiempos obtenidos por los competidores en cada ronda.
            Utiliza el botón <strong>Activar edición</strong> para insertar o editar, presiona la celda del tiempo directamente para editar.
            El sistema soporta el estándar oficial de teclado WCA (Smart Input): Si omites los símbolos de formato y escribes "987", se procesará automáticamente como "9.87". Si escribes "55678", se procesará como "5:56.78".
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