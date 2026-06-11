import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  db,
  CompetitorLocal,
  RedBullMatchLocal,
  TimeRecord,
  Penalty,
} from '../../common/db';
import {
  FaEdit,
  FaSave,
  FaTimes,
  FaLock,
  FaRandom,
  FaTrophy,
  FaInfoCircle,
} from 'react-icons/fa';
import { useTournamentStatus } from '../../hooks/useTournamentStatus';
import {
  MdOutlineTimer,
  MdCategory,
  MdLeaderboard,
  MdPeople,
} from 'react-icons/md';
import { GiBoxingGlove, GiLaurelsTrophy } from 'react-icons/gi';
import { BsTrophyFill, BsGraphUp } from 'react-icons/bs';
import {
  normalizeTime,
  parseTimeToSeconds,
  formatSecondsToDisplay,
  formatTimeDisplay,
  calculateRulesStats,
  sortWCA,
} from './ResultsWCA';

type RBCompetitor = {
  id: string;
  name: string;
};

type RBMatch = {
  id: string;
  competitor1: RBCompetitor;
  competitor2: RBCompetitor;
  winner?: string;
  times: {
    competitor1: (TimeRecord | null)[];
    competitor2: (TimeRecord | null)[];
  };
  wins: { competitor1: number; competitor2: number };
};

type RBRound = {
  roundNumber: number;
  name: string;
  matches: RBMatch[];
  bracketMode: string;
  isSeeding?: boolean;
  format?: string;
  results?: any[];
};

type RBCategory = {
  id: string;
  name: string;
  rounds: RBRound[];
  hasSeeding?: boolean;
  seedingFormat?: string;
  bracketMode?: string;
};

const BRACKET_NAMES = ['Final', 'Semifinal', 'Cuartos', 'Octavos', '16vos'];

const getBracketRoundName = (
  bracketIndex: number,
  P: number,
  hasSeeding: boolean,
  competitorsInRound: number,
): string => {
  if (hasSeeding && bracketIndex === 0 && competitorsInRound < P / 2) {
    return 'Ronda Preliminar';
  }
  const nameIndex = Math.log2(P) - bracketIndex - 1;
  if (nameIndex >= 0 && nameIndex < BRACKET_NAMES.length)
    return BRACKET_NAMES[nameIndex];
  return `Ronda ${bracketIndex + 1}`;
};

const determineMatchWinner = (match: RBMatch): RBMatch => {
  const w1 = match.wins.competitor1;
  const w2 = match.wins.competitor2;
  let winner: string | undefined;
  if (w1 >= 2) winner = match.competitor1.id;
  else if (w2 >= 2) winner = match.competitor2.id;
  return { ...match, winner };
};

const countWins = (
  times: (TimeRecord | null)[],
  opponentTimes: (TimeRecord | null)[],
): number => {
  let wins = 0;
  for (let i = 0; i < 3; i++) {
    const t = times[i];
    const ot = opponentTimes[i];
    if (!t || !ot || t.base <= 0 || ot.base <= 0) continue;
    if (t.penalty === 'DNF' && ot.penalty !== 'DNF') continue;
    if (ot.penalty === 'DNF' && t.penalty !== 'DNF') {
      wins++;
      continue;
    }
    if (t.penalty === 'DNF' && ot.penalty === 'DNF') continue;
    const v1 = t.base + (t.penalty === '+2' ? 2 : 0);
    const v2 = ot.base + (ot.penalty === '+2' ? 2 : 0);
    if (v1 < v2) wins++;
  }
  return wins;
};

const ResultsRB = () => {
  const { id } = useParams<{ id: string }>();
  const { canUploadResults, isFinalized } = useTournamentStatus(id);
  const [categories, setCategories] = useState<RBCategory[]>([]);
  const [competitors, setCompetitors] = useState<RBCompetitor[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [editingMatch, setEditingMatch] = useState<RBMatch | null>(null);
  const [tempTimes, setTempTimes] = useState<{
    competitor1: TimeRecord[];
    competitor2: TimeRecord[];
  }>({
    competitor1: Array(3).fill({ base: 0, penalty: '' }),
    competitor2: Array(3).fill({ base: 0, penalty: '' }),
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editingSeedingId, setEditingSeedingId] = useState<string | null>(null);
  const [seedingTempTimes, setSeedingTempTimes] = useState<TimeRecord[]>(
    Array(5).fill({ base: 0, penalty: '' as Penalty }),
  );
  const [seedingErrorMsg, setSeedingErrorMsg] = useState('');
  const [isMobileView, setIsMobileView] = useState(false);
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!id) return;
    db.tournaments.get(id).then((t) => {
      if (!t) return;
      const comps: RBCompetitor[] = (t.competitors || []).map((c: any) => ({
        id: c.id,
        name: c.name,
      }));
      setCompetitors(comps);

      const rbCats: RBCategory[] = (t.categories || [])
        .filter((c: any) => c.format === 'redbull')
        .map((cat: any) => {
          const hasSeeding = cat.rounds?.[0]?.isSeeding === true;
          const catCompIds = (t.competitors || [])
            .filter((c: any) => (c.categories || []).includes(cat.id))
            .map((c: any) => c.id as string);
          const n = catCompIds.length;
          const P = Math.pow(2, Math.ceil(Math.log2(n > 0 ? n : 2)));

          const rounds: RBRound[] = (cat.rounds || []).map(
            (r: any, ri: number) => {
              if (r.isSeeding) {
                return {
                  roundNumber: r.num,
                  name: 'Clasificación',
                  matches: [],
                  bracketMode: cat.bracketMode || 'random',
                  isSeeding: true,
                  format: r.format,
                  results: r.results || [],
                };
              }
              const bracketIdx = hasSeeding ? ri - 1 : ri;
              let compCount: number;
              if (hasSeeding && bracketIdx === 0) {
                const playingAfterByes = n - (P - n);
                compCount = playingAfterByes;
              } else if (hasSeeding && bracketIdx === 1) {
                compCount = P / 2;
              } else if (hasSeeding) {
                compCount = P / Math.pow(2, bracketIdx);
              } else if (bracketIdx === 0) {
                compCount = n;
              } else {
                compCount = n / Math.pow(2, bracketIdx);
              }
              compCount = Math.max(2, Math.round(compCount));

              const matches: RBMatch[] = (r.matches || []).map((m: any) => ({
                id: m.id,
                competitor1: comps.find((c) => c.id === m.competitor1Id) || {
                  id: m.competitor1Id || '',
                  name: 'Desconocido',
                },
                competitor2: comps.find((c) => c.id === m.competitor2Id) || {
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
              return {
                roundNumber: r.num,
                name: getBracketRoundName(bracketIdx, P, hasSeeding, compCount),
                matches,
                bracketMode: cat.bracketMode || 'random',
              };
            },
          );
          return {
            id: cat.id,
            name: cat.name,
            rounds,
            hasSeeding,
            seedingFormat: cat.seedingFormat,
            bracketMode: cat.bracketMode,
          };
        });

      setCategories(rbCats);
      if (rbCats.length > 0) {
        setSelectedCategory(rbCats[0].id);
        if (rbCats[0].rounds.length > 0) {
          setSelectedRound(rbCats[0].rounds[0].roundNumber);
        }
      }
    });
  }, [id]);

  const currentCategory = categories.find((c) => c.id === selectedCategory);
  const currentRound = currentCategory?.rounds.find(
    (r) => r.roundNumber === selectedRound,
  );

  const getCompetitorName = (cId: string) => {
    const c = competitors.find((c) => c.id === cId);
    return c ? c.name : cId;
  };

  const countCatParticipants = (tourneyObj: any): string[] => {
    return (tourneyObj.competitors || [])
      .filter((comp: any) => (comp.categories || []).includes(selectedCategory))
      .map((c: any) => c.id as string);
  };

  const hasResultsEntered = (rounds: any[]): boolean => {
    for (const r of rounds) {
      for (const m of r.matches || []) {
        const t1 = m.times?.competitor1 || [];
        const t2 = m.times?.competitor2 || [];
        for (let i = 0; i < 3; i++) {
          const a = t1[i];
          const b = t2[i];
          if (
            (a && (a.base > 0 || a.penalty === 'DNF')) ||
            (b && (b.base > 0 || b.penalty === 'DNF'))
          ) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const generateBrackets = async (mode: 'random' | 'manual') => {
    if (!currentCategory || !id) return;

    const tourneyObj = await db.tournaments.get(id);
    if (!tourneyObj) return;

    const cat = tourneyObj.categories.find(
      (c: any) => c.id === selectedCategory,
    );
    if (!cat) return;

    const catCompIds = countCatParticipants(tourneyObj);
    if (catCompIds.length < 2) {
      alert(
        'Se necesitan al menos 2 competidores inscritos en esta categoría para generar brackets.',
      );
      return;
    }

    if (cat.rounds && cat.rounds.length > 0 && hasResultsEntered(cat.rounds)) {
      alert(
        'No se puede regenerar porque ya hay resultados cargados. Elimina los resultados primero.',
      );
      return;
    }

    const hasSeeding = cat.rounds?.[0]?.isSeeding === true;
    let seedingRanked:
      | { id: string; average: number; best: number; name: string }[]
      | null = null;

    if (hasSeeding) {
      const seedingResults: any[] = cat.rounds[0].results || [];
      if (seedingResults.length === 0) {
        alert(
          'Debes completar la ronda de clasificación antes de generar los brackets.',
        );
        return;
      }
      seedingRanked = catCompIds
        .map((cid) => {
          const comp = (tourneyObj.competitors || []).find(
            (c: any) => c.id === cid,
          );
          const result = seedingResults.find(
            (r: any) => r.idCompetitor === cid,
          );
          const times = (result?.times || []).map(normalizeTime);
          const stats = calculateRulesStats(
            times,
            cat.rounds[0].format as 'ao3' | 'ao5',
          );
          return {
            id: cid,
            average: stats.average,
            best: stats.best,
            name: comp?.name || cid,
          };
        })
        .sort(sortWCA);
    }

    const n = catCompIds.length;
    const P = Math.pow(2, Math.ceil(Math.log2(n)));
    const byes = P - n;

    const bracketRounds = Math.max(1, Math.ceil(Math.log2(P)));
    const newRounds: any[] = [];

    if (hasSeeding) {
      newRounds.push({ ...cat.rounds[0] });
    }

    for (let i = 0; i < bracketRounds; i++) {
      newRounds.push({
        num: (hasSeeding ? 1 : 0) + i + 1,
        format: 'rb',
        results: [],
        competitorsToAdvance: 'all',
        isFinal: i === bracketRounds - 1,
        matches: [],
        bracketMode: mode,
      });
    }

    const round1Matches: any[] = [];

    if (seedingRanked) {
      const playing = seedingRanked.slice(byes);
      for (let i = 0; i < Math.floor(playing.length / 2); i++) {
        round1Matches.push({
          id: `rb-${Date.now()}-${i}`,
          competitor1Id: playing[i].id,
          competitor2Id: playing[playing.length - 1 - i].id,
          winner: undefined,
          times: {
            competitor1: [null, null, null],
            competitor2: [null, null, null],
          },
          wins: { competitor1: 0, competitor2: 0 },
        });
      }
      if (playing.length % 2 !== 0) {
        const mid = Math.floor(playing.length / 2);
        round1Matches.push({
          id: `rb-${Date.now()}-${mid}`,
          competitor1Id: playing[mid].id,
          competitor2Id: playing[mid].id,
          winner: playing[mid].id,
          times: {
            competitor1: [null, null, null],
            competitor2: [null, null, null],
          },
          wins: { competitor1: 2, competitor2: 0 },
        });
      }
    } else if (mode === 'random') {
      const randomByes = P - n;
      const shuffled = [...catCompIds].sort(() => Math.random() - 0.5);
      const playing = shuffled.slice(0, n - randomByes);
      for (let i = 0; i < Math.floor(playing.length / 2); i++) {
        round1Matches.push({
          id: `rb-${Date.now()}-${i}`,
          competitor1Id: playing[i],
          competitor2Id: playing[playing.length - 1 - i],
          winner: undefined,
          times: {
            competitor1: [null, null, null],
            competitor2: [null, null, null],
          },
          wins: { competitor1: 0, competitor2: 0 },
        });
      }
      if (playing.length % 2 !== 0) {
        const mid = Math.floor(playing.length / 2);
        round1Matches.push({
          id: `rb-${Date.now()}-${mid}`,
          competitor1Id: playing[mid],
          competitor2Id: playing[mid],
          winner: playing[mid],
          times: {
            competitor1: [null, null, null],
            competitor2: [null, null, null],
          },
          wins: { competitor1: 2, competitor2: 0 },
        });
      }
    } else {
      const matchCount = Math.ceil((n - (P - n)) / 2);
      for (let i = 0; i < matchCount; i++) {
        round1Matches.push({
          id: `rb-${Date.now()}-${i}`,
          competitor1Id: '',
          competitor2Id: '',
          winner: undefined,
          times: {
            competitor1: [null, null, null],
            competitor2: [null, null, null],
          },
          wins: { competitor1: 0, competitor2: 0 },
        });
      }
    }

    const bracketStartIdx = hasSeeding ? 1 : 0;
    newRounds[bracketStartIdx].matches = round1Matches;
    cat.rounds = newRounds;
    cat.bracketMode = mode;

    await db.tournaments.put(tourneyObj as any);
    reloadFromDb();
  };

  const reloadFromDb = () => {
    if (!id) return;
    db.tournaments.get(id).then((t) => {
      if (!t) return;
      const comps: RBCompetitor[] = (t.competitors || []).map((c: any) => ({
        id: c.id,
        name: c.name,
      }));
      setCompetitors(comps);
      const rbCats: RBCategory[] = (t.categories || [])
        .filter((c: any) => c.format === 'redbull')
        .map((cat: any) => {
          const hasSeeding = cat.rounds?.[0]?.isSeeding === true;
          const catCompIds = (t.competitors || [])
            .filter((c: any) => (c.categories || []).includes(cat.id))
            .map((c: any) => c.id as string);
          const n = catCompIds.length;
          const P = Math.pow(2, Math.ceil(Math.log2(n > 0 ? n : 2)));

          const rounds: RBRound[] = (cat.rounds || []).map(
            (r: any, ri: number) => {
              if (r.isSeeding) {
                return {
                  roundNumber: r.num,
                  name: 'Clasificación',
                  matches: [],
                  bracketMode: cat.bracketMode || 'random',
                  isSeeding: true,
                  format: r.format,
                  results: r.results || [],
                };
              }
              const bracketIdx = hasSeeding ? ri - 1 : ri;
              let compCount: number;
              if (hasSeeding && bracketIdx === 0) {
                compCount = n - (P - n);
              } else if (hasSeeding && bracketIdx === 1) {
                compCount = P / 2;
              } else if (hasSeeding) {
                compCount = P / Math.pow(2, bracketIdx);
              } else if (bracketIdx === 0) {
                compCount = n;
              } else {
                compCount = n / Math.pow(2, bracketIdx);
              }
              compCount = Math.max(2, Math.round(compCount));

              const matches: RBMatch[] = (r.matches || []).map((m: any) => ({
                id: m.id,
                competitor1: comps.find((c) => c.id === m.competitor1Id) || {
                  id: m.competitor1Id || '',
                  name: 'Sin asignar',
                },
                competitor2: comps.find((c) => c.id === m.competitor2Id) || {
                  id: m.competitor2Id || '',
                  name: 'Sin asignar',
                },
                winner: m.winner,
                times: m.times || {
                  competitor1: [null, null, null],
                  competitor2: [null, null, null],
                },
                wins: m.wins || { competitor1: 0, competitor2: 0 },
              }));
              return {
                roundNumber: r.num,
                name: getBracketRoundName(bracketIdx, P, hasSeeding, compCount),
                matches,
                bracketMode: cat.bracketMode || 'random',
              };
            },
          );
          return {
            id: cat.id,
            name: cat.name,
            rounds,
            hasSeeding,
            seedingFormat: cat.seedingFormat,
            bracketMode: cat.bracketMode,
          };
        });
      setCategories(rbCats);
    });
  };

  const startEditing = (match: RBMatch) => {
    setEditingMatch(match);
    setTempTimes({
      competitor1: Array.from({ length: 3 }, (_, i) => {
        const t = match.times.competitor1[i];
        return t ? normalizeTime(t) : { base: 0, penalty: '' as Penalty };
      }),
      competitor2: Array.from({ length: 3 }, (_, i) => {
        const t = match.times.competitor2[i];
        return t ? normalizeTime(t) : { base: 0, penalty: '' as Penalty };
      }),
    });
  };

  const handleTimeChange = (
    side: 'competitor1' | 'competitor2',
    index: number,
    value: string,
  ) => {
    if (value !== '' && !/^(\d+:)?\d*\.?\d{0,2}$/.test(value)) {
      setErrorMsg(
        '⚠️ Formato incorrecto: Usa SS.CC o M:SS.CC (ej. 1:07.78 o 9.53).',
      );
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }
    setErrorMsg('');
    const newTimes = { ...tempTimes };
    newTimes[side] = [...newTimes[side]];
    newTimes[side][index] = { ...newTimes[side][index], base: value as any };
    setTempTimes(newTimes);
  };

  const handleTimeBlur = (
    side: 'competitor1' | 'competitor2',
    index: number,
    value: string,
  ) => {
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
    const newTimes = { ...tempTimes };
    newTimes[side] = [...newTimes[side]];
    newTimes[side][index] = {
      ...newTimes[side][index],
      base: formatted as any,
    };
    setTempTimes(newTimes);
  };

  const handlePenaltyChange = (
    side: 'competitor1' | 'competitor2',
    index: number,
    penalty: Penalty,
  ) => {
    const newTimes = { ...tempTimes };
    newTimes[side] = [...newTimes[side]];
    newTimes[side][index] = {
      ...newTimes[side][index],
      penalty: newTimes[side][index].penalty === penalty ? '' : penalty,
    };
    setTempTimes(newTimes);
  };

  const saveMatch = async () => {
    if (!editingMatch || !currentRound || !id) return;

    const parsedTimes = {
      competitor1: tempTimes.competitor1.map((t) => ({
        base: parseTimeToSeconds(t.base as any),
        penalty: t.penalty,
      })) as TimeRecord[],
      competitor2: tempTimes.competitor2.map((t) => ({
        base: parseTimeToSeconds(t.base as any),
        penalty: t.penalty,
      })) as TimeRecord[],
    };

    const wins = {
      competitor1: countWins(parsedTimes.competitor1, parsedTimes.competitor2),
      competitor2: countWins(parsedTimes.competitor2, parsedTimes.competitor1),
    };

    const updatedMatch: RBMatch = {
      ...editingMatch,
      times: {
        competitor1: parsedTimes.competitor1,
        competitor2: parsedTimes.competitor2,
      },
      wins,
    };

    const finalMatch = determineMatchWinner(updatedMatch);

    const tournament = await db.tournaments.get(id);
    if (tournament) {
      const catIdx = tournament.categories.findIndex(
        (c: any) => c.id === selectedCategory,
      );
      if (catIdx >= 0) {
        const rndIdx = tournament.categories[catIdx].rounds.findIndex(
          (r: any) => r.num === selectedRound,
        );
        if (rndIdx >= 0) {
          const existingMatches: any[] =
            tournament.categories[catIdx].rounds[rndIdx].matches || [];
          const mIdx = existingMatches.findIndex(
            (m: any) => m.id === finalMatch.id,
          );
          const persistingMatch = {
            id: finalMatch.id,
            competitor1Id: finalMatch.competitor1.id,
            competitor2Id: finalMatch.competitor2.id,
            winner: finalMatch.winner,
            times: finalMatch.times,
            wins: finalMatch.wins,
          };
          if (mIdx >= 0) {
            existingMatches[mIdx] = persistingMatch;
          } else {
            existingMatches.push(persistingMatch);
          }
          tournament.categories[catIdx].rounds[rndIdx].matches =
            existingMatches;

          const allSettled = existingMatches.every((m: any) => m.winner);
          if (
            allSettled &&
            tournament.categories[catIdx].rounds.length > rndIdx + 1
          ) {
            const nextRndIdx = rndIdx + 1;
            const winnerIds = existingMatches
              .map((m: any) => m.winner)
              .filter(Boolean);
            const hasSeeding =
              tournament.categories[catIdx].rounds?.[0]?.isSeeding === true;
            const isFirstBracketRound =
              (hasSeeding && rndIdx === 1) || (!hasSeeding && rndIdx === 0);

            let nextCompetitorIds = [...winnerIds];
            if (isFirstBracketRound) {
              const allCatCompIds = (tournament.competitors || [])
                .filter((c: any) =>
                  (c.categories || []).includes(selectedCategory),
                )
                .map((c: any) => c.id as string);
              const playedIds = new Set<string>();
              existingMatches.forEach((m: any) => {
                if (m.competitor1Id) playedIds.add(m.competitor1Id);
                if (m.competitor2Id) playedIds.add(m.competitor2Id);
              });
              const byedIds = allCatCompIds.filter(
                (c: string) => !playedIds.has(c),
              );
              nextCompetitorIds = [...winnerIds, ...byedIds];
            }

            const nextMatches: any[] = [];
            const shuffled = [...nextCompetitorIds].sort(
              () => Math.random() - 0.5,
            );
            for (let i = 0; i < shuffled.length; i += 2) {
              if (i + 1 < shuffled.length) {
                nextMatches.push({
                  id: `rb-${Date.now()}-${i}`,
                  competitor1Id: shuffled[i],
                  competitor2Id: shuffled[i + 1],
                  winner: undefined,
                  times: {
                    competitor1: [null, null, null],
                    competitor2: [null, null, null],
                  },
                  wins: { competitor1: 0, competitor2: 0 },
                });
              } else {
                nextMatches.push({
                  id: `rb-${Date.now()}-${i}`,
                  competitor1Id: shuffled[i],
                  competitor2Id: shuffled[i],
                  winner: shuffled[i],
                  times: {
                    competitor1: [null, null, null],
                    competitor2: [null, null, null],
                  },
                  wins: { competitor1: 2, competitor2: 0 },
                });
              }
            }
            tournament.categories[catIdx].rounds[nextRndIdx].matches =
              nextMatches;
          }

          await db.tournaments.put(tournament as any);
        }
      }
    }

    setEditingMatch(null);
    setErrorMsg('');
    reloadFromDb();
  };

  const cancelEditing = () => {
    setEditingMatch(null);
    setTempTimes({
      competitor1: Array(3).fill({ base: 0, penalty: '' }),
      competitor2: Array(3).fill({ base: 0, penalty: '' }),
    });
    setErrorMsg('');
  };

  const startSeedingEdit = (competitorId: string) => {
    if (!currentRound?.isSeeding) return;
    const result = (currentRound.results || []).find(
      (r: any) => r.idCompetitor === competitorId,
    );
    const times = result?.times || [];
    setEditingSeedingId(competitorId);
    const format = currentRound.format === 'ao3' ? 3 : 5;
    setSeedingTempTimes(
      Array.from({ length: format }, (_, i) => normalizeTime(times[i])),
    );
  };

  const cancelSeedingEdit = () => {
    setEditingSeedingId(null);
    setSeedingTempTimes(Array(5).fill({ base: 0, penalty: '' as Penalty }));
    setSeedingErrorMsg('');
  };

  const handleSeedingTimeChange = (index: number, value: string) => {
    if (value !== '' && !/^(\d+:)?\d*\.?\d{0,2}$/.test(value)) {
      setSeedingErrorMsg(
        'Formato incorrecto: Usa SS.CC o M:SS.CC (ej. 1:07.78 o 9.53).',
      );
      setTimeout(() => setSeedingErrorMsg(''), 4000);
      return;
    }
    setSeedingErrorMsg('');
    const newTimes = [...seedingTempTimes];
    newTimes[index] = { ...newTimes[index], base: value as any };
    setSeedingTempTimes(newTimes);
  };

  const handleSeedingTimeBlur = (index: number, value: string) => {
    if (!value || value.includes('.') || value.includes(':')) return;
    let formatted = value;
    const len = value.length;
    if (len <= 2) formatted = (parseInt(value, 10) / 100).toFixed(2);
    else if (len === 3 || len === 4) {
      const centis = value.slice(-2);
      const secs = parseInt(value.slice(0, -2), 10);
      formatted = `${secs}.${centis}`;
    } else if (len >= 5) {
      const centis = value.slice(-2);
      const secs = value.slice(-4, -2).padStart(2, '0');
      const mins = parseInt(value.slice(0, -4), 10);
      formatted = `${mins}:${secs}.${centis}`;
    }
    const newTimes = [...seedingTempTimes];
    newTimes[index] = { ...newTimes[index], base: formatted as any };
    setSeedingTempTimes(newTimes);
  };

  const handleSeedingPenaltyChange = (index: number, penalty: Penalty) => {
    const newTimes = [...seedingTempTimes];
    newTimes[index] = {
      ...newTimes[index],
      penalty: newTimes[index].penalty === penalty ? '' : penalty,
    };
    setSeedingTempTimes(newTimes);
  };

  const saveSeedingResults = async () => {
    if (!editingSeedingId || !currentRound || !id) return;

    const parsedTimes = seedingTempTimes.map((t) => ({
      base: parseTimeToSeconds(t.base as any),
      penalty: t.penalty,
    })) as TimeRecord[];

    const tournament = await db.tournaments.get(id);
    if (tournament) {
      const catIdx = tournament.categories.findIndex(
        (c: any) => c.id === selectedCategory,
      );
      if (catIdx >= 0) {
        const rndIdx = tournament.categories[catIdx].rounds.findIndex(
          (r: any) => r.num === selectedRound,
        );
        if (rndIdx >= 0) {
          if (!tournament.categories[catIdx].rounds[rndIdx].results) {
            tournament.categories[catIdx].rounds[rndIdx].results = [];
          }
          const results = tournament.categories[catIdx].rounds[rndIdx]
            .results as any[];
          const existingIdx = results.findIndex(
            (r: any) => r.idCompetitor === editingSeedingId,
          );
          const entry = {
            idCompetitor: editingSeedingId,
            times: parsedTimes,
            media: '0',
          };
          if (existingIdx >= 0) results[existingIdx] = entry;
          else results.push(entry);
          await db.tournaments.put(tournament as any);
        }
      }
    }

    cancelSeedingEdit();
    reloadFromDb();
  };

  const handleManualAssign = async (
    matchId: string,
    side: 'competitor1' | 'competitor2',
    compId: string,
  ) => {
    if (!currentRound || !id) return;
    const tournament = await db.tournaments.get(id);
    if (!tournament) return;
    const catIdx = tournament.categories.findIndex(
      (c: any) => c.id === selectedCategory,
    );
    if (catIdx < 0) return;
    const rndIdx = tournament.categories[catIdx].rounds.findIndex(
      (r: any) => r.num === selectedRound,
    );
    if (rndIdx < 0) return;
    const matches: any[] =
      tournament.categories[catIdx].rounds[rndIdx].matches || [];
    const mIdx = matches.findIndex((m: any) => m.id === matchId);
    if (mIdx < 0) return;
    if (side === 'competitor1') {
      matches[mIdx].competitor1Id = compId;
    } else {
      matches[mIdx].competitor2Id = compId;
    }
    tournament.categories[catIdx].rounds[rndIdx].matches = matches;
    await db.tournaments.put(tournament as any);
    reloadFromDb();
  };

  if (categories.length === 0) {
    return (
      <div className="text-white p-4 md:p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-6">
          <GiLaurelsTrophy className="text-red-500 text-2xl" />
          <h2 className="text-xl sm:text-2xl font-bold">Resultados Red Bull</h2>
        </div>
        <div className="text-center py-16 text-gray-400 flex flex-col items-center gap-3">
          <GiLaurelsTrophy size={32} className="opacity-50" />
          <p>No hay categorías con formato Red Bull en este torneo.</p>
          <p className="text-sm">
            Ve a la sección <strong>Categorías</strong> para añadir una con
            formato Red Bull.
          </p>
        </div>
      </div>
    );
  }

  const canEdit = canUploadResults && !isFinalized;

  const hasResultsCheck = (): boolean => {
    if (!currentCategory) return false;
    for (const r of currentCategory.rounds) {
      for (const m of r.matches) {
        const t1 = m.times.competitor1 || [];
        const t2 = m.times.competitor2 || [];
        for (let i = 0; i < 3; i++) {
          if (
            (t1[i] && (t1[i]!.base > 0 || t1[i]!.penalty === 'DNF')) ||
            (t2[i] && (t2[i]!.base > 0 || t2[i]!.penalty === 'DNF'))
          ) {
            return true;
          }
        }
      }
    }
    return false;
  };
  const catCompIds = (() => {
    if (!selectedCategory || !id) return [];
    return competitors.map((c) => c.id);
  })();

  const getAssignedIds = () => {
    if (!currentRound) return [];
    const ids: string[] = [];
    currentRound.matches.forEach((m) => {
      if (m.competitor1.id) ids.push(m.competitor1.id);
      if (m.competitor2.id) ids.push(m.competitor2.id);
    });
    return ids;
  };

  const getUnassignedIds = (
    side: 'competitor1' | 'competitor2',
    currentId: string,
  ) => {
    const assigned = getAssignedIds();
    const eliminatedIds = new Set<string>();
    if (currentCategory) {
      currentCategory.rounds
        .filter(
          (r) =>
            r.roundNumber < (currentRound?.roundNumber || 0) && !r.isSeeding,
        )
        .forEach((r) => {
          r.matches.forEach((m) => {
            if (m.winner) {
              if (m.competitor1.id && m.competitor1.id !== m.winner)
                eliminatedIds.add(m.competitor1.id);
              if (m.competitor2.id && m.competitor2.id !== m.winner)
                eliminatedIds.add(m.competitor2.id);
            }
          });
        });
    }
    return catCompIds.filter(
      (cid) =>
        (!assigned.includes(cid) || cid === currentId) &&
        !eliminatedIds.has(cid),
    );
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 text-gray-900 dark:text-gray-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <GiLaurelsTrophy className="text-red-500 dark:text-red-400 text-2xl" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            Resultados Red Bull
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              if (!canEdit) return;
              setEditMode(!editMode);
              if (editMode) cancelEditing();
            }}
            disabled={!canEdit}
            title={!canEdit ? 'El torneo no permite modificar resultados.' : ''}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center justify-center gap-2 border ${
              !canEdit
                ? 'bg-gray-100 text-gray-400 border-gray-200 opacity-60 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700'
                : editMode
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600 dark:bg-yellow-500 dark:hover:bg-yellow-600 dark:border-yellow-500'
                : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600 dark:border-blue-500'
            }`}
          >
            {!canEdit ? <FaLock /> : editMode ? <FaTimes /> : <FaEdit />}
            {!canEdit
              ? 'Bloqueado'
              : editMode
              ? 'Salir Edición'
              : 'Activar Edición'}
          </button>

          {canEdit &&
            !currentRound?.isSeeding &&
            (() => {
              const bracketsExist =
                currentCategory && currentCategory.rounds.length > 1;
              const canGenerate =
                currentRound &&
                currentRound.matches.length === 0 &&
                !currentCategory?.rounds.some((r) => r.roundNumber > 1) &&
                currentCategory?.rounds.every(
                  (r) => !r.isSeeding || r.roundNumber !== 1,
                );
              const canRegenerate =
                currentCategory &&
                currentCategory.rounds.length > 1 &&
                !hasResultsCheck();

              if (canGenerate || canRegenerate) {
                const mode = (currentCategory as any)?.bracketMode || 'random';
                return (
                  <button
                    onClick={() => setShowGenerateConfirm(true)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center justify-center gap-2 text-white border ${
                      bracketsExist
                        ? 'bg-yellow-600 hover:bg-yellow-700 border-yellow-600 dark:bg-yellow-500 dark:hover:bg-yellow-600 dark:border-yellow-500'
                        : 'bg-green-600 hover:bg-green-700 border-green-600 dark:bg-green-500 dark:hover:bg-green-600 dark:border-green-500'
                    }`}
                  >
                    <FaRandom />
                    {bracketsExist ? 'Regenerar Brackets' : 'Generar Brackets'}
                  </button>
                );
              }

              return null;
            })()}
        </div>
      </div>

      {!canUploadResults && (
        <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 flex items-center gap-3 text-sm text-yellow-800 dark:border-yellow-900/60 dark:bg-yellow-500/10 dark:text-yellow-200">
          <FaLock className="text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
          <span>
            <strong className="text-yellow-900 dark:text-yellow-100">
              Torneo bloqueado.
            </strong>{' '}
            No se pueden modificar resultados en este estado.
          </span>
        </div>
      )}

      {currentCategory && (
        <div className="mb-4 flex flex-wrap items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
          <div className="flex items-center gap-1">
            {currentCategory.rounds[0]?.bracketMode === 'manual' ? (
              <>
                <FaEdit
                  className="text-blue-600 dark:text-blue-400"
                  size={12}
                />
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
          <span>{competitors.length} competidores</span>

          {currentCategory.hasSeeding && currentRound?.isSeeding && (
            <>
              <span className="text-gray-400 dark:text-gray-500">|</span>
              <span>
                Clasificación {(currentCategory as any).seedingFormat || 'ao5'}
              </span>
            </>
          )}

          {!currentRound?.isSeeding &&
            currentCategory.rounds.length > 1 &&
            currentCategory.rounds.some((r) => r.matches.length > 0) && (
              <>
                <span className="text-gray-400 dark:text-gray-500">|</span>
                <span>
                  Eliminación directa —{' '}
                  {currentCategory.rounds.filter((r) => !r.isSeeding).length}{' '}
                  rondas
                </span>
              </>
            )}
        </div>
      )}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="min-w-[150px] flex-1">
          <label className="mb-1 flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            <MdCategory className="text-blue-600 dark:text-blue-400" />{' '}
            Categoría
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              const cat = categories.find((c) => c.id === e.target.value);
              setSelectedRound(cat?.rounds[0]?.roundNumber || 1);
              cancelEditing();
            }}
            className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:ring-blue-400"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[150px] flex-1">
          <label className="mb-1 flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            <MdOutlineTimer
              size={14}
              className="text-gray-500 dark:text-gray-400"
            />
            Ronda
          </label>
          <select
            value={selectedRound}
            onChange={(e) => {
              setSelectedRound(parseInt(e.target.value));
              cancelEditing();
            }}
            className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:ring-blue-400"
          >
            {currentCategory?.rounds.map((r) => (
              <option key={r.roundNumber} value={r.roundNumber}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {currentRound?.isSeeding && currentCategory && (
        <div className="mb-6">
          <div className="mb-3 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <MdLeaderboard className="text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Clasificación — {currentCategory.name} (
                {currentRound.format?.toUpperCase()})
              </h3>
            </div>

            {canEdit &&
              currentRound.results &&
              currentRound.results.length > 0 && (
                <button
                  onClick={() => setShowGenerateConfirm(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-green-600 bg-green-600 px-4 py-2 text-sm text-white transition-colors hover:bg-green-700 dark:border-green-500 dark:bg-green-500 dark:hover:bg-green-600 sm:w-auto"
                >
                  <FaRandom /> Generar Brackets con Clasificación
                </button>
              )}
          </div>

          {currentCategory &&
            currentCategory.rounds.length > 1 &&
            currentRound?.isSeeding &&
            (() => {
              const firstBracket = currentCategory.rounds.find(
                (r: any) => !r.isSeeding,
              );

              if (
                !firstBracket ||
                !firstBracket.matches ||
                firstBracket.matches.length === 0
              )
                return null;

              const matchCompIds = new Set<string>();

              firstBracket.matches.forEach((m: any) => {
                if (m.competitor1 && m.competitor1.id)
                  matchCompIds.add(m.competitor1.id);
                if (m.competitor2 && m.competitor2.id)
                  matchCompIds.add(m.competitor2.id);
              });

              const byed = competitors.filter((c) => !matchCompIds.has(c.id));
              if (byed.length === 0) return null;

              return (
                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/50 dark:bg-green-500/10">
                  <div className="mb-2 flex items-center gap-2">
                    <FaTrophy className="text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                      Pase directo a siguiente ronda ({byed.length})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {byed.map((c) => (
                      <span
                        key={c.id}
                        className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800 dark:bg-green-500/20 dark:text-green-200"
                      >
                        {c.name}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}

          {editMode && editingSeedingId && (
            <div className="mb-4 flex flex-col gap-3 rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-2 font-medium text-gray-900 dark:text-gray-100">
                  <FaInfoCircle className="text-yellow-500 dark:text-yellow-400" />{' '}
                  Editando:{' '}
                  {competitors.find((c) => c.id === editingSeedingId)?.name ||
                    editingSeedingId}
                </span>

                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  <button
                    onClick={saveSeedingResults}
                    className="flex items-center gap-2 rounded bg-green-600 px-3 py-1 text-sm text-white transition-colors hover:bg-green-700"
                  >
                    <FaSave /> Guardar
                  </button>
                  <button
                    onClick={cancelSeedingEdit}
                    className="flex items-center gap-2 rounded bg-red-600 px-3 py-1 text-sm text-white transition-colors hover:bg-red-700"
                  >
                    <FaTimes /> Cancelar
                  </button>
                </div>
              </div>

              {seedingErrorMsg && (
                <div className="w-fit rounded border border-red-200 bg-red-50 p-2 text-xs font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-500/10 dark:text-red-200">
                  {seedingErrorMsg}
                </div>
              )}
            </div>
          )}

          <div className="mb-4 flex flex-wrap items-center justify-center gap-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 sm:text-sm">
            <div className="flex items-center gap-1">
              <BsTrophyFill className="text-yellow-500 dark:text-yellow-400" />{' '}
              Best (Mejor)
            </div>
            <div className="flex items-center gap-1">
              <BsGraphUp className="text-green-600 dark:text-green-400" />{' '}
              Average (Promedio)
            </div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-yellow-600 dark:text-yellow-400">
                +2
              </span>{' '}
              Penalización 2 seg
            </div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-red-600 dark:text-red-400">
                DNF
              </span>{' '}
              Did Not Finish
            </div>
          </div>

          <div className="overflow-hidden rounded-xl bg-white shadow-lg dark:bg-gray-900">
            {(() => {
              const compIds = competitors.map((c) => c.id);
              const results: any[] = currentRound.results || [];
              const ranked = compIds
                .map((cid) => {
                  const comp = competitors.find((c) => c.id === cid);
                  const result = results.find(
                    (r: any) => r.idCompetitor === cid,
                  );
                  const times = (result?.times || []).map(normalizeTime);
                  const stats = calculateRulesStats(
                    times,
                    (currentRound.format || 'ao5') as 'ao3' | 'ao5',
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

              const bracketExists =
                currentCategory && currentCategory.rounds.length > 1;
              const firstBracketRound = bracketExists
                ? currentCategory.rounds.find((r: any) => !r.isSeeding)
                : null;
              const byedIds = new Set<string>();

              if (
                firstBracketRound &&
                firstBracketRound.matches &&
                firstBracketRound.matches.length > 0
              ) {
                const matchCompIds = new Set<string>();

                firstBracketRound.matches.forEach((m: any) => {
                  if (m.competitor1 && m.competitor1.id)
                    matchCompIds.add(m.competitor1.id);
                  if (m.competitor2 && m.competitor2.id)
                    matchCompIds.add(m.competitor2.id);
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
                            ? 'border-yellow-500'
                            : i === 1
                            ? 'border-gray-400'
                            : i === 2
                            ? 'border-amber-700'
                            : 'border-gray-200 dark:border-gray-700'
                        } ${
                          byedIds.has(p.id)
                            ? 'bg-green-50 dark:bg-green-500/10'
                            : 'bg-gray-50 dark:bg-gray-800'
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
                                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                              }`}
                            >
                              {i + 1}
                            </span>
                            <h3 className="truncate font-medium text-gray-900 dark:text-gray-100">
                              {p.name}
                            </h3>
                          </div>

                          <div className="flex gap-2">
                            <span className="flex items-center gap-1 rounded bg-blue-600 px-2 py-1 text-xs text-white">
                              <BsTrophyFill size={10} />{' '}
                              {p.best > 0
                                ? formatSecondsToDisplay(p.best)
                                : p.best === -1
                                ? 'DNF'
                                : '-'}
                            </span>
                            <span className="flex items-center gap-1 rounded bg-green-600 px-2 py-1 text-xs text-white">
                              <BsGraphUp size={10} />{' '}
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
                            const t = p.times[ti] || {
                              base: 0,
                              penalty: '' as Penalty,
                            };
                            const nt = normalizeTime(t);
                            const isDnf = nt.penalty === 'DNF';
                            const val =
                              isDnf || (nt.base <= 0 && nt.penalty !== 'DNF')
                                ? -1
                                : nt.base + (nt.penalty === '+2' ? 2 : 0);
                            const bestHighlight = val === p.best && val > 0;

                            if (editMode && editingSeedingId === p.id) {
                              const ct = seedingTempTimes[ti] || {
                                base: 0,
                                penalty: '' as Penalty,
                              };

                              return (
                                <div
                                  key={ti}
                                  className="flex flex-col items-center"
                                >
                                  <label className="mb-0.5 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                    <MdOutlineTimer size={10} /> T{ti + 1}
                                  </label>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={ct.base === 0 ? '' : ct.base}
                                    onChange={(e) =>
                                      handleSeedingTimeChange(
                                        ti,
                                        e.target.value,
                                      )
                                    }
                                    onBlur={(e) =>
                                      handleSeedingTimeBlur(ti, e.target.value)
                                    }
                                    className="w-full rounded border border-blue-500 bg-white px-1 py-1 text-center text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:ring-blue-400"
                                    placeholder="0.00"
                                  />
                                  <div className="mt-0.5 flex gap-1">
                                    <button
                                      onClick={() =>
                                        handleSeedingPenaltyChange(ti, '+2')
                                      }
                                      tabIndex={-1}
                                      className={`rounded px-1 py-0.5 text-[9px] ${
                                        ct.penalty === '+2'
                                          ? 'bg-yellow-600 text-white'
                                          : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300'
                                      }`}
                                    >
                                      +2
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleSeedingPenaltyChange(ti, 'DNF')
                                      }
                                      tabIndex={-1}
                                      className={`rounded px-1 py-0.5 text-[9px] ${
                                        ct.penalty === 'DNF'
                                          ? 'bg-red-600 text-white'
                                          : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300'
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
                                key={ti}
                                className="flex cursor-pointer flex-col items-center"
                                onClick={() => {
                                  if (editMode) {
                                    if (
                                      editingSeedingId &&
                                      editingSeedingId !== p.id
                                    )
                                      saveSeedingResults();
                                    else startSeedingEdit(p.id);
                                  }
                                }}
                              >
                                <label className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                  <MdOutlineTimer size={10} /> T{ti + 1}
                                </label>
                                <div
                                  className={`w-full rounded py-1 text-center text-sm ${
                                    bestHighlight
                                      ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300'
                                      : isDnf
                                      ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'
                                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
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
                <table className="w-full bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800">
                      <th className="w-12 px-4 py-3 text-left text-gray-700 dark:text-gray-300">
                        #
                      </th>
                      <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <MdPeople className="text-blue-600 dark:text-blue-400" />
                          <span>Competidor</span>
                        </div>
                      </th>
                      {currentRound.format === 'ao5' && (
                        <>
                          <th className="px-2 py-3 text-center">
                            <div className="flex flex-col items-center">
                              <MdOutlineTimer className="mb-1 text-gray-500 dark:text-gray-400" />
                              <span className="text-xs text-gray-600 dark:text-gray-300">
                                T1
                              </span>
                            </div>
                          </th>
                          <th className="px-2 py-3 text-center">
                            <div className="flex flex-col items-center">
                              <MdOutlineTimer className="mb-1 text-gray-500 dark:text-gray-400" />
                              <span className="text-xs text-gray-600 dark:text-gray-300">
                                T2
                              </span>
                            </div>
                          </th>
                          <th className="px-2 py-3 text-center">
                            <div className="flex flex-col items-center">
                              <MdOutlineTimer className="mb-1 text-gray-500 dark:text-gray-400" />
                              <span className="text-xs text-gray-600 dark:text-gray-300">
                                T3
                              </span>
                            </div>
                          </th>
                          <th className="px-2 py-3 text-center">
                            <div className="flex flex-col items-center">
                              <MdOutlineTimer className="mb-1 text-gray-500 dark:text-gray-400" />
                              <span className="text-xs text-gray-600 dark:text-gray-300">
                                T4
                              </span>
                            </div>
                          </th>
                          <th className="px-2 py-3 text-center">
                            <div className="flex flex-col items-center">
                              <MdOutlineTimer className="mb-1 text-gray-500 dark:text-gray-400" />
                              <span className="text-xs text-gray-600 dark:text-gray-300">
                                T5
                              </span>
                            </div>
                          </th>
                        </>
                      )}
                      {currentRound.format === 'ao3' && (
                        <>
                          <th className="px-2 py-3 text-center">
                            <div className="flex flex-col items-center">
                              <MdOutlineTimer className="mb-1 text-gray-500 dark:text-gray-400" />
                              <span className="text-xs text-gray-600 dark:text-gray-300">
                                T1
                              </span>
                            </div>
                          </th>
                          <th className="px-2 py-3 text-center">
                            <div className="flex flex-col items-center">
                              <MdOutlineTimer className="mb-1 text-gray-500 dark:text-gray-400" />
                              <span className="text-xs text-gray-600 dark:text-gray-300">
                                T2
                              </span>
                            </div>
                          </th>
                          <th className="px-2 py-3 text-center">
                            <div className="flex flex-col items-center">
                              <MdOutlineTimer className="mb-1 text-gray-500 dark:text-gray-400" />
                              <span className="text-xs text-gray-600 dark:text-gray-300">
                                T3
                              </span>
                            </div>
                          </th>
                        </>
                      )}
                      <th className="px-3 py-3 text-center">
                        <div className="flex flex-col items-center">
                          <BsTrophyFill className="mb-1 text-yellow-500 dark:text-yellow-400" />
                          <span className="text-xs text-gray-600 dark:text-gray-300">
                            Best
                          </span>
                        </div>
                      </th>
                      <th className="px-3 py-3 text-center">
                        <div className="flex flex-col items-center">
                          <BsGraphUp className="mb-1 text-green-600 dark:text-green-400" />
                          <span className="text-xs text-gray-600 dark:text-gray-300">
                            Avg
                          </span>
                        </div>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {ranked.map((p, i) => (
                      <tr
                        key={p.id}
                        className={`border-b border-gray-200 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800 ${
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
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
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
                          const t = p.times[ti] || {
                            base: 0,
                            penalty: '' as Penalty,
                          };

                          const isBest =
                            (t.base > 0 || t.penalty === 'DNF') &&
                            normalizeTime(t).base +
                              (normalizeTime(t).penalty === '+2' ? 2 : 0) ===
                              p.best &&
                            p.best > 0;

                          if (editMode && editingSeedingId === p.id) {
                            const ct = seedingTempTimes[ti] || {
                              base: 0,
                              penalty: '' as Penalty,
                            };

                            return (
                              <td key={ti} className="px-2 py-3">
                                <div className="flex flex-col items-center gap-1">
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={ct.base === 0 ? '' : ct.base}
                                    onChange={(e) =>
                                      handleSeedingTimeChange(
                                        ti,
                                        e.target.value,
                                      )
                                    }
                                    onBlur={(e) =>
                                      handleSeedingTimeBlur(ti, e.target.value)
                                    }
                                    className="w-16 rounded border border-blue-500 bg-white px-1 py-1 text-center text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:ring-blue-400"
                                    placeholder="0.00"
                                  />
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() =>
                                        handleSeedingPenaltyChange(ti, '+2')
                                      }
                                      tabIndex={-1}
                                      className={`rounded px-1 py-0.5 text-[10px] ${
                                        ct.penalty === '+2'
                                          ? 'bg-yellow-600 text-white'
                                          : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300'
                                      }`}
                                    >
                                      +2
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleSeedingPenaltyChange(ti, 'DNF')
                                      }
                                      tabIndex={-1}
                                      className={`rounded px-1 py-0.5 text-[10px] ${
                                        ct.penalty === 'DNF'
                                          ? 'bg-red-600 text-white'
                                          : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300'
                                      }`}
                                    >
                                      DNF
                                    </button>
                                  </div>
                                </div>
                              </td>
                            );
                          }

                          return (
                            <td
                              key={ti}
                              className={`px-2 py-3 text-center text-sm ${
                                editMode
                                  ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800'
                                  : ''
                              } ${
                                isBest
                                  ? 'font-bold text-green-600 dark:text-green-400'
                                  : t.penalty === 'DNF'
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-gray-700 dark:text-gray-300'
                              }`}
                              onClick={() => {
                                if (editMode) {
                                  if (
                                    editingSeedingId &&
                                    editingSeedingId !== p.id
                                  )
                                    saveSeedingResults();
                                  else startSeedingEdit(p.id);
                                }
                              }}
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

      {currentRound &&
        !currentRound.isSeeding &&
        currentRound.matches.length > 0 && (
          <>
            {(() => {
              const hasSeeding = currentCategory?.rounds[0]?.isSeeding;
              const firstBracketIdx = hasSeeding ? 1 : 0;
              const isFirstBracket =
                currentCategory?.rounds.findIndex(
                  (r) => r.roundNumber === currentRound.roundNumber,
                ) === firstBracketIdx;
              if (!isFirstBracket) return null;

              const allCatIds = competitors.map((c) => c.id);
              const inMatches = new Set<string>();
              currentRound.matches.forEach((m) => {
                if (m.competitor1.id) inMatches.add(m.competitor1.id);
                if (m.competitor2.id) inMatches.add(m.competitor2.id);
              });
              const byed = allCatIds.filter((cid) => !inMatches.has(cid));
              if (byed.length > 0)
                return (
                  <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/50 dark:bg-green-500/10">
                    <div className="mb-2 flex items-center gap-2">
                      <FaTrophy className="text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">
                        Pase directo a siguiente ronda ({byed.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {byed.map((cid) => (
                        <span
                          key={cid}
                          className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800 dark:bg-green-500/20 dark:text-green-200"
                        >
                          {getCompetitorName(cid)}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              return null;
            })()}

            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {currentRound.matches.map((match) => (
                <div
                  key={match.id}
                  className={`rounded-lg p-4 transition-colors ${
                    editMode
                      ? 'cursor-pointer border border-gray-300 bg-gray-100 hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700'
                      : 'bg-gray-50 dark:bg-gray-800'
                  } ${match.winner ? 'border-t-4 border-green-500' : ''}`}
                  onClick={() => {
                    if (
                      editMode &&
                      match.competitor1.id &&
                      match.competitor2.id
                    ) {
                      startEditing(match);
                    }
                  }}
                >
                  {currentRound.bracketMode === 'manual' && editMode ? (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 text-left">
                          <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                            Competidor 1
                          </div>
                          <select
                            value={match.competitor1.id}
                            onChange={(e) =>
                              handleManualAssign(
                                match.id,
                                'competitor1',
                                e.target.value,
                              )
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:ring-blue-400"
                          >
                            <option value="">-- Seleccionar --</option>
                            {getUnassignedIds(
                              'competitor1',
                              match.competitor1.id,
                            ).map((cid) => (
                              <option key={cid} value={cid}>
                                {getCompetitorName(cid)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="mx-2">
                          <GiBoxingGlove className="text-xl text-red-500 dark:text-red-400" />
                        </div>

                        <div className="flex-1 text-right">
                          <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                            Competidor 2
                          </div>
                          <select
                            value={match.competitor2.id}
                            onChange={(e) =>
                              handleManualAssign(
                                match.id,
                                'competitor2',
                                e.target.value,
                              )
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:ring-blue-400"
                          >
                            <option value="">-- Seleccionar --</option>
                            {getUnassignedIds(
                              'competitor2',
                              match.competitor2.id,
                            ).map((cid) => (
                              <option key={cid} value={cid}>
                                {getCompetitorName(cid)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {match.competitor1.id && match.competitor2.id ? (
                        <div className="mt-3 border-t border-gray-300 pt-3 text-center dark:border-gray-600">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditing(match);
                            }}
                            className="mx-auto flex items-center gap-1 text-xs text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <FaEdit size={10} /> Editar tiempos
                          </button>
                        </div>
                      ) : null}
                    </>
                  ) : (
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
                          {(match.times.competitor1 || []).map(
                            (t: any, i: number) => {
                              const ot = match.times.competitor2?.[i];
                              const isWin =
                                t && ot && t.base > 0 && ot.base > 0
                                  ? t.base + (t.penalty === '+2' ? 2 : 0) <
                                      ot.base + (ot.penalty === '+2' ? 2 : 0) &&
                                    t.penalty !== 'DNF'
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
                                        : t && t.base > 0
                                        ? 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-200'
                                        : 'bg-white text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                                    }`}
                                  >
                                    {t && t.base > 0
                                      ? formatTimeDisplay(t, true)
                                      : '-'}
                                  </div>
                                </div>
                              );
                            },
                          )}
                        </div>
                      </div>

                      <div className="my-1 text-center">
                        <span className="inline-block rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                          <GiBoxingGlove
                            className="mr-1 inline text-red-500 dark:text-red-400"
                            size={12}
                          />
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
                          {(match.times.competitor2 || []).map(
                            (t: any, i: number) => {
                              const ot = match.times.competitor1?.[i];
                              const isWin =
                                t && ot && t.base > 0 && ot.base > 0
                                  ? t.base + (t.penalty === '+2' ? 2 : 0) <
                                      ot.base + (ot.penalty === '+2' ? 2 : 0) &&
                                    t.penalty !== 'DNF'
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
                                        : t && t.base > 0
                                        ? 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-200'
                                        : 'bg-white text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                                    }`}
                                  >
                                    {t && t.base > 0
                                      ? formatTimeDisplay(t, true)
                                      : '-'}
                                  </div>
                                </div>
                              );
                            },
                          )}
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
                  )}
                </div>
              ))}
            </div>
          </>
        )}

      {currentRound &&
        !currentRound.isSeeding &&
        currentRound.matches.length > 0 &&
        currentRound.matches.every((m) => m.winner) && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-500/10">
            <div className="mb-2 flex items-center gap-2">
              <BsGraphUp className="text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Avanza a la siguiente ronda
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {currentRound.matches
                .map((m) => m.winner)
                .filter(Boolean)
                .map((cid: string | undefined) => (
                  <span
                    key={cid}
                    className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-500/20 dark:text-blue-200"
                  >
                    {getCompetitorName(cid!)}
                  </span>
                ))}
            </div>
          </div>
        )}

      {currentRound &&
        !currentRound.isSeeding &&
        currentRound.matches.length === 0 &&
        currentCategory &&
        currentCategory.rounds.length > 1 && (
          <div className="mt-0 flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 py-12 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
            <FaInfoCircle
              size={28}
              className="opacity-60 text-gray-400 dark:text-gray-500"
            />
            <p className="max-w-md text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Completa los enfrentamientos de la ronda anterior para ver los de
              esta ronda.
            </p>
          </div>
        )}

      {currentRound &&
        !currentRound.isSeeding &&
        currentRound.matches.length === 0 &&
        !(currentCategory && currentCategory.rounds.length > 1) &&
        canEdit &&
        currentRound.bracketMode === 'random' && (
          <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 py-12 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
            <FaRandom
              size={28}
              className="opacity-60 text-gray-400 dark:text-gray-500"
            />
            <p className="max-w-md text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Presiona{' '}
              <strong className="text-gray-900 dark:text-gray-100">
                "Generar Brackets"
              </strong>{' '}
              para crear los enfrentamientos aleatorios.
            </p>
          </div>
        )}

      {currentRound &&
        !currentRound.isSeeding &&
        currentRound.matches.length === 0 &&
        !(currentCategory && currentCategory.rounds.length > 1) &&
        canEdit &&
        currentRound.bracketMode === 'manual' && (
          <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 py-12 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
            <FaRandom
              size={28}
              className="opacity-60 text-gray-400 dark:text-gray-500"
            />
            <p className="max-w-md text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Presiona{' '}
              <strong className="text-gray-900 dark:text-gray-100">
                "Generar Brackets"
              </strong>{' '}
              para crear los slots y asigna competidores manualmente.
            </p>
          </div>
        )}

      {currentRound &&
        !currentRound.isSeeding &&
        currentRound.matches.length === 0 &&
        !(currentCategory && currentCategory.rounds.length > 1) &&
        !canEdit && (
          <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 py-12 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
            <GiLaurelsTrophy
              size={28}
              className="opacity-60 text-gray-400 dark:text-gray-500"
            />
            <p className="max-w-md text-sm sm:text-base text-gray-600 dark:text-gray-300">
              No hay enfrentamientos generados para esta ronda.
            </p>
          </div>
        )}

      {currentRound?.isSeeding &&
        currentRound.results &&
        currentRound.results.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 py-12 text-center dark:border-gray-700 dark:bg-gray-800">
            <MdLeaderboard
              size={28}
              className="opacity-60 text-gray-400 dark:text-gray-500"
            />

            <p className="max-w-md text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Activa la edición e ingresa los tiempos de clasificación.
            </p>

            {canEdit && (
              <p className="max-w-md text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Haz clic en una celda de tiempo para empezar a editar.
              </p>
            )}
          </div>
        )}

      {editingMatch && editMode && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Detalles del enfrentamiento
              </h3>
              <button
                onClick={cancelEditing}
                className="text-gray-400 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
              >
                <FaTimes />
              </button>
            </div>

            <div className="mb-4 text-center text-sm text-blue-600 dark:text-blue-400">
              {currentCategory?.name} — {currentRound?.name}
            </div>

            {errorMsg && (
              <div className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-500/10 dark:text-red-200">
                {errorMsg}
              </div>
            )}

            <div className="space-y-6">
              {/* Competidor 1 */}
              <div
                className={`rounded-lg p-4 ${
                  editingMatch.winner === editingMatch.competitor1.id
                    ? 'border border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-500/10'
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}
              >
                <div className="mb-3 text-center text-lg font-medium text-gray-900 dark:text-gray-100">
                  {editingMatch.competitor1.name || 'Sin asignar'}
                </div>

                <div className="mb-3 grid grid-cols-3 gap-3">
                  {[0, 1, 2].map((i) => {
                    const t = tempTimes.competitor1[i] || {
                      base: 0,
                      penalty: '' as Penalty,
                    };

                    return (
                      <div key={i} className="text-center">
                        <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                          Tiempo {i + 1}
                        </div>

                        <input
                          type="text"
                          inputMode="decimal"
                          value={t.base === 0 ? '' : t.base}
                          onChange={(e) =>
                            handleTimeChange('competitor1', i, e.target.value)
                          }
                          onBlur={(e) =>
                            handleTimeBlur('competitor1', i, e.target.value)
                          }
                          className="w-full rounded border border-blue-500 bg-white px-1 py-1 text-center text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:ring-blue-400"
                          placeholder="0.00"
                        />

                        <div className="mt-0.5 flex justify-center gap-1">
                          <button
                            onClick={() =>
                              handlePenaltyChange('competitor1', i, '+2')
                            }
                            tabIndex={-1}
                            className={`rounded px-1 py-0.5 text-[9px] ${
                              t.penalty === '+2'
                                ? 'bg-yellow-600 text-white'
                                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                          >
                            +2
                          </button>

                          <button
                            onClick={() =>
                              handlePenaltyChange('competitor1', i, 'DNF')
                            }
                            tabIndex={-1}
                            className={`rounded px-1 py-0.5 text-[9px] ${
                              t.penalty === 'DNF'
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                          >
                            DNF
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="text-center">
                  <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                    {editingMatch.wins.competitor1} de 3 victorias
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="rounded-full bg-gray-100 px-4 py-1 text-sm font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                  <GiBoxingGlove
                    className="mr-1 inline text-red-500 dark:text-red-400"
                    size={14}
                  />
                  VS
                </div>
              </div>

              {/* Competidor 2 */}
              <div
                className={`rounded-lg p-4 ${
                  editingMatch.winner === editingMatch.competitor2.id
                    ? 'border border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-500/10'
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}
              >
                <div className="mb-3 text-center text-lg font-medium text-gray-900 dark:text-gray-100">
                  {editingMatch.competitor2.name || 'Sin asignar'}
                </div>

                <div className="mb-3 grid grid-cols-3 gap-3">
                  {[0, 1, 2].map((i) => {
                    const t = tempTimes.competitor2[i] || {
                      base: 0,
                      penalty: '' as Penalty,
                    };

                    return (
                      <div key={i} className="text-center">
                        <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                          Tiempo {i + 1}
                        </div>

                        <input
                          type="text"
                          inputMode="decimal"
                          value={t.base === 0 ? '' : t.base}
                          onChange={(e) =>
                            handleTimeChange('competitor2', i, e.target.value)
                          }
                          onBlur={(e) =>
                            handleTimeBlur('competitor2', i, e.target.value)
                          }
                          className="w-full rounded border border-blue-500 bg-white px-1 py-1 text-center text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:ring-blue-400"
                          placeholder="0.00"
                        />

                        <div className="mt-0.5 flex justify-center gap-1">
                          <button
                            onClick={() =>
                              handlePenaltyChange('competitor2', i, '+2')
                            }
                            tabIndex={-1}
                            className={`rounded px-1 py-0.5 text-[9px] ${
                              t.penalty === '+2'
                                ? 'bg-yellow-600 text-white'
                                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                          >
                            +2
                          </button>

                          <button
                            onClick={() =>
                              handlePenaltyChange('competitor2', i, 'DNF')
                            }
                            tabIndex={-1}
                            className={`rounded px-1 py-0.5 text-[9px] ${
                              t.penalty === 'DNF'
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                          >
                            DNF
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="text-center">
                  <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                    {editingMatch.wins.competitor2} de 3 victorias
                  </span>
                </div>
              </div>

              {/* Resultado final */}
              <div className="rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-750">
                <div className="mb-2 font-medium text-gray-900 dark:text-gray-100">
                  Resultado final:
                </div>

                {editingMatch.winner ? (
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">
                    {editingMatch.winner === editingMatch.competitor1.id
                      ? editingMatch.competitor1.name
                      : editingMatch.competitor2.name}{' '}
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

            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={cancelEditing}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-100 px-4 py-2 text-gray-800 transition-colors hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
              >
                <FaTimes /> Cancelar
              </button>

              <button
                onClick={saveMatch}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
              >
                <FaSave /> Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {editMode && !editingMatch && !editingSeedingId && (
        <div className="fixed bottom-4 right-4 bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50">
          <FaEdit /> Modo edición activado
        </div>
      )}

      <div className="mt-12 border-t border-gray-200 pb-8 pt-6 dark:border-gray-700">
        <div className="mb-6 rounded-lg bg-gray-50 p-5 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          <h4 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">
            ¿Cómo funciona esta sección?
          </h4>
          <p className="leading-relaxed">
            En esta sección gestionas los enfrentamientos del formato Red Bull.
            Utiliza{' '}
            <strong className="text-gray-900 dark:text-gray-100">
              Activar edición
            </strong>{' '}
            para modificar tiempos y resultados. La{' '}
            <strong className="text-gray-900 dark:text-gray-100">
              ronda de clasificación
            </strong>{' '}
            usa el sistema Smart Input (WCA): escribe "987" = 9.87, "55678" =
            5:56.78. Usa los botones{' '}
            <strong className="text-gray-900 dark:text-gray-100">+2</strong> y{' '}
            <strong className="text-gray-900 dark:text-gray-100">DNF</strong>{' '}
            para penalizaciones oficiales. El ranking se calcula automáticamente
            con promedios ao3/ao5 y determina los pases directos (byes). Los
            enfrentamientos son al mejor de 3.
          </p>
        </div>

        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          © 2026 ruTournament - Sebastian Daza Pérez
        </div>
      </div>

      {showGenerateConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400">
              <FaRandom size={20} />
            </div>

            <h3 className="mb-2 text-center text-xl font-bold text-gray-900 dark:text-gray-100">
              ¿Generar Brackets?
            </h3>

            <p className="mb-6 text-center text-sm text-gray-600 dark:text-gray-300">
              Se{' '}
              {currentCategory && currentCategory.rounds.length > 1
                ? 'regenerarán'
                : 'generarán'}{' '}
              todas las rondas y enfrentamientos. Los datos actuales serán
              reemplazados. Esta acción no se puede deshacer.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => setShowGenerateConfirm(false)}
                className="flex-1 rounded-lg border border-gray-200 bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>

              <button
                onClick={() => {
                  setShowGenerateConfirm(false);
                  generateBrackets(
                    (currentCategory as any)?.bracketMode || 'random',
                  );
                }}
                className="flex flex-1 justify-center rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
              >
                Sí, Generar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsRB;
