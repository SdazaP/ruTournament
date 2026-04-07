import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../../common/db';

import { BsTrophyFill, BsGraphUp } from 'react-icons/bs';
import { calculateRulesStats, normalizeTime, formatTimeDisplay, sortWCA, formatSecondsToDisplay } from '../ResultsWCA';
import { TimeRecord } from '../../../common/db';

type Participant = {
  id: string;
  name: string;
  times: TimeRecord[];
  best: number;
  average: number;
  ranking?: number;
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

const ResultsViewWCA = () => {
  const { id, categoryId } = useParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [isMobileView, setIsMobileView] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cargar datos del torneo
  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    db.tournaments.get(id).then(tournament => {
      if (!tournament) {
        setLoading(false);
        return;
      }

      const loadedCategories: Category[] = tournament.categories.map((category: any) => {
        const rounds: Round[] = (category.rounds || []).map((round: any) => {
          const participants: Participant[] = tournament.competitors
            .filter((comp: any) => (comp.categories || []).includes(category.id as string))
            .map((comp: any) => {
              const result = (round.results || []).find((r: any) => r.idCompetitor === comp.id);
              
              const rawTimes = result?.times || [];
              const times = rawTimes.map(normalizeTime);
              const computed = calculateRulesStats(times, round.format as 'ao3'|'ao5');
              
              const best = computed.best;
              const average = result?.media ? parseFloat(result.media) : computed.average;

              return {
                id: comp.id as string,
                name: comp.name as string,
                times,
                best,
                average
              };
            });

          return {
            roundNumber: round.num,
            format: round.format as 'ao3' | 'ao5',
            participants: participants.sort(sortWCA)
              .map((p, i) => ({ ...p, ranking: i + 1 }))
          };
        });

        return {
          id: category.id as string,
          name: category.name as string,
          rounds
        };
      });

      setCategories(loadedCategories);
      
      // Seleccionar categoría automáticamente
      if (categoryId) {
        const found = loadedCategories.find(
          c => c.id.toString() === categoryId.toString()
        );
        if (found) {
          setSelectedCategory(found.id);
        }
      } else if (loadedCategories.length > 0) {
        setSelectedCategory(loadedCategories[0].id);
      }
      
      setLoading(false);
    });
  }, [id, categoryId]);

  // Detectar tamaño de pantalla
  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Obtener datos actuales
  const currentCategory = categories.find(c => c.id.toString() === selectedCategory.toString());
  const currentRound = currentCategory?.rounds.find(r => Number(r.roundNumber) === Number(selectedRound));
  const sortedParticipants = currentRound?.participants;

  if (loading) {
    return (
      <div className="text-white p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p>Cargando resultados...</p>
      </div>
    );
  }

  return (
    <div className="text-white p-4 md:p-6 lg:p-8 min-h-screen">
      <header className="mb-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Resultados Oficiales</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Consulta los resultados de cada categoría y ronda del torneo
        </p>
      </header>

      {/* Selectores */}
      <div className="max-w-4xl mx-auto bg-gray-800 rounded-xl p-4 mb-8 shadow-lg">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Selector de categoría */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-1">Categoría</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedRound(1);
              }}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de ronda */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-1">Ronda</label>
            <select
              value={selectedRound}
              onChange={(e) => setSelectedRound(parseInt(e.target.value))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              disabled={!currentCategory}
            >
              {currentCategory?.rounds.map((round) => (
                <option key={round.roundNumber} value={round.roundNumber}>
                  {round.roundNumber === 1 ? 'Primera Ronda' : 
                   round.roundNumber === 2 ? 'Segunda Ronda' : 
                   `Ronda ${round.roundNumber}`} ({round.format.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Resultados */}
      <div className="max-w-6xl mx-auto">
        {/* Leyenda WCA */}
        <div className="flex flex-wrap gap-4 text-xs sm:text-sm text-gray-400 bg-gray-800 p-3 rounded-lg mb-4 items-center justify-center">
          <div className="flex items-center gap-1"><BsTrophyFill className="text-yellow-400" /> Best (Mejor)</div>
          <div className="flex items-center gap-1"><BsGraphUp className="text-green-400" /> Average (Promedio)</div>
          <div className="flex items-center gap-1"><span className="text-yellow-500 font-bold">+2</span> Penalización 2 seg</div>
          <div className="flex items-center gap-1"><span className="text-red-500 font-bold">DNF</span> Did Not Finish</div>
        </div>

        {currentRound && sortedParticipants ? (
          <div className="bg-gray-800 rounded-xl overflow-hidden shadow-lg">
            {isMobileView ? (
              // Vista móvil - Tarjetas
              <div className="space-y-3 p-3">
                {sortedParticipants.map((participant) => (
                  <div 
                    key={participant.id} 
                    className={`bg-gray-750 rounded-lg p-4 border-l-4 ${
                      participant.ranking === 1 ? 'border-yellow-500' :
                      participant.ranking === 2 ? 'border-gray-400' :
                      participant.ranking === 3 ? 'border-amber-700' : 'border-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center">
                        {participant.ranking && (
                          <span className={`mr-3 w-6 h-6 flex items-center justify-center rounded-full text-sm font-bold ${
                            participant.ranking === 1 ? 'bg-yellow-500 text-gray-900' :
                            participant.ranking === 2 ? 'bg-gray-400 text-gray-900' :
                            participant.ranking === 3 ? 'bg-amber-700 text-white' : 'bg-gray-700 text-gray-300'
                          }`}>
                            {participant.ranking}
                          </span>
                        )}
                        <h3 className="font-medium truncate">{participant.name}</h3>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-xs bg-blue-600 px-2 py-1 rounded">
                          Best: {participant.best > 0 ? formatSecondsToDisplay(participant.best) : participant.best === -1 ? 'DNF' : '-'}
                        </span>
                        <span className="text-xs bg-green-600 px-2 py-1 rounded">
                          Avg: {participant.average > 0 ? formatSecondsToDisplay(participant.average) : participant.average === -1 ? 'DNF' : '-'}
                        </span>
                      </div>
                    </div>
                    
                    <div className={`grid ${currentRound.format === 'ao5' ? 'grid-cols-5' : 'grid-cols-3'} gap-2`}>
                      {Array.from({ length: currentRound.format === 'ao5' ? 5 : 3 }).map((_, index) => {
                        const time = participant.times[index] || { base: 0, penalty: '' };
                        const nt = normalizeTime(time);
                        const isDnf = nt.penalty === 'DNF';
                        const val = isDnf || (nt.base <= 0 && nt.penalty !== 'DNF') ? -1 : nt.base + (nt.penalty === '+2' ? 2 : 0);
                        const bestHighlight = val === participant.best && val > 0;

                        return (
                          <div key={index} className="flex flex-col items-center">
                            <label className="text-xs text-gray-400">T{index + 1}</label>
                            <div className={`w-full text-center py-1 rounded text-sm ${
                              bestHighlight ? 'bg-green-900/50 text-green-300' : 
                              isDnf ? 'bg-red-900/50 text-red-300' : 'bg-gray-700 text-gray-300'
                            }`}>
                              {formatTimeDisplay(time, true)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Vista escritorio - Tabla
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="px-4 py-3 text-left w-12">#</th>
                    <th className="px-4 py-3 text-left">Participante</th>
                    {currentRound.format === 'ao5' && (
                      <>
                        <th className="px-2 py-3 text-center">T1</th>
                        <th className="px-2 py-3 text-center">T2</th>
                        <th className="px-2 py-3 text-center">T3</th>
                        <th className="px-2 py-3 text-center">T4</th>
                        <th className="px-2 py-3 text-center">T5</th>
                      </>
                    )}
                    {currentRound.format === 'ao3' && (
                      <>
                        <th className="px-2 py-3 text-center">T1</th>
                        <th className="px-2 py-3 text-center">T2</th>
                        <th className="px-2 py-3 text-center">T3</th>
                      </>
                    )}
                    <th className="px-3 py-3 text-center">Best</th>
                    <th className="px-3 py-3 text-center">Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedParticipants.map((participant) => (
                    <tr 
                      key={participant.id} 
                      className="border-b border-gray-700 hover:bg-gray-750/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-center font-medium">
                        {participant.ranking ? (
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm ${
                            participant.ranking === 1 ? 'bg-yellow-500 text-gray-900' :
                            participant.ranking === 2 ? 'bg-gray-400 text-gray-900' :
                            participant.ranking === 3 ? 'bg-amber-700 text-white' : 'text-gray-400'
                          }`}>
                            {participant.ranking}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 font-medium">{participant.name}</td>
                      {Array.from({ length: currentRound.format === 'ao5' ? 5 : 3 }).map((_, index) => {
                        const time = participant.times[index] || { base: 0, penalty: '' };
                        const nt = normalizeTime(time);
                        const isDnf = nt.penalty === 'DNF';
                        const val = isDnf || (nt.base <= 0 && nt.penalty !== 'DNF') ? -1 : nt.base + (nt.penalty === '+2' ? 2 : 0);
                        const bestHighlight = val === participant.best && val > 0;

                        return (
                          <td 
                            key={index} 
                            className={`px-2 py-3 text-center ${
                              bestHighlight ? 'text-green-400 font-bold' : 
                              isDnf ? 'text-red-400' : 'text-gray-300'
                            }`}
                          >
                            {formatTimeDisplay(time, false)}
                          </td>
                        );
                      })}
                      <td className="px-3 py-3 text-center font-bold text-blue-400">
                        {participant.best > 0 ? formatSecondsToDisplay(participant.best) : participant.best === -1 ? 'DNF' : '-'}
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-green-400">
                        {participant.average > 0 ? formatSecondsToDisplay(participant.average) : participant.average === -1 ? 'DNF' : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-800 rounded-xl">
            <div className="text-gray-400 mb-4">No hay datos disponibles para esta ronda</div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Pie de página */}
      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>Resultados oficiales según el formato WCA</p>
        <p className="mt-1">© {new Date().getFullYear()} ruTournament - Sebastian Daza Pérez</p>
      </footer>
    </div>
  );
};

export default ResultsViewWCA;