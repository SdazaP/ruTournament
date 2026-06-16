import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../../common/db';

import { BsTrophyFill, BsGraphUp } from 'react-icons/bs';
import { FaUsers, FaLayerGroup } from 'react-icons/fa';
import { MdOutlineTimer } from 'react-icons/md';
import {
  calculateRulesStats,
  normalizeTime,
  formatTimeDisplay,
  sortWCA,
  formatSecondsToDisplay,
} from '../ResultsWCA';
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
  isFinal?: boolean;
  participants: Participant[];
};

type Category = {
  id: string;
  name: string;
  rounds: Round[];
};

const ResultsViewWCA = ({ initialCategoryId }: { initialCategoryId?: string }) => {
  const { id, categoryId: paramCategoryId } = useParams();
  const categoryId = initialCategoryId || paramCategoryId;
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [isMobileView, setIsMobileView] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    db.tournaments.get(id).then((tournament) => {
      if (!tournament) {
        setLoading(false);
        return;
      }

      const loadedCategories: Category[] = tournament.categories
        .filter((c: any) => !c.format || c.format === 'wca')
        .map((category: any) => {
          const rounds: Round[] = (category.rounds || []).map((round: any, _: any, allRounds: any[]) => {
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

            const participants: Participant[] = tournament.competitors
              .filter((comp: any) => {
                if (!(comp.categories || []).includes(category.id as string)) return false;
                if (allowedIds !== null && !allowedIds.includes(comp.id as string)) return false;
                return true;
              })
              .map((comp: any) => {
                const result = (round.results || []).find(
                  (r: any) => r.idCompetitor === comp.id
                );

                const rawTimes = result?.times || [];
                const times = rawTimes.map(normalizeTime);
                const computed = calculateRulesStats(
                  times,
                  round.format as 'ao3' | 'ao5'
                );

                const best = computed.best;
                const average = result?.media
                  ? parseFloat(result.media)
                  : computed.average;

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
              isFinal: round.isFinal,
              participants: participants
                .sort(sortWCA)
                .map((p, i) => ({ ...p, ranking: i + 1 })),
            };
          });

          return {
            id: category.id as string,
            name: category.name as string,
            rounds,
          };
        });

      setCategories(loadedCategories);

      if (categoryId) {
        const found = loadedCategories.find(
          (c) => c.id.toString() === categoryId.toString()
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

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const currentCategory = categories.find(
    (c) => c.id.toString() === selectedCategory.toString()
  );
  const currentRound = currentCategory?.rounds.find(
    (r) => Number(r.roundNumber) === Number(selectedRound)
  );
  const sortedParticipants = currentRound?.participants;

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-700 dark:text-gray-200">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
        <p>Cargando resultados...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 text-gray-900 dark:text-gray-100 md:p-6 lg:p-8">
      <header className="mb-8 text-center">
        <h1 className="mb-2 flex items-center justify-center gap-2 text-2xl font-bold sm:text-3xl text-gray-900 dark:text-gray-100">
          <BsGraphUp className="text-blue-600 dark:text-blue-400" /> Resultados Oficiales
        </h1>
        <p className="mx-auto max-w-2xl text-gray-600 dark:text-gray-400">
          Consulta los resultados de cada categoría y ronda del torneo
        </p>
      </header>

      <div className="mx-auto mb-8 max-w-4xl rounded-xl bg-white p-4 shadow-lg dark:bg-gray-800">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Categoría
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedRound(1);
              }}
              className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2 text-sm text-gray-900 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Ronda
            </label>
            <select
              value={selectedRound}
              onChange={(e) => setSelectedRound(parseInt(e.target.value))}
              className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2 text-sm text-gray-900 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              disabled={!currentCategory}
            >
              {currentCategory?.rounds.map((round) => (
                <option key={round.roundNumber} value={round.roundNumber}>
                  {round.isFinal
                    ? 'Final'
                    : round.roundNumber === 1
                    ? 'Primera Ronda'
                    : round.roundNumber === 2
                    ? 'Segunda Ronda'
                    : `Ronda ${round.roundNumber}`}{' '}
                  ({round.format.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {currentCategory && currentRound && (
        <div className="mx-auto mb-4 flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-1 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
          <span className="flex items-center gap-1.5">
            <FaUsers className="text-blue-600 dark:text-blue-400" size={14} />
            <strong className="text-gray-900 dark:text-gray-100">
              {currentRound.participants.length}
            </strong>{' '}
            competidores
          </span>
          <span className="text-gray-400 dark:text-gray-500">|</span>
          <span className="flex items-center gap-1.5">
            <MdOutlineTimer className="text-blue-600 dark:text-blue-400" size={14} />
            Formato:{' '}
            <strong className="text-gray-900 dark:text-gray-100">
              {currentRound.format.toUpperCase()}
            </strong>
          </span>
          <span className="text-gray-400 dark:text-gray-500">|</span>
          <span className="flex items-center gap-1.5">
            <FaLayerGroup className="text-blue-600 dark:text-blue-400" size={14} />
            Ronda {currentRound.roundNumber} de {currentCategory.rounds.length}
          </span>
        </div>
      )}

      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex flex-wrap items-center justify-center gap-4 rounded-lg bg-white p-3 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400 sm:text-sm">
          <div className="flex items-center gap-1">
            <BsTrophyFill className="text-yellow-500 dark:text-yellow-400" /> Best (Mejor)
          </div>
          <div className="flex items-center gap-1">
            <BsGraphUp className="text-green-600 dark:text-green-400" /> Average (Promedio)
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold text-yellow-600 dark:text-yellow-400">+2</span> Penalización 2 seg
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold text-red-600 dark:text-red-400">DNF</span> Did Not Finish
          </div>
        </div>

        {currentRound && sortedParticipants ? (
          <div className="overflow-hidden rounded-xl bg-white shadow-lg dark:bg-gray-800">
            {isMobileView ? (
              <div className="space-y-3 p-3">
                {sortedParticipants.map((participant) => (
                  <div
                    key={participant.id}
                    className={`rounded-lg p-4 border-l-4 ${
                      participant.ranking === 1
                        ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-500/10'
                        : participant.ranking === 2
                        ? 'border-gray-400 bg-gray-50 dark:bg-gray-750'
                        : participant.ranking === 3
                        ? 'border-amber-700 bg-amber-50 dark:bg-amber-500/10'
                        : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-750'
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center">
                        {participant.ranking && (
                          <span
                            className={`mr-3 flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold ${
                              participant.ranking === 1
                                ? 'bg-yellow-500 text-gray-900'
                                : participant.ranking === 2
                                ? 'bg-gray-400 text-gray-900'
                                : participant.ranking === 3
                                ? 'bg-amber-700 text-white'
                                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {participant.ranking}
                          </span>
                        )}
                        <h3 className="truncate font-medium text-gray-900 dark:text-gray-100">
                          {participant.name}
                        </h3>
                      </div>

                      <div className="flex gap-2">
                        <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                          Best:{' '}
                          {participant.best > 0
                            ? formatSecondsToDisplay(participant.best)
                            : participant.best === -1
                            ? 'DNF'
                            : '-'}
                        </span>
                        <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-700 dark:bg-green-500/20 dark:text-green-300">
                          Avg:{' '}
                          {participant.average > 0
                            ? formatSecondsToDisplay(participant.average)
                            : participant.average === -1
                            ? 'DNF'
                            : '-'}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`grid ${
                        currentRound.format === 'ao5' ? 'grid-cols-5' : 'grid-cols-3'
                      } gap-2`}
                    >
                      {Array.from({
                        length: currentRound.format === 'ao5' ? 5 : 3,
                      }).map((_, index) => {
                        const time = participant.times[index] || {
                          base: 0,
                          penalty: '',
                        };
                        const nt = normalizeTime(time);
                        const isDnf = nt.penalty === 'DNF';
                        const val =
                          isDnf || (nt.base <= 0 && nt.penalty !== 'DNF')
                            ? -1
                            : nt.base + (nt.penalty === '+2' ? 2 : 0);
                        const bestHighlight = val === participant.best && val > 0;

                        return (
                          <div key={index} className="flex flex-col items-center">
                            <label className="text-xs text-gray-500 dark:text-gray-400">
                              T{index + 1}
                            </label>
                            <div
                              className={`w-full rounded py-1 text-center text-sm ${
                                bestHighlight
                                  ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300'
                                  : isDnf
                                  ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'
                                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                              }`}
                            >
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
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="w-12 px-4 py-3 text-left text-gray-700 dark:text-gray-200">#</th>
                    <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-200">Competidor</th>
                    {currentRound.format === 'ao5' && (
                      <>
                        <th className="px-2 py-3 text-center text-gray-700 dark:text-gray-200">T1</th>
                        <th className="px-2 py-3 text-center text-gray-700 dark:text-gray-200">T2</th>
                        <th className="px-2 py-3 text-center text-gray-700 dark:text-gray-200">T3</th>
                        <th className="px-2 py-3 text-center text-gray-700 dark:text-gray-200">T4</th>
                        <th className="px-2 py-3 text-center text-gray-700 dark:text-gray-200">T5</th>
                      </>
                    )}
                    {currentRound.format === 'ao3' && (
                      <>
                        <th className="px-2 py-3 text-center text-gray-700 dark:text-gray-200">T1</th>
                        <th className="px-2 py-3 text-center text-gray-700 dark:text-gray-200">T2</th>
                        <th className="px-2 py-3 text-center text-gray-700 dark:text-gray-200">T3</th>
                      </>
                    )}
                    <th className="px-3 py-3 text-center text-gray-700 dark:text-gray-200">Best</th>
                    <th className="px-3 py-3 text-center text-gray-700 dark:text-gray-200">Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedParticipants.map((participant) => (
                    <tr
                      key={participant.id}
                      className="border-b border-gray-200 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                    >
                      <td className="px-4 py-3 text-center font-medium">
                        {participant.ranking ? (
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-sm ${
                              participant.ranking === 1
                                ? 'bg-yellow-500 text-gray-900'
                                : participant.ranking === 2
                                ? 'bg-gray-400 text-gray-900'
                                : participant.ranking === 3
                                ? 'bg-amber-700 text-white'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {participant.ranking}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>

                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                        {participant.name}
                      </td>

                      {Array.from({
                        length: currentRound.format === 'ao5' ? 5 : 3,
                      }).map((_, index) => {
                        const time = participant.times[index] || {
                          base: 0,
                          penalty: '',
                        };
                        const nt = normalizeTime(time);
                        const isDnf = nt.penalty === 'DNF';
                        const val =
                          isDnf || (nt.base <= 0 && nt.penalty !== 'DNF')
                            ? -1
                            : nt.base + (nt.penalty === '+2' ? 2 : 0);
                        const bestHighlight = val === participant.best && val > 0;

                        return (
                          <td
                            key={index}
                            className={`px-2 py-3 text-center ${
                              bestHighlight
                                ? 'font-bold text-green-600 dark:text-green-400'
                                : isDnf
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {formatTimeDisplay(time, false)}
                          </td>
                        );
                      })}

                      <td className="px-3 py-3 text-center font-bold text-blue-600 dark:text-blue-400">
                        {participant.best > 0
                          ? formatSecondsToDisplay(participant.best)
                          : participant.best === -1
                          ? 'DNF'
                          : '-'}
                      </td>

                      <td className="px-3 py-3 text-center font-bold text-green-600 dark:text-green-400">
                        {participant.average > 0
                          ? formatSecondsToDisplay(participant.average)
                          : participant.average === -1
                          ? 'DNF'
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="rounded-xl bg-white py-12 text-center dark:bg-gray-800">
            <div className="mb-4 text-gray-500 dark:text-gray-400">
              No hay datos disponibles para esta ronda
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600"
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

      <footer className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Resultados oficiales según el formato WCA</p>
        <p className="mt-1">
          © {new Date().getFullYear()} ruTournament - Sebastian Daza Pérez
        </p>
      </footer>
    </div>
  );
};

export default ResultsViewWCA;