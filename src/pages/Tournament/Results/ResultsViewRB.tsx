import React, { useState } from 'react';

// Definición de tipos
type Competitor = {
  id: number;
  name: string;
  times: number[];
  wins: number;
};

type Match = {
  id: number;
  competitor1: Competitor;
  competitor2: Competitor;
  winner?: number;
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

// Datos de ejemplo
const sampleCategories: Category[] = [
  {
    id: 1,
    name: '3x3',
    rounds: [
      {
        roundNumber: 1,
        name: 'Octavos de final',
        matches: [
          {
            id: 1,
            competitor1: {
              id: 101,
              name: 'Juan Pérez',
              times: [12.34, 13.45, 11.89],
              wins: 2,
            },
            competitor2: {
              id: 102,
              name: 'María Gómez',
              times: [14.56, 15.23, 13.01],
              wins: 1,
            },
            winner: 101,
          },
          {
            id: 2,
            competitor1: {
              id: 103,
              name: 'Carlos Ruiz',
              times: [10.23, 9.87, 11.45],
              wins: 3,
            },
            competitor2: {
              id: 104,
              name: 'Ana López',
              times: [11.34, 12.56, 10.99],
              wins: 0,
            },
            winner: 103,
          },
          {
            id: 3,
            competitor1: {
              id: 105,
              name: 'David Torres',
              times: [15.67, 14.89, 16.23],
              wins: 1,
            },
            competitor2: {
              id: 106,
              name: 'Sofía Castro',
              times: [13.45, 12.78, 14.56],
              wins: 2,
            },
            winner: 106,
          },
          {
            id: 4,
            competitor1: {
              id: 107,
              name: 'Pedro Mendoza',
              times: [9.45, 10.23, 8.99],
              wins: 2,
            },
            competitor2: {
              id: 108,
              name: 'Laura Jiménez',
              times: [10.56, 11.34, 9.87],
              wins: 1,
            },
            winner: 107,
          },
        ],
      },
      {
        roundNumber: 2,
        name: 'Cuartos de final',
        matches: [
          {
            id: 5,
            competitor1: {
              id: 101,
              name: 'Juan Pérez',
              times: [12.45, 11.89, 13.23],
              wins: 1,
            },
            competitor2: {
              id: 103,
              name: 'Carlos Ruiz',
              times: [10.56, 11.34, 12.01],
              wins: 2,
            },
            winner: 103,
          },
          {
            id: 6,
            competitor1: {
              id: 106,
              name: 'Sofía Castro',
              times: [13.67, 12.89, 14.23],
              wins: 2,
            },
            competitor2: {
              id: 107,
              name: 'Pedro Mendoza',
              times: [12.45, 11.78, 13.56],
              wins: 1,
            },
            winner: 106,
          },
        ],
      },
      {
        roundNumber: 3,
        name: 'Semifinales',
        matches: [
          {
            id: 7,
            competitor1: {
              id: 103,
              name: 'Carlos Ruiz',
              times: [10.45, 9.89, 11.23],
              wins: 3,
            },
            competitor2: {
              id: 106,
              name: 'Sofía Castro',
              times: [12.56, 13.34, 11.01],
              wins: 0,
            },
            winner: 103,
          },
        ],
      },
    ],
  },
  {
    id: 2,
    name: '4x4',
    rounds: [
      {
        roundNumber: 1,
        name: 'Octavos de final',
        matches: [
          {
            id: 8,
            competitor1: {
              id: 201,
              name: 'Luis Herrera',
              times: [45.23, 47.56, 43.89],
              wins: 2,
            },
            competitor2: {
              id: 202,
              name: 'Elena Ríos',
              times: [48.34, 49.01, 46.78],
              wins: 1,
            },
            winner: 201,
          },
          {
            id: 9,
            competitor1: {
              id: 203,
              name: 'Jorge Méndez',
              times: [42.45, 43.67, 41.89],
              wins: 3,
            },
            competitor2: {
              id: 204,
              name: 'Patricia Soto',
              times: [47.56, 48.23, 46.01],
              wins: 0,
            },
            winner: 203,
          },
        ],
      },
      {
        roundNumber: 2,
        name: 'Cuartos de final',
        matches: [
          {
            id: 10,
            competitor1: {
              id: 201,
              name: 'Luis Herrera',
              times: [44.56, 46.78, 45.23],
              wins: 1,
            },
            competitor2: {
              id: 203,
              name: 'Jorge Méndez',
              times: [41.34, 42.89, 43.56],
              wins: 2,
            },
            winner: 203,
          },
        ],
      },
    ],
  },
];

// Componente principal
const ResultsViewRB = () => {
  const [selectedCategory, setSelectedCategory] = useState<number>(sampleCategories[0].id);
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const currentCategory = sampleCategories.find((c) => c.id === selectedCategory);
  const currentRound = currentCategory?.rounds.find(
    (r) => r.roundNumber === selectedRound,
  );

  return (
    <div className="text-white p-4 md:p-6 lg:p-8 min-h-screen">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2">Resultados del Torneo</h1>
        <p className="text-gray-400 text-center max-w-2xl mx-auto">
          Visualiza los resultados de cada categoría y ronda del torneo
        </p>
      </header>

      {/* Selectores */}
      <div className="max-w-4xl mx-auto bg-gray-800 rounded-xl p-4 mb-8 shadow-lg">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-1">Categoría</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(parseInt(e.target.value));
                setSelectedRound(1);
                setSelectedMatch(null);
              }}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              {sampleCategories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-1">Ronda</label>
            <select
              value={selectedRound}
              onChange={(e) => {
                setSelectedRound(parseInt(e.target.value));
                setSelectedMatch(null);
              }}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              {currentCategory?.rounds.map((round) => (
                <option key={round.roundNumber} value={round.roundNumber}>
                  {round.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de enfrentamientos */}
      <div className="max-w-6xl mx-auto">
        {currentRound ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentRound.matches.map((match) => (
              <div
                key={match.id}
                onClick={() => setSelectedMatch(match)}
                className={`bg-gray-800 rounded-xl p-4 cursor-pointer hover:bg-gray-750 transition-all border-l-4 ${
                  match.winner ? 'border-blue-500' : 'border-gray-700'
                } shadow-md`}
              >
                <div className="flex flex-col">
                  {/* Competidor 1 */}
                  <div className={`p-3 rounded-lg mb-2 ${
                    match.winner === match.competitor1.id 
                      ? 'bg-green-900/30' 
                      : match.winner === match.competitor2.id 
                        ? 'bg-red-900/20' 
                        : 'bg-gray-700'
                  }`}>
                    <div className="font-medium flex justify-between items-center">
                      <span>{match.competitor1.name}</span>
                      <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded-full">
                        {match.competitor1.wins} victorias
                      </span>
                    </div>
                    <div className="flex justify-between mt-2">
                      {match.competitor1.times.map((time, i) => (
                        <div key={i} className="text-center">
                          <div className="text-xs text-gray-400">T{i+1}</div>
                          <div className={`text-xs px-1 rounded ${
                            time > 0 && match.competitor2.times[i] > 0
                              ? time < match.competitor2.times[i]
                                ? 'bg-green-900/50 text-green-300'
                                : 'bg-red-900/50 text-red-300'
                              : 'bg-gray-800 text-gray-400'
                          }`}>
                            {time > 0 ? time.toFixed(2) : '-'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* VS */}
                  <div className="text-center my-1">
                    <span className="inline-block bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">
                      VS
                    </span>
                  </div>

                  {/* Competidor 2 */}
                  <div className={`p-3 rounded-lg ${
                    match.winner === match.competitor2.id 
                      ? 'bg-green-900/30' 
                      : match.winner === match.competitor1.id 
                        ? 'bg-red-900/20' 
                        : 'bg-gray-700'
                  }`}>
                    <div className="font-medium flex justify-between items-center">
                      <span>{match.competitor2.name}</span>
                      <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded-full">
                        {match.competitor2.wins} victorias
                      </span>
                    </div>
                    <div className="flex justify-between mt-2">
                      {match.competitor2.times.map((time, i) => (
                        <div key={i} className="text-center">
                          <div className="text-xs text-gray-400">T{i+1}</div>
                          <div className={`text-xs px-1 rounded ${
                            time > 0 && match.competitor1.times[i] > 0
                              ? time < match.competitor1.times[i]
                                ? 'bg-green-900/50 text-green-300'
                                : 'bg-red-900/50 text-red-300'
                              : 'bg-gray-800 text-gray-400'
                          }`}>
                            {time > 0 ? time.toFixed(2) : '-'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Ganador */}
                {match.winner && (
                  <div className="mt-3 text-center">
                    <span className="text-xs bg-green-900/50 text-green-300 px-2 py-1 rounded-full">
                      Ganador: {match.winner === match.competitor1.id 
                        ? match.competitor1.name 
                        : match.competitor2.name}
                    </span>
                  </div>
                )}
              </div>
            ))}
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

      {/* Modal de detalles */}
      {selectedMatch && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedMatch(null)}
        >
          <div 
            className="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl border border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                Detalles del enfrentamiento
              </h3>
              <button
                onClick={() => setSelectedMatch(null)}
                className="text-gray-400 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4 text-center text-sm text-blue-400">
              {currentCategory?.name} - {currentRound?.name}
            </div>

            <div className="space-y-6">
              {/* Competidor 1 */}
              <div className={`p-4 rounded-lg ${
                selectedMatch.winner === selectedMatch.competitor1.id 
                  ? 'bg-green-900/20 border border-green-700' 
                  : 'bg-gray-700'
              }`}>
                <div className="font-medium text-center text-lg mb-3">
                  {selectedMatch.competitor1.name}
                </div>
                
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {selectedMatch.competitor1.times.map((time, index) => {
                    const competitor2Time = selectedMatch.competitor2.times[index];
                    const isWin = time > 0 && competitor2Time > 0 && time < competitor2Time;
                    return (
                      <div key={index} className="text-center">
                        <div className="text-xs text-gray-400 mb-1">Tiempo {index + 1}</div>
                        <div className={`p-2 rounded-lg ${
                          time > 0 && competitor2Time > 0
                            ? isWin
                              ? 'bg-green-900/40 text-green-300'
                              : 'bg-red-900/40 text-red-300'
                            : 'bg-gray-800 text-gray-400'
                        }`}>
                          {time > 0 ? time.toFixed(2) + 's' : '-'}
                        </div>
                        {time > 0 && competitor2Time > 0 && (
                          <div className="text-xs mt-1">
                            {isWin ? (
                              <span className="text-green-400">Ganó</span>
                            ) : (
                              <span className="text-red-400">Perdió</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                <div className="text-center">
                  <span className="inline-block bg-blue-900/40 text-blue-300 px-3 py-1 rounded-full text-sm">
                    {selectedMatch.competitor1.wins} de 3 victorias
                  </span>
                </div>
              </div>

              {/* VS */}
              <div className="flex items-center justify-center">
                <div className="bg-gray-700 text-gray-300 px-4 py-1 rounded-full text-sm font-medium">
                  VS
                </div>
              </div>

              {/* Competidor 2 */}
              <div className={`p-4 rounded-lg ${
                selectedMatch.winner === selectedMatch.competitor2.id 
                  ? 'bg-green-900/20 border border-green-700' 
                  : 'bg-gray-700'
              }`}>
                <div className="font-medium text-center text-lg mb-3">
                  {selectedMatch.competitor2.name}
                </div>
                
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {selectedMatch.competitor2.times.map((time, index) => {
                    const competitor1Time = selectedMatch.competitor1.times[index];
                    const isWin = time > 0 && competitor1Time > 0 && time < competitor1Time;
                    return (
                      <div key={index} className="text-center">
                        <div className="text-xs text-gray-400 mb-1">Tiempo {index + 1}</div>
                        <div className={`p-2 rounded-lg ${
                          time > 0 && competitor1Time > 0
                            ? isWin
                              ? 'bg-green-900/40 text-green-300'
                              : 'bg-red-900/40 text-red-300'
                            : 'bg-gray-800 text-gray-400'
                        }`}>
                          {time > 0 ? time.toFixed(2) + 's' : '-'}
                        </div>
                        {time > 0 && competitor1Time > 0 && (
                          <div className="text-xs mt-1">
                            {isWin ? (
                              <span className="text-green-400">Ganó</span>
                            ) : (
                              <span className="text-red-400">Perdió</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                <div className="text-center">
                  <span className="inline-block bg-blue-900/40 text-blue-300 px-3 py-1 rounded-full text-sm">
                    {selectedMatch.competitor2.wins} de 3 victorias
                  </span>
                </div>
              </div>

              {/* Resultado final */}
              <div className="p-4 bg-gray-750 rounded-lg text-center">
                <div className="font-medium mb-2">Resultado final:</div>
                {selectedMatch.winner ? (
                  <div className="text-xl font-bold text-green-400">
                    {selectedMatch.winner === selectedMatch.competitor1.id
                      ? selectedMatch.competitor1.name
                      : selectedMatch.competitor2.name}{' '}
                    <span className="text-base font-normal text-gray-300">gana el enfrentamiento</span>
                  </div>
                ) : (
                  <div className="text-gray-400">No hay un ganador definitivo (se necesitan 2 victorias)</div>
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