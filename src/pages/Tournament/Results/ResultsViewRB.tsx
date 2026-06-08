import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../../common/db';
import { formatSecondsToDisplay, formatTimeDisplay, calculateRulesStats, sortWCA, normalizeTime } from '../ResultsWCA';
import { MdLeaderboard, MdOutlineTimer, MdPeople } from 'react-icons/md';
import { BsTrophyFill, BsGraphUp } from 'react-icons/bs';

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
    if (!id) { setLoading(false); return; }
    db.tournaments.get(id).then((t) => {
      if (!t) { setLoading(false); return; }
      const allComps: RBCompetitor[] = (t.competitors || []).map((c: any) => ({ id: c.id, name: c.name }));
      setAllCompetitors(allComps);

      const rbCats: RBCategory[] = (t.categories || [])
        .filter((c: any) => c.format === 'redbull')
        .map((cat: any) => {
          const rounds: RBRound[] = (cat.rounds || []).map((r: any) => {
            if (r.isSeeding) {
              return { roundNumber: r.num, name: 'Clasificación', matches: [], isSeeding: true, format: r.format, results: r.results || [] };
            }
            const matches: RBMatch[] = (r.matches || []).map((m: any) => ({
              id: m.id,
              competitor1: allComps.find((c) => c.id === m.competitor1Id) || { id: m.competitor1Id || '', name: 'Desconocido' },
              competitor2: allComps.find((c) => c.id === m.competitor2Id) || { id: m.competitor2Id || '', name: 'Desconocido' },
              winner: m.winner,
              times: m.times || { competitor1: [null, null, null], competitor2: [null, null, null] },
              wins: m.wins || { competitor1: 0, competitor2: 0 },
            }));
            return { roundNumber: r.num, name: `Ronda ${r.num}`, matches };
          });
          return { id: cat.id, name: cat.name, rounds };
        });

      setCategories(rbCats);
      if (rbCats.length > 0) {
        setSelectedCategory(rbCats[0].id);
        if (rbCats[0].rounds.length > 0) setSelectedRound(rbCats[0].rounds[0].roundNumber);
      }
      setLoading(false);
    });
  }, [id]);

  const currentCategory = categories.find((c) => c.id === selectedCategory);
  const currentRound = currentCategory?.rounds.find((r) => r.roundNumber === selectedRound);

  if (loading) {
    return (
      <div className="text-white p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p>Cargando resultados...</p>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="text-white p-4 md:p-6 lg:p-8 min-h-screen">
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2 flex items-center justify-center gap-2">
            <BsTrophyFill className="text-red-400" /> Resultados Red Bull
          </h1>
          <p className="text-gray-400 text-center max-w-2xl mx-auto">Visualiza los resultados de cada categoría</p>
        </header>
        <div className="text-center py-12 bg-gray-800 rounded-xl">
          <div className="text-gray-400">No hay categorías Red Bull en este torneo.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-white p-4 md:p-6 lg:p-8 min-h-screen">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2 flex items-center justify-center gap-2">
          <BsTrophyFill className="text-red-400" /> Resultados Red Bull
        </h1>
        <p className="text-gray-400 text-center max-w-2xl mx-auto">Visualiza los resultados de cada enfrentamiento</p>
      </header>

      <div className="max-w-4xl mx-auto bg-gray-800 rounded-xl p-4 mb-8 shadow-lg">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-1">Categoría</label>
            <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); const cat = categories.find((c) => c.id === e.target.value); setSelectedRound(cat?.rounds[0]?.roundNumber || 1); setSelectedMatch(null); }}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
              {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-1">Ronda</label>
            <select value={selectedRound} onChange={(e) => { setSelectedRound(parseInt(e.target.value)); setSelectedMatch(null); }}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
              {currentCategory?.rounds.map((r) => (<option key={r.roundNumber} value={r.roundNumber}>{r.name}</option>))}
            </select>
          </div>
        </div>
      </div>

      {currentRound?.isSeeding && currentCategory && (
        <div className="max-w-6xl mx-auto mb-8">
          <div className="flex items-center gap-2 mb-4">
            <MdLeaderboard className="text-blue-400" />
            <h3 className="font-bold text-lg">Clasificación — {currentCategory.name} ({currentRound.format?.toUpperCase()})</h3>
          </div>
          <div className="bg-gray-800 rounded-xl overflow-hidden shadow-lg">
            {(() => {
              const compIds = allCompetitors.map(c => c.id);
              const results: any[] = currentRound.results || [];
              const ranked = compIds.map(cid => {
                const comp = allCompetitors.find(c => c.id === cid);
                const result = results.find((r: any) => r.idCompetitor === cid);
                const times = (result?.times || []).map((t: any) => ({ base: t?.base || 0, penalty: t?.penalty || '' }));
                const stats = calculateRulesStats(times, (currentRound.format || 'ao5') as 'ao3' | 'ao5');
                return { id: cid, name: comp?.name || cid, times, best: stats.best, average: stats.average };
              }).sort(sortWCA);

              const bracketExists = currentCategory && currentCategory.rounds.length > 1;
              const firstBracketRound = bracketExists ? currentCategory.rounds.find((r: any) => !r.isSeeding) : null;
              const byedIds = new Set<string>();
              if (firstBracketRound && firstBracketRound.matches && firstBracketRound.matches.length > 0) {
                const matchCompIds = new Set<string>();
                firstBracketRound.matches.forEach((m: any) => {
                  if (m.competitor1 && m.competitor1.id) matchCompIds.add(m.competitor1.id);
                  if (m.competitor2 && m.competitor2.id) matchCompIds.add(m.competitor2.id);
                });
                compIds.forEach((cid: string) => { if (!matchCompIds.has(cid)) byedIds.add(cid); });
              }

              if (isMobileView) {
                return (
                  <div className="space-y-3 p-3">
                    {ranked.map((p, i) => (
                      <div key={p.id} className={`bg-gray-750 rounded-lg p-4 border-l-4 ${
                        i === 0 ? 'border-yellow-500' : i === 1 ? 'border-gray-400' : i === 2 ? 'border-amber-700' : 'border-gray-700'
                      } ${byedIds.has(p.id) ? 'bg-green-900/10' : ''}`}>
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center">
                            <span className={`mr-3 w-6 h-6 flex items-center justify-center rounded-full text-sm font-bold ${
                              i === 0 ? 'bg-yellow-500 text-gray-900' : i === 1 ? 'bg-gray-400 text-gray-900' : i === 2 ? 'bg-amber-700 text-white' : 'bg-gray-700 text-gray-300'
                            }`}>{i + 1}</span>
                            <h3 className="font-medium truncate">{p.name}</h3>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-xs bg-blue-600 px-2 py-1 rounded flex items-center gap-1"><BsTrophyFill size={10} /> {p.best > 0 ? formatSecondsToDisplay(p.best) : p.best === -1 ? 'DNF' : '-'}</span>
                            <span className="text-xs bg-green-600 px-2 py-1 rounded flex items-center gap-1"><BsGraphUp size={10} /> {p.average > 0 ? formatSecondsToDisplay(p.average) : p.average === -1 ? 'DNF' : '-'}</span>
                          </div>
                        </div>
                        <div className={`grid ${currentRound.format === 'ao5' ? 'grid-cols-5' : 'grid-cols-3'} gap-2`}>
                          {Array.from({ length: currentRound.format === 'ao5' ? 5 : 3 }).map((_, ti) => {
                            const t = p.times[ti] || { base: 0, penalty: '' };
                            const nt = normalizeTime(t);
                            const isDnf = nt.penalty === 'DNF';
                            const val = isDnf || (nt.base <= 0 && nt.penalty !== 'DNF') ? -1 : nt.base + (nt.penalty === '+2' ? 2 : 0);
                            const bestHighlight = val === p.best && val > 0;
                            return (
                              <div key={ti} className="flex flex-col items-center">
                                <label className="text-xs text-gray-400 flex items-center gap-1"><MdOutlineTimer size={10} /> T{ti + 1}</label>
                                <div className={`w-full text-center py-1 rounded text-sm ${bestHighlight ? 'bg-green-900/50 text-green-300' : isDnf ? 'bg-red-900/50 text-red-300' : 'bg-gray-700 text-gray-300'}`}>
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
                <table className="w-full bg-gray-750 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-gray-700">
                      <th className="px-4 py-3 text-left w-12">#</th>
                      <th className="px-4 py-3 text-left">
                        <div className="flex items-center gap-2"><MdPeople className="text-blue-400" /><span>Competidor</span></div>
                      </th>
                      {currentRound.format === 'ao5' && (<><th className="px-2 py-3 text-center"><div className="flex flex-col items-center"><MdOutlineTimer className="text-gray-300 mb-1" /><span className="text-xs">T1</span></div></th><th className="px-2 py-3 text-center"><div className="flex flex-col items-center"><MdOutlineTimer className="text-gray-300 mb-1" /><span className="text-xs">T2</span></div></th><th className="px-2 py-3 text-center"><div className="flex flex-col items-center"><MdOutlineTimer className="text-gray-300 mb-1" /><span className="text-xs">T3</span></div></th><th className="px-2 py-3 text-center"><div className="flex flex-col items-center"><MdOutlineTimer className="text-gray-300 mb-1" /><span className="text-xs">T4</span></div></th><th className="px-2 py-3 text-center"><div className="flex flex-col items-center"><MdOutlineTimer className="text-gray-300 mb-1" /><span className="text-xs">T5</span></div></th></>)}
                      {currentRound.format === 'ao3' && (<><th className="px-2 py-3 text-center"><div className="flex flex-col items-center"><MdOutlineTimer className="text-gray-300 mb-1" /><span className="text-xs">T1</span></div></th><th className="px-2 py-3 text-center"><div className="flex flex-col items-center"><MdOutlineTimer className="text-gray-300 mb-1" /><span className="text-xs">T2</span></div></th><th className="px-2 py-3 text-center"><div className="flex flex-col items-center"><MdOutlineTimer className="text-gray-300 mb-1" /><span className="text-xs">T3</span></div></th></>)}
                      <th className="px-3 py-3 text-center"><div className="flex flex-col items-center"><BsTrophyFill className="text-yellow-400 mb-1" /><span className="text-xs">Best</span></div></th>
                      <th className="px-3 py-3 text-center"><div className="flex flex-col items-center"><BsGraphUp className="text-green-400 mb-1" /><span className="text-xs">Avg</span></div></th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranked.map((p, i) => (
                      <tr key={p.id} className={`border-b border-gray-700 ${byedIds.has(p.id) ? 'bg-green-900/10' : ''}`}>
                        <td className="px-4 py-3 text-center font-medium">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm ${i === 0 ? 'bg-yellow-500 text-gray-900' : i === 1 ? 'bg-gray-400 text-gray-900' : i === 2 ? 'bg-amber-700 text-white' : 'text-gray-400'}`}>{i + 1}</span>
                        </td>
                        <td className="px-4 py-3 font-medium">{p.name}</td>
                        {Array.from({ length: currentRound.format === 'ao5' ? 5 : 3 }).map((_, ti) => {
                          const t = p.times[ti] || { base: 0, penalty: '' };
                          const isBest = (t.base > 0 || t.penalty === 'DNF') && t.base + (t.penalty === '+2' ? 2 : 0) === p.best && p.best > 0;
                          return (
                            <td key={ti} className={`px-2 py-3 text-center text-sm ${isBest ? 'text-green-400 font-bold' : t.penalty === 'DNF' ? 'text-red-400' : 'text-gray-300'}`}>
                              {formatTimeDisplay(t, false)}
                            </td>
                          );
                        })}
                        <td className="px-3 py-3 text-center font-bold text-blue-400">{p.best > 0 ? formatSecondsToDisplay(p.best) : p.best === -1 ? 'DNF' : '-'}</td>
                        <td className="px-3 py-3 text-center font-bold text-green-400">{p.average > 0 ? formatSecondsToDisplay(p.average) : p.average === -1 ? 'DNF' : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {currentRound && !currentRound.isSeeding && currentRound.matches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentRound.matches.map((match) => (
              <div key={match.id} onClick={() => setSelectedMatch(match)}
                className={`bg-gray-750 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-all ${match.winner ? 'border-t-4 border-green-500' : ''} shadow-md`}>
                <div className="flex flex-col">
                  <div className={`p-3 rounded-lg mb-2 ${match.winner === match.competitor1.id ? 'bg-green-900/30' : match.winner === match.competitor2.id ? 'bg-red-900/20' : 'bg-gray-700'}`}>
                    <div className="font-medium flex justify-between items-center">
                      <span>{match.competitor1.name || 'Sin asignar'}</span>
                      <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded-full">{match.wins.competitor1} victorias</span>
                    </div>
                    <div className="flex justify-between mt-2">
                      {(match.times.competitor1 || []).concat(Array(Math.max(0, 3 - (match.times.competitor1 || []).length)).fill(null)).slice(0, 3).map((time: any, i: number) => {
                        const oppTime = match.times.competitor2?.[i];
                        const isWin = time && oppTime && time.base > 0 && oppTime.base > 0 ? (time.base + (time.penalty === '+2' ? 2 : 0)) < (oppTime.base + (oppTime.penalty === '+2' ? 2 : 0)) && time.penalty !== 'DNF' : false;
                        return (
                          <div key={i} className="text-center">
                            <div className="text-xs text-gray-400">T{i + 1}</div>
                            <div className={`text-xs px-1 rounded ${isWin ? 'bg-green-900/50 text-green-300' : time && time.base > 0 ? 'bg-gray-800 text-gray-300' : 'bg-gray-800 text-gray-500'}`}>{time && time.base > 0 ? formatTimeDisplay(time, true) : '-'}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="text-center my-1"><span className="inline-block bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">VS</span></div>
                  <div className={`p-3 rounded-lg ${match.winner === match.competitor2.id ? 'bg-green-900/30' : match.winner === match.competitor1.id ? 'bg-red-900/20' : 'bg-gray-700'}`}>
                    <div className="font-medium flex justify-between items-center">
                      <span>{match.competitor2.name || 'Sin asignar'}</span>
                      <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded-full">{match.wins.competitor2} victorias</span>
                    </div>
                    <div className="flex justify-between mt-2">
                      {(match.times.competitor2 || []).concat(Array(Math.max(0, 3 - (match.times.competitor2 || []).length)).fill(null)).slice(0, 3).map((time: any, i: number) => {
                        const oppTime = match.times.competitor1?.[i];
                        const isWin = time && oppTime && time.base > 0 && oppTime.base > 0 ? (time.base + (time.penalty === '+2' ? 2 : 0)) < (oppTime.base + (oppTime.penalty === '+2' ? 2 : 0)) && time.penalty !== 'DNF' : false;
                        return (
                          <div key={i} className="text-center">
                            <div className="text-xs text-gray-400">T{i + 1}</div>
                            <div className={`text-xs px-1 rounded ${isWin ? 'bg-green-900/50 text-green-300' : time && time.base > 0 ? 'bg-gray-800 text-gray-300' : 'bg-gray-800 text-gray-500'}`}>{time && time.base > 0 ? formatTimeDisplay(time, true) : '-'}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                {match.winner && (
                  <div className="mt-3 text-center">
                    <span className="text-xs bg-green-900/50 text-green-300 px-2 py-1 rounded-full">Ganador: {match.winner === match.competitor1.id ? match.competitor1.name : match.competitor2.name}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : currentRound && !currentRound.isSeeding ? (
          <div className="text-center py-12 bg-gray-800 rounded-xl">
            <div className="text-gray-400 mb-4">No hay enfrentamientos disponibles para esta ronda</div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        ) : null}
      </div>

      {selectedMatch && (
         <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-9999" onClick={() => setSelectedMatch(null)}>
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl border border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Detalles del enfrentamiento</h3>
              <button onClick={() => setSelectedMatch(null)} className="text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="mb-4 text-center text-sm text-blue-400">{currentCategory?.name} — {currentRound?.name}</div>
            <div className="space-y-6">
              <div className={`p-4 rounded-lg ${selectedMatch.winner === selectedMatch.competitor1.id ? 'bg-green-900/20 border border-green-700' : 'bg-gray-700'}`}>
                <div className="font-medium text-center text-lg mb-3">{selectedMatch.competitor1.name || 'Sin asignar'}</div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {(selectedMatch.times.competitor1 || []).map((time: any, i: number) => {
                    const oppTime = selectedMatch.times.competitor2?.[i];
                    const isWin = time && oppTime && time.base > 0 && oppTime.base > 0 ? (time.base + (time.penalty === '+2' ? 2 : 0)) < (oppTime.base + (oppTime.penalty === '+2' ? 2 : 0)) && time.penalty !== 'DNF' : false;
                    return (<div key={i} className="text-center"><div className="text-xs text-gray-400 mb-1">Tiempo {i + 1}</div><div className={`p-2 rounded-lg ${isWin ? 'bg-green-900/40 text-green-300' : time && time.base > 0 ? 'bg-gray-800 text-gray-300' : 'bg-gray-800 text-gray-500'}`}>{time && time.base > 0 ? formatTimeDisplay(time, false) : '-'}</div></div>);
                  })}
                </div>
                <div className="text-center"><span className="inline-block bg-blue-900/40 text-blue-300 px-3 py-1 rounded-full text-sm">{selectedMatch.wins.competitor1} de 3 victorias</span></div>
              </div>
              <div className="flex items-center justify-center"><div className="bg-gray-700 text-gray-300 px-4 py-1 rounded-full text-sm font-medium">VS</div></div>
              <div className={`p-4 rounded-lg ${selectedMatch.winner === selectedMatch.competitor2.id ? 'bg-green-900/20 border border-green-700' : 'bg-gray-700'}`}>
                <div className="font-medium text-center text-lg mb-3">{selectedMatch.competitor2.name || 'Sin asignar'}</div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {(selectedMatch.times.competitor2 || []).map((time: any, i: number) => {
                    const oppTime = selectedMatch.times.competitor1?.[i];
                    const isWin = time && oppTime && time.base > 0 && oppTime.base > 0 ? (time.base + (time.penalty === '+2' ? 2 : 0)) < (oppTime.base + (oppTime.penalty === '+2' ? 2 : 0)) && time.penalty !== 'DNF' : false;
                    return (<div key={i} className="text-center"><div className="text-xs text-gray-400 mb-1">Tiempo {i + 1}</div><div className={`p-2 rounded-lg ${isWin ? 'bg-green-900/40 text-green-300' : time && time.base > 0 ? 'bg-gray-800 text-gray-300' : 'bg-gray-800 text-gray-500'}`}>{time && time.base > 0 ? formatTimeDisplay(time, false) : '-'}</div></div>);
                  })}
                </div>
                <div className="text-center"><span className="inline-block bg-blue-900/40 text-blue-300 px-3 py-1 rounded-full text-sm">{selectedMatch.wins.competitor2} de 3 victorias</span></div>
              </div>
              <div className="p-4 bg-gray-750 rounded-lg text-center">
                <div className="font-medium mb-2">Resultado final:</div>
                {selectedMatch.winner ? (
                  <div className="text-xl font-bold text-green-400">{selectedMatch.winner === selectedMatch.competitor1.id ? selectedMatch.competitor1.name : selectedMatch.competitor2.name} <span className="text-base font-normal text-gray-300">gana el enfrentamiento</span></div>
                ) : (<div className="text-gray-400">No hay un ganador definitivo (se necesitan 2 victorias)</div>)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsViewRB;
