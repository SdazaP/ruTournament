const STORAGE_KEY = 'ruTournament';

// tournaments
export const getTournaments = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const setTournaments = (tournaments) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tournaments));
};

export const newTournament = (tournament) => {
  const tournaments = getTournaments();
  tournament.id = Date.now().toString();
  tournament.name = tournament.name || "";
  tournament.description = tournament.description || "Torneo de Rubik";
  tournament.location = tournament.location || "Tlaxcala, México";
  tournament.status = tournament.status || "Proximamente";
  tournament.date = tournament.date || new Date().toISOString().split('T')[0];
  tournament.categories = [];
  tournament.competitors = [];

  tournaments.push(tournament);
  setTournaments(tournaments);
};

// categories
export const newCategory = (idTournament, category) => {
  const tournaments = getTournaments();
  const tournament = tournaments.find(t => t.id === idTournament);
  if (!tournament) return;

  category.id = Date.now().toString();
  category.name = category.name || "";
  category.format = category.format || "";
  category.rounds = [];

  tournament.categories.push(category);
  setTournaments(tournaments);
};

// Rounds
export const newRound = (idTournament, idCategory, round) => {
  const tournaments = getTournaments();
  const tournament = tournaments.find(t => t.id === idTournament);
  const category = tournament?.categories.find(c => c.id === idCategory);
  if (!category) return;

  round.id = Date.now().toString();
  round.num = round.num || 1;
  round.format = round.format || "ao5";
  round.results = [];

  category.rounds.push(round);
  setTournaments(tournaments);
};

// Competitors
export const newCompetitor = (idTournament, competitor) => {
  const tournaments = getTournaments();
  const tournament = tournaments.find(t => t.id === idTournament);
  if (!tournament) return;

  competitor.id = Date.now().toString();
  competitor.categories = [];

  tournament.competitors.push(competitor);
  setTournaments(tournaments);
};

export const newCompetitorToCategory = (idTournament, idCompetitor, idCategory) => {
  const tournaments = getTournaments();
  const tournament = tournaments.find(t => t.id === idTournament);
  const competitor = tournament?.competitors.find(p => p.id === idCompetitor);
  if (!competitor) return;

  if (!competitor.categories.includes(idCategory)) {
    competitor.categories.push(idCategory);
  }

  setTournaments(tournaments);
};

// Results (función actualizada)
export const addResult = (idTournament, idCategory, roundNum, result) => {
  const tournaments = getTournaments();
  const tournament = tournaments.find(t => t.id === idTournament);
  if (!tournament) {
    console.error('Tournament not found');
    return;
  }

  const category = tournament.categories.find(c => c.id === idCategory);
  if (!category) {
    console.error('Category not found');
    return;
  }

  const round = category.rounds.find(r => r.num === roundNum);
  if (!round) {
    console.error('Round not found');
    return;
  }

  const expectedLength = round.format === 'ao5' ? 5 : 3;
  const times = result.times && result.times.length > 0 
    ? result.times.map(t => typeof t === 'string' ? parseFloat(t) : t)
    : Array(expectedLength).fill(0);

  // Calcular best y average según el formato
  const validTimes = times.filter(t => t > 0);
  const best = validTimes.length > 0 ? Math.min(...validTimes) : 0;
  
  let average = 0;
  if (round.format === 'ao3' && validTimes.length >= 3) {
    average = validTimes.slice(0, 3).reduce((sum, t) => sum + t, 0) / 3;
  } else if (round.format === 'ao5' && validTimes.length >= 5) {
    const sorted = [...validTimes].sort((a, b) => a - b);
    average = sorted.slice(1, 4).reduce((sum, t) => sum + t, 0) / 3;
  }

  const updatedResult = {
    idCompetitor: result.idCompetitor.toString(), // Asegurar string
    times,
    media: average.toFixed(2)
  };

  if (!round.results) round.results = [];
  
  const existingIndex = round.results.findIndex(
    r => r.idCompetitor === updatedResult.idCompetitor
  );
  
  if (existingIndex >= 0) {
    round.results[existingIndex] = updatedResult;
  } else {
    round.results.push(updatedResult);
  }

  setTournaments(tournaments);
};

