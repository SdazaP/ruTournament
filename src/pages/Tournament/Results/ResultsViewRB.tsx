import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../../common/db';
import {
  formatSecondsToDisplay,
  formatTimeDisplay,
  calculateRulesStats,
  sortWCA,
  normalizeTime,
} from '../ResultsWCA';
import { MdLeaderboard, MdOutlineTimer, MdPeople } from 'react-icons/md';
import { BsTrophyFill, BsGraphUp } from 'react-icons/bs';
import { FaEdit, FaRandom } from 'react-icons/fa';

type RBCompetitor = {
  id: string;
  name: string;
};

type RBMatch = {
  id: string;
  competitor1: RBCompetitor;
  competitor2: RBCompetitor;
  winner?: string;
  times: { competitor1: any[]; competitor2: any[] };
  wins: { competitor1: number; competitor2: number };
};

type RBRound = {
  roundNumber: number;
  name: string;
  matches: RBMatch[];
  isSeeding?: boolean;
  format?: string;
  results?: any[];
};

type RBCategory = {
  id: string;
  name: string;
  rounds: RBRound[];
};

const ResultsViewRB = () => {
  const { id } = useParams<{ id: string }>();
  const [categories, setCategories] = useState<RBCategory[]>([]);
  const [allCompetitors, setAllCompetitors] = useState<RBCompetitor[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [selectedMatch, setSelectedMatch] = useState<RBMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    db.tournaments.get(id).then((t) => {
      if (!t) {
        setLoading(false);
        return;
      }

      const allComps: RBCompetitor[] = (t.competitors || []).map((c: any) => ({
        id: c.id,
        name: c.name,
      }));
      setAllCompetitors(allComps);

      const rbCats: RBCategory[] = (t.categories || [])
        .filter((c: any) => c.format === 'redbull')
        .map((cat: any) => {
          const rounds: RBRound[] = (cat.rounds || []).map((r: any) => {
            if (r.isSeeding) {
              return {
                roundNumber: r.num,
                name: 'Clasificación',
                matches: [],
                isSeeding: true,
                format: r.format,
                results: r.results || [],
              };
            }

            const matches: RBMatch[] = (r.matches || []).map((m: any) => ({
              id: m.id,
              competitor1: allComps.find((c) => c.id === m.competitor1Id) || {
                id: m.competitor1Id || '',
                name: 'Desconocido',
              },
              competitor2: allComps.find((c) => c.id === m.competitor2Id) || {
                id: m.competitor2Id || '',
                name: 'Desconocido',
              },
              winner: m.winner,
              times: m.times || {
                competitor1: [null, null, null],
                competitor2: [null, null, null],
              },
              wins: m.wins || { competitor1: 0, competitor2: 0 },
            }));

            return { roundNumber: r.num, name: `Ronda ${r.num}`, matches };
          });

          return { id: cat.id, name: cat.name, rounds };
        });

      setCategories(rbCats);

      if (rbCats.length > 0) {
        setSelectedCategory(rbCats[0].id);
        if (rbCats[0].rounds.length > 0) {
          setSelectedRound(rbCats[0].rounds[0].roundNumber);
        }
      }

      setLoading(false);
    });
  }, [id]);

  const currentCategory = categories.find((c) => c.id === selectedCategory);
  const currentRound = currentCategory?.rounds.find(
    (r) => r.roundNumber === selectedRound
  );

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-700 dark:text-gray-200">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
        <p>Cargando resultados...</p>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="min-h-screen p-4 text-gray-900 dark:text-gray-100 md:p-6 lg:p-8">
        <header className="mb-8">
          <h1 className="mb-2 flex items-center justify-center gap-2 text-center text-2xl font-bold sm:text-3xl">
            <BsTrophyFill className="text-red-500 dark:text-red-400" />
            Resultados Red Bull
          </h1>
          <p className="mx-auto max-w-2xl text-center text-gray-600 dark:text-gray-400">
            Visualiza los resultados de cada categoría
          </p>
        </header>

        <div className="rounded-xl bg-white py-12 text-center dark:bg-gray-800">
          <div className="text-gray-500 dark:text-gray-400">
            No hay categorías Red Bull en este torneo.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 text-gray-900 dark:text-gray-100 md:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="mb-2 flex items-center justify-center gap-2 text-center text-2xl font-bold sm:text-3xl">
          <BsTrophyFill className="text-red-500 dark:text-red-400" />
          Resultados Red Bull
        </h1>
        <p className="mx-auto max-w-2xl text-center text-gray-600 dark:text-gray-400">
          Visualiza los resultados de cada enfrentamiento
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
                const cat = categories.find((c) => c.id === e.target.value);
                setSelectedRound(cat?.rounds[0]?.roundNumber || 1);
                setSelectedMatch(null);
              }}
              className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
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
              onChange={(e) => {
                setSelectedRound(parseInt(e.target.value));
                setSelectedMatch(null);
              }}
              className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            >
              {currentCategory?.rounds.map((r) => (
                <option key={r.roundNumber} value={r.roundNumber}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {currentCategory && (
        <div className="mx-auto mb-4 flex max-w-4xl flex-wrap items-center gap-x-6 gap-y-1 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
          <div className="flex items-center gap-1">
            {(currentCategory as any).rounds?.[0]?.bracketMode === 'manual' ? (
              <>
                <FaEdit className="text-blue-600 dark:text-blue-400" size={12} />
                <span>
                  Modo:{' '}
                  <strong className="text-gray-900 dark:text-gray-100">
                    Manual
                  </strong>
                </span>
              </>
            ) : (
              <>
                <FaRandom
                  className="text-green-600 dark:text-green-400"
                  size={12}
                />
                <span>
                  Modo:{' '}
                  <strong className="text-gray-900 dark:text-gray-100">
                    Aleatorio
                  </strong>
                </span>
              </>
            )}
          </div>

          <span className="text-gray-400 dark:text-gray-500">|</span>

          <span>
            <strong className="text-gray-900 dark:text-gray-100">
              {allCompetitors.length}
            </strong>{' '}
            competidores
          </span>

          {(currentCategory as any).hasSeeding && currentRound?.isSeeding && (
            <>
              <span className="text-gray-400 dark:text-gray-500">|</span>
              <span>
                Clasificación{' '}
                <strong className="text-gray-900 dark:text-gray-100">
                  {(currentCategory as any).seedingFormat || 'ao5'}
                </strong>
              </span>
            </>
          )}

          {!currentRound?.isSeeding &&
            currentCategory.rounds.length > 1 &&
            currentCategory.rounds.some((r: any) => r.matches?.length > 0) && (
              <>
                <span className="text-gray-400 dark:text-gray-500">|</span>
                <span>
                  Eliminación directa —{' '}
                  <strong className="text-gray-900 dark:text-gray-100">
                    {
                      currentCategory.rounds.filter((r: any) => !r.isSeeding)
                        .length
                    }{' '}
                    rondas
                  </strong>
                </span>
              </>
            )}
        </div>
      )}

      {currentRound?.isSeeding && currentCategory && (
        <div className="mx-auto mb-8 max-w-6xl">
          <div className="mb-4 flex items-center gap-2">
            <MdLeaderboard className="text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Clasificación — {currentCategory.name} (
              {currentRound.format?.toUpperCase()})
            </h3>
          </div>

          <div className="overflow-hidden rounded-xl bg-white shadow-lg dark:bg-gray-800">
            {(() => {
              const compIds = allCompetitors.map((c) => c.id);
              const results: any[] = currentRound.results || [];

              const ranked = compIds
                .map((cid) => {
                  const comp = allCompetitors.find((c) => c.id === cid);
                  const result = results.find((r: any) => r.idCompetitor === cid);
                  const times = (result?.times || []).map((t: any) => ({
                    base: t?.base || 0,
                    penalty: t?.penalty || '',
                  }));
                  const stats = calculateRulesStats(
                    times,
                    (currentRound.format || 'ao5') as 'ao3' | 'ao5'
                  );

                  return {
                    id: cid,
                    name: comp?.name || cid,
                    times,
                    best: stats.best,
                    average: stats.average,
                  };
                })
                .sort(sortWCA);

              const bracketExists = currentCategory.rounds.length > 1;
              const firstBracketRound = bracketExists
                ? currentCategory.rounds.find((r: any) => !r.isSeeding)
                : null;

              const byedIds = new Set<string>();
              if (firstBracketRound?.matches?.length) {
                const matchCompIds = new Set<string>();
                firstBracketRound.matches.forEach((m: any) => {
                  if (m.competitor1?.id) matchCompIds.add(m.competitor1.id);
                  if (m.competitor2?.id) matchCompIds.add(m.competitor2.id);
                });
                compIds.forEach((cid: string) => {
                  if (!matchCompIds.has(cid)) byedIds.add(cid);
                });
              }

              if (isMobileView) {
                return (
                  <div className="space-y-3 p-3">
                    {ranked.map((p, i) => (
                      <div
                        key={p.id}
                        className={`rounded-lg border-l-4 p-4 ${
                          i === 0
                            ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-500/10'
                            : i === 1
                            ? 'border-gray-400 bg-gray-50 dark:bg-gray-750'
                            : i === 2
                            ? 'border-amber-700 bg-amber-50 dark:bg-amber-500/10'
                            : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-750'
                        } ${
                          byedIds.has(p.id)
                            ? 'ring-1 ring-green-300 dark:ring-green-900/40'
                            : ''
                        }`}
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center">
                            <span
                              className={`mr-3 flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold ${
                                i === 0
                                  ? 'bg-yellow-500 text-gray-900'
                                  : i === 1
                                  ? 'bg-gray-400 text-gray-900'
                                  : i === 2
                                  ? 'bg-amber-700 text-white'
                                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {i + 1}
                            </span>
                            <h3 className="truncate font-medium text-gray-900 dark:text-gray-100">
                              {p.name}
                            </h3>
                          </div>

                          <div className="flex gap-2">
                            <span className="flex items-center gap-1 rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                              <BsTrophyFill size={10} />
                              {p.best > 0
                                ? formatSecondsToDisplay(p.best)
                                : p.best === -1
                                ? 'DNF'
                                : '-'}
                            </span>
                            <span className="flex items-center gap-1 rounded bg-green-100 px-2 py-1 text-xs text-green-700 dark:bg-green-500/20 dark:text-green-300">
                              <BsGraphUp size={10} />
                              {p.average > 0
                                ? formatSecondsToDisplay(p.average)
                                : p.average === -1
                                ? 'DNF'
                                : '-'}
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
                          }).map((_, ti) => {
                            const t = p.times[ti] || { base: 0, penalty: '' };
                            const nt = normalizeTime(t);
                            const isDnf = nt.penalty === 'DNF';
                            const val =
                              isDnf || (nt.base <= 0 && nt.penalty !== 'DNF')
                                ? -1
                                : nt.base + (nt.penalty === '+2' ? 2 : 0);
                            const bestHighlight = val === p.best && val > 0;

                            return (
                              <div key={ti} className="flex flex-col items-center">
                                <label className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                  <MdOutlineTimer size={10} /> T{ti + 1}
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
                                  {formatTimeDisplay(t, true)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              }

              return (
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-700">
                      <th className="w-12 px-4 py-3 text-left text-gray-700 dark:text-gray-200">
                        #
                      </th>
                      <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-200">
                        <div className="flex items-center gap-2">
                          <MdPeople className="text-blue-600 dark:text-blue-400" />
                          <span>Competidor</span>
                        </div>
                      </th>

                      {currentRound.format === 'ao5' &&
                        ['T1', 'T2', 'T3', 'T4', 'T5'].map((label) => (
                          <th
                            key={label}
                            className="px-2 py-3 text-center text-gray-700 dark:text-gray-200"
                          >
                            <div className="flex flex-col items-center">
                              <MdOutlineTimer className="mb-1 text-gray-500 dark:text-gray-300" />
                              <span className="text-xs">{label}</span>
                            </div>
                          </th>
                        ))}

                      {currentRound.format === 'ao3' &&
                        ['T1', 'T2', 'T3'].map((label) => (
                          <th
                            key={label}
                            className="px-2 py-3 text-center text-gray-700 dark:text-gray-200"
                          >
                            <div className="flex flex-col items-center">
                              <MdOutlineTimer className="mb-1 text-gray-500 dark:text-gray-300" />
                              <span className="text-xs">{label}</span>
                            </div>
                          </th>
                        ))}

                      <th className="px-3 py-3 text-center text-gray-700 dark:text-gray-200">
                        <div className="flex flex-col items-center">
                          <BsTrophyFill className="mb-1 text-yellow-500 dark:text-yellow-400" />
                          <span className="text-xs">Best</span>
                        </div>
                      </th>
                      <th className="px-3 py-3 text-center text-gray-700 dark:text-gray-200">
                        <div className="flex flex-col items-center">
                          <BsGraphUp className="mb-1 text-green-600 dark:text-green-400" />
                          <span className="text-xs">Avg</span>
                        </div>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {ranked.map((p, i) => (
                      <tr
                        key={p.id}
                        className={`border-b border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700 ${
                          byedIds.has(p.id)
                            ? 'bg-green-50 dark:bg-green-500/10'
                            : ''
                        }`}
                      >
                        <td className="px-4 py-3 text-center font-medium">
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-sm ${
                              i === 0
                                ? 'bg-yellow-500 text-gray-900'
                                : i === 1
                                ? 'bg-gray-400 text-gray-900'
                                : i === 2
                                ? 'bg-amber-700 text-white'
                                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {i + 1}
                          </span>
                        </td>

                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                          {p.name}
                        </td>

                        {Array.from({
                          length: currentRound.format === 'ao5' ? 5 : 3,
                        }).map((_, ti) => {
                          const t = p.times[ti] || { base: 0, penalty: '' };
                          const nt = normalizeTime(t);
                          const isDnf = nt.penalty === 'DNF';
                          const val =
                            isDnf || (nt.base <= 0 && nt.penalty !== 'DNF')
                              ? -1
                              : nt.base + (nt.penalty === '+2' ? 2 : 0);
                          const isBest = val === p.best && p.best > 0;

                          return (
                            <td
                              key={ti}
                              className={`px-2 py-3 text-center text-sm ${
                                isBest
                                  ? 'font-bold text-green-600 dark:text-green-400'
                                  : isDnf
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {formatTimeDisplay(t, false)}
                            </td>
                          );
                        })}

                        <td className="px-3 py-3 text-center font-bold text-blue-600 dark:text-blue-400">
                          {p.best > 0
                            ? formatSecondsToDisplay(p.best)
                            : p.best === -1
                            ? 'DNF'
                            : '-'}
                        </td>

                        <td className="px-3 py-3 text-center font-bold text-green-600 dark:text-green-400">
                          {p.average > 0
                            ? formatSecondsToDisplay(p.average)
                            : p.average === -1
                            ? 'DNF'
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl">
        {currentRound && !currentRound.isSeeding && currentRound.matches.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {currentRound.matches.map((match) => (
              <div
                key={match.id}
                onClick={() => setSelectedMatch(match)}
                className={`cursor-pointer rounded-lg p-4 shadow-md transition-all hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  match.winner
                    ? 'border-t-4 border-green-500 bg-gray-50 dark:bg-gray-800'
                    : 'bg-gray-50 dark:bg-gray-750'
                }`}
              >
                <div className="flex flex-col">
                  <div
                    className={`mb-2 rounded-lg p-3 ${
                      match.winner === match.competitor1.id
                        ? 'bg-green-50 dark:bg-green-500/10'
                        : match.winner === match.competitor2.id
                        ? 'bg-red-50 dark:bg-red-500/10'
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between font-medium">
                      <span className="text-gray-900 dark:text-gray-100">
                        {match.competitor1.name || 'Sin asignar'}
                      </span>
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                        {match.wins.competitor1} victorias
                      </span>
                    </div>

                    <div className="mt-2 flex justify-between">
                      {(match.times.competitor1 || [])
                        .concat(
                          Array(
                            Math.max(0, 3 - (match.times.competitor1 || []).length)
                          ).fill(null)
                        )
                        .slice(0, 3)
                        .map((time: any, i: number) => {
                          const oppTime = match.times.competitor2?.[i];
                          const isWin =
                            time &&
                            oppTime &&
                            time.base > 0 &&
                            oppTime.base > 0
                              ? time.base + (time.penalty === '+2' ? 2 : 0) <
                                  oppTime.base +
                                    (oppTime.penalty === '+2' ? 2 : 0) &&
                                time.penalty !== 'DNF'
                              : false;

                          return (
                            <div key={i} className="text-center">
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                T{i + 1}
                              </div>
                              <div
                                className={`rounded px-1 text-xs ${
                                  isWin
                                    ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300'
                                    : time && time.base > 0
                                    ? 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                    : 'bg-white text-gray-500 dark:bg-gray-800 dark:text-gray-500'
                                }`}
                              >
                                {time && time.base > 0
                                  ? formatTimeDisplay(time, true)
                                  : '-'}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  <div className="my-1 text-center">
                    <span className="inline-block rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                      VS
                    </span>
                  </div>

                  <div
                    className={`rounded-lg p-3 ${
                      match.winner === match.competitor2.id
                        ? 'bg-green-50 dark:bg-green-500/10'
                        : match.winner === match.competitor1.id
                        ? 'bg-red-50 dark:bg-red-500/10'
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between font-medium">
                      <span className="text-gray-900 dark:text-gray-100">
                        {match.competitor2.name || 'Sin asignar'}
                      </span>
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                        {match.wins.competitor2} victorias
                      </span>
                    </div>

                    <div className="mt-2 flex justify-between">
                      {(match.times.competitor2 || [])
                        .concat(
                          Array(
                            Math.max(0, 3 - (match.times.competitor2 || []).length)
                          ).fill(null)
                        )
                        .slice(0, 3)
                        .map((time: any, i: number) => {
                          const oppTime = match.times.competitor1?.[i];
                          const isWin =
                            time &&
                            oppTime &&
                            time.base > 0 &&
                            oppTime.base > 0
                              ? time.base + (time.penalty === '+2' ? 2 : 0) <
                                  oppTime.base +
                                    (oppTime.penalty === '+2' ? 2 : 0) &&
                                time.penalty !== 'DNF'
                              : false;

                          return (
                            <div key={i} className="text-center">
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                T{i + 1}
                              </div>
                              <div
                                className={`rounded px-1 text-xs ${
                                  isWin
                                    ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300'
                                    : time && time.base > 0
                                    ? 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                    : 'bg-white text-gray-500 dark:bg-gray-800 dark:text-gray-500'
                                }`}
                              >
                                {time && time.base > 0
                                  ? formatTimeDisplay(time, true)
                                  : '-'}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>

                {match.winner && (
                  <div className="mt-3 text-center">
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700 dark:bg-green-500/20 dark:text-green-300">
                      Ganador:{' '}
                      {match.winner === match.competitor1.id
                        ? match.competitor1.name
                        : match.competitor2.name}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : currentRound && !currentRound.isSeeding ? (
          <div className="rounded-xl bg-white py-12 text-center dark:bg-gray-800">
            <div className="mb-4 text-gray-500 dark:text-gray-400">
              No hay enfrentamientos disponibles para esta ronda
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
        ) : null}
      </div>

      {selectedMatch && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelectedMatch(null)}
        >
          <div
            className="mx-4 w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Detalles del enfrentamiento
              </h3>
              <button
                onClick={() => setSelectedMatch(null)}
                className="text-gray-400 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-4 text-center text-sm text-blue-600 dark:text-blue-400">
              {currentCategory?.name} — {currentRound?.name}
            </div>

            <div className="space-y-6">
              <div
                className={`rounded-lg p-4 ${
                  selectedMatch.winner === selectedMatch.competitor1.id
                    ? 'border border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-500/10'
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}
              >
                <div className="mb-3 text-center text-lg font-medium text-gray-900 dark:text-gray-100">
                  {selectedMatch.competitor1.name || 'Sin asignar'}
                </div>

                <div className="mb-3 grid grid-cols-3 gap-3">
                  {(selectedMatch.times.competitor1 || []).map(
                    (time: any, i: number) => {
                      const oppTime = selectedMatch.times.competitor2?.[i];
                      const isWin =
                        time &&
                        oppTime &&
                        time.base > 0 &&
                        oppTime.base > 0
                          ? time.base + (time.penalty === '+2' ? 2 : 0) <
                              oppTime.base +
                                (oppTime.penalty === '+2' ? 2 : 0) &&
                            time.penalty !== 'DNF'
                          : false;

                      return (
                        <div key={i} className="text-center">
                          <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                            Tiempo {i + 1}
                          </div>
                          <div
                            className={`rounded-lg p-2 ${
                              isWin
                                ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300'
                                : time && time.base > 0
                                ? 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                : 'bg-white text-gray-500 dark:bg-gray-800 dark:text-gray-500'
                            }`}
                          >
                            {time && time.base > 0
                              ? formatTimeDisplay(time, false)
                              : '-'}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>

                <div className="text-center">
                  <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                    {selectedMatch.wins.competitor1} de 3 victorias
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="rounded-full bg-gray-100 px-4 py-1 text-sm font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                  VS
                </div>
              </div>

              <div
                className={`rounded-lg p-4 ${
                  selectedMatch.winner === selectedMatch.competitor2.id
                    ? 'border border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-500/10'
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}
              >
                <div className="mb-3 text-center text-lg font-medium text-gray-900 dark:text-gray-100">
                  {selectedMatch.competitor2.name || 'Sin asignar'}
                </div>

                <div className="mb-3 grid grid-cols-3 gap-3">
                  {(selectedMatch.times.competitor2 || []).map(
                    (time: any, i: number) => {
                      const oppTime = selectedMatch.times.competitor1?.[i];
                      const isWin =
                        time &&
                        oppTime &&
                        time.base > 0 &&
                        oppTime.base > 0
                          ? time.base + (time.penalty === '+2' ? 2 : 0) <
                              oppTime.base +
                                (oppTime.penalty === '+2' ? 2 : 0) &&
                            time.penalty !== 'DNF'
                          : false;

                      return (
                        <div key={i} className="text-center">
                          <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                            Tiempo {i + 1}
                          </div>
                          <div
                            className={`rounded-lg p-2 ${
                              isWin
                                ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300'
                                : time && time.base > 0
                                ? 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                : 'bg-white text-gray-500 dark:bg-gray-800 dark:text-gray-500'
                            }`}
                          >
                            {time && time.base > 0
                              ? formatTimeDisplay(time, false)
                              : '-'}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>

                <div className="text-center">
                  <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                    {selectedMatch.wins.competitor2} de 3 victorias
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-800">
                <div className="mb-2 font-medium text-gray-900 dark:text-gray-100">
                  Resultado final:
                </div>
                {selectedMatch.winner ? (
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">
                    {selectedMatch.winner === selectedMatch.competitor1.id
                      ? selectedMatch.competitor1.name
                      : selectedMatch.competitor2.name}{' '}
                    <span className="text-base font-normal text-gray-600 dark:text-gray-300">
                      gana el enfrentamiento
                    </span>
                  </div>
                ) : (
                  <div className="text-gray-500 dark:text-gray-400">
                    No hay un ganador definitivo (se necesitan 2 victorias)
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsViewRB;