import React, { useState } from 'react';
import { FaTrophy, FaMedal, FaEdit, FaSave, FaTimes, FaCrown, FaUser } from 'react-icons/fa';
import { MdSportsScore, MdOutlineTimer, MdCategory } from 'react-icons/md';
import { GiBoxingGlove, GiLaurelsTrophy } from 'react-icons/gi';

type Competitor = {
  id: number;
  name: string;
  times: number[];
  wins: number; // Número de enfrentamientos ganados (0-3)
};

type Match = {
  id: number;
  competitor1: Competitor;
  competitor2: Competitor;
  winner?: number; // ID del competidor ganador (quien tenga 2 wins)
};

type Round = {
  roundNumber: number;
  name: string;
  matches: Match[];
};

type Category = {
  id: number;
  name: string;
  rounds: Round[];
};

const ResultsRB = () => {
  // Estado para las categorías con datos de ejemplo
  const [categories, setCategories] = useState<Category[]>([
    {
      id: 1,
      name: '3x3',
      rounds: [
        {
          roundNumber: 1,
          name: '16vos',
          matches: [
            {
              id: 1,
              competitor1: {
                id: 1,
                name: 'Participante 1',
                times: [15.2, 14.8, 16.1],
                wins: 1,
              },
              competitor2: {
                id: 2,
                name: 'Participante 2',
                times: [12.5, 13.3, 11.9],
                wins: 2,
              },
              winner: 2,
            },
            {
              id: 2,
              competitor1: {
                id: 3,
                name: 'Participante 3',
                times: [10.5, 9.8, 11.2],
                wins: 2,
              },
              competitor2: {
                id: 4,
                name: 'Participante 4',
                times: [14.2, 13.5, 15.1],
                wins: 1,
              },
              winner: 3,
            },
          ],
        },
      ],
    },
  ]);

  const [selectedCategory, setSelectedCategory] = useState<number>(1);
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const currentCategory = categories.find((c) => c.id === selectedCategory);
  const currentRound = currentCategory?.rounds.find(
    (r) => r.roundNumber === selectedRound,
  );

  const determineWinner = (match: Match): Match => {
    let winner;
    if (match.competitor1.wins >= 2) {
      winner = match.competitor1.id;
    } else if (match.competitor2.wins >= 2) {
      winner = match.competitor2.id;
    }
    return { ...match, winner };
  };

  const handleTimeChange = (
    competitorId: number,
    timeIndex: number,
    value: string,
    isWin: boolean
  ) => {
    if (!selectedMatch) return;

    const newTime = parseFloat(value) || 0;
    const isCompetitor1 = selectedMatch.competitor1.id === competitorId;
    const competitorKey = isCompetitor1 ? 'competitor1' : 'competitor2';

    // Actualizar el tiempo y el estado de victoria
    const updatedCompetitor = {
      ...selectedMatch[competitorKey],
      times: selectedMatch[competitorKey].times.map((t, i) => 
        i === timeIndex ? newTime : t
      )
    };

    // Si estamos marcando este tiempo como victoria/derrota
    if (isWin !== undefined) {
      updatedCompetitor.wins = selectedMatch[competitorKey].times
        .map((t, i) => i === timeIndex ? isWin : t < selectedMatch[competitorKey === 'competitor1' ? 'competitor2' : 'competitor1'].times[i])
        .filter(Boolean).length;
    }

    const updatedMatch = {
      ...selectedMatch,
      [competitorKey]: updatedCompetitor
    };

    setSelectedMatch(determineWinner(updatedMatch));
  };

  const handleSaveMatch = () => {
    if (!selectedMatch) return;

    setCategories(
      categories.map((category) => {
        if (category.id !== selectedCategory) return category;

        return {
          ...category,
          rounds: category.rounds.map((round) => {
            if (round.roundNumber !== selectedRound) return round;

            return {
              ...round,
              matches: round.matches.map((match) =>
                match.id === selectedMatch.id ? selectedMatch : match
              ),
            };
          }),
        };
      }),
    );

    setIsEditing(false);
  };

  return (
    <div className="text-white p-4 md:p-6 lg:p-8">
      {/* Encabezado */}
      <div className="flex items-center gap-3 mb-6">
        <GiLaurelsTrophy className="text-red-500 text-2xl" />
        <h2 className="text-xl sm:text-2xl font-bold">Resultados Red Bull</h2>
      </div>

      {/* Selectores */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs sm:text-sm text-gray-400 mb-1 flex items-center gap-2">
            <MdCategory className="text-blue-400" /> Categoría
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(parseInt(e.target.value));
              setSelectedRound(1);
              setSelectedMatch(null);
            }}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs sm:text-sm text-gray-400 mb-1 flex items-center gap-2">
             Ronda
          </label>
          <select
            value={selectedRound}
            onChange={(e) => {
              setSelectedRound(parseInt(e.target.value));
              setSelectedMatch(null);
            }}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {currentCategory?.rounds.map((round) => (
              <option key={round.roundNumber} value={round.roundNumber}>
                {round.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de enfrentamientos */}
      {currentRound && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {currentRound.matches.map((match) => (
            <div
              key={match.id}
              onClick={() => {
                setSelectedMatch(match);
                setIsEditing(true);
              }}
              className={`bg-gray-750 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors ${
                match.winner ? 'border-t-4 border-red-500' : ''
              }`}
            >
              <div className="flex justify-between items-center">
                {/* Competidor 1 */}
                <div className={`text-left p-3 rounded-lg flex-1 ${
                  match.winner === match.competitor1.id 
                    ? 'bg-gradient-to-r from-red-900/30 to-transparent' 
                    : 'bg-gray-700'
                }`}>
                  <div className="font-medium flex items-center gap-2">
                    {match.winner === match.competitor1.id && <FaCrown className="text-yellow-400" />}
                    <FaUser className="text-blue-400" />
                    {match.competitor1.name}
                  </div>
                  <div className="text-xs text-blue-400 flex items-center gap-1 mt-1">
                    <FaTrophy className="text-yellow-400" />
                    Victorias: {match.competitor1.wins}/3
                  </div>
                </div>

                {/* VS */}
                <div className="mx-2 flex flex-col items-center">
                  <GiBoxingGlove className="text-red-500 text-xl" />
                  <span className="text-xs text-gray-400">VS</span>
                </div>

                {/* Competidor 2 */}
                <div className={`text-right p-3 rounded-lg flex-1 ${
                  match.winner === match.competitor2.id 
                    ? 'bg-gradient-to-l from-red-900/30 to-transparent' 
                    : 'bg-gray-700'
                }`}>
                  <div className="font-medium flex items-center gap-2 justify-end">
                    {match.competitor2.name}
                    <FaUser className="text-blue-400" />
                    {match.winner === match.competitor2.id && <FaCrown className="text-yellow-400" />}
                  </div>
                  <div className="text-xs text-blue-400 flex items-center gap-1 justify-end mt-1">
                    Victorias: {match.competitor2.wins}/3
                    <FaTrophy className="text-yellow-400" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de edición */}
      {isEditing && selectedMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <MdSportsScore className="text-red-500" />
                Editar enfrentamiento
              </h3>
              <span className="text-sm bg-red-900/50 px-2 py-1 rounded flex items-center gap-1">
                {currentRound?.name}
              </span>
            </div>

            <div className="flex flex-col gap-6">
              {/* Competidores en lados opuestos */}
              <div className="flex justify-between">
                {/* Competidor 1 - Izquierda */}
                <div className="w-2/5">
                  <div className={`font-medium mb-2 text-center p-2 rounded-lg flex flex-col items-center ${
                    selectedMatch.winner === selectedMatch.competitor1.id 
                      ? 'bg-gradient-to-b from-green-900/50 to-transparent border border-green-500' 
                      : selectedMatch.winner === selectedMatch.competitor2.id 
                        ? 'bg-gradient-to-b from-red-900/50 to-transparent border border-red-500' 
                        : 'bg-gray-700'
                  }`}>
                    <FaUser className="text-blue-400 mb-1" />
                    {selectedMatch.competitor1.name}
                  </div>
                  
                  {/* Lista de tiempos */}
                  <div className="space-y-2">
                    {selectedMatch.competitor1.times.map((time, index) => {
                      const competitor2Time = selectedMatch.competitor2.times[index];
                      const isWin = time > 0 && competitor2Time > 0 && time < competitor2Time;
                      return (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="number"
                            value={time || ''}
                            onChange={(e) => handleTimeChange(
                              selectedMatch.competitor1.id,
                              index,
                              e.target.value,
                              isWin
                            )}
                            className={`w-full bg-gray-700 border rounded px-2 py-1 text-center text-sm ${
                              time > 0 && competitor2Time > 0
                                ? time < competitor2Time
                                  ? 'border-green-500 bg-green-900/20'
                                  : 'border-red-500 bg-red-900/20'
                                : 'border-gray-600'
                            }`}
                            step="0.01"
                            min="0"
                          />
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <MdOutlineTimer size={12} /> T{index + 1}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-center text-sm text-blue-400 mt-2 flex items-center justify-center gap-1">
                    <FaMedal className="text-yellow-400" />
                    Victorias: {selectedMatch.competitor1.wins}/3
                  </div>
                </div>

                {/* VS - Centro */}
                <div className="flex flex-col items-center justify-center mx-2">
                  <GiBoxingGlove className="text-red-500 text-2xl" />
                  <div className="text-xs text-gray-400 mt-1">VS</div>
                </div>

                {/* Competidor 2 - Derecha */}
                <div className="w-2/5">
                  <div className={`font-medium mb-2 text-center p-2 rounded-lg flex flex-col items-center ${
                    selectedMatch.winner === selectedMatch.competitor2.id 
                      ? 'bg-gradient-to-b from-green-900/50 to-transparent border border-green-500' 
                      : selectedMatch.winner === selectedMatch.competitor1.id 
                        ? 'bg-gradient-to-b from-red-900/50 to-transparent border border-red-500' 
                        : 'bg-gray-700'
                  }`}>
                    <FaUser className="text-blue-400 mb-1" />
                    {selectedMatch.competitor2.name}
                  </div>
                  
                  {/* Lista de tiempos */}
                  <div className="space-y-2">
                    {selectedMatch.competitor2.times.map((time, index) => {
                      const competitor1Time = selectedMatch.competitor1.times[index];
                      const isWin = time > 0 && competitor1Time > 0 && time < competitor1Time;
                      return (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <MdOutlineTimer size={12} /> T{index + 1}
                          </span>
                          <input
                            type="number"
                            value={time || ''}
                            onChange={(e) => handleTimeChange(
                              selectedMatch.competitor2.id,
                              index,
                              e.target.value,
                              isWin
                            )}
                            className={`w-full bg-gray-700 border rounded px-2 py-1 text-center text-sm ${
                              time > 0 && competitor1Time > 0
                                ? time < competitor1Time
                                  ? 'border-green-500 bg-green-900/20'
                                  : 'border-red-500 bg-red-900/20'
                                : 'border-gray-600'
                            }`}
                            step="0.01"
                            min="0"
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-center text-sm text-blue-400 mt-2 flex items-center justify-center gap-1">
                    <FaMedal className="text-yellow-400" />
                    Victorias: {selectedMatch.competitor2.wins}/3
                  </div>
                </div>
              </div>

              {/* Ganador */}
              <div className="mt-4 p-3 bg-gray-750 rounded-lg text-center flex flex-col items-center">
                <div className="flex items-center gap-2 mb-1">
                  <FaTrophy className="text-yellow-400" />
                  <span className="font-medium">Ganador:</span>
                </div>
                <span className="text-green-400 flex items-center gap-2">
                  {selectedMatch.winner === selectedMatch.competitor1.id ? (
                    <>
                      <FaCrown /> {selectedMatch.competitor1.name}
                    </>
                  ) : selectedMatch.winner === selectedMatch.competitor2.id ? (
                    <>
                      <FaCrown /> {selectedMatch.competitor2.name}
                    </>
                  ) : (
                    'Sin determinar (necesita 2 victorias)'
                  )}
                </span>
              </div>

              {/* Botones */}
              <div className="flex justify-center gap-3 mt-4">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2"
                >
                  <FaTimes /> Cancelar
                </button>
                <button
                  onClick={handleSaveMatch}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  <FaSave /> Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!currentRound && (
        <div className="text-center py-8 text-gray-400 flex flex-col items-center gap-2">
          <GiLaurelsTrophy className="text-3xl text-gray-500" />
          No hay datos disponibles para mostrar
        </div>
      )}
    </div>
  );
};

export default ResultsRB;