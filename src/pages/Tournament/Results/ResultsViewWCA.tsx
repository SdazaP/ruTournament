import React, { useState, useEffect } from 'react';

type Participant = {
  id: number;
  name: string;
  times: number[];
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
  id: number;
  name: string;
  rounds: Round[];
};

const ResultsViewWCA = () => {
  // Datos de ejemplo (solo lectura)
  const categories: Category[] = [
    {
      id: 1,
      name: '3x3',
      rounds: [
        {
          roundNumber: 1,
          format: 'ao5',
          participants: [
            {
              id: 1,
              name: 'Feliks Zemdegs',
              times: [5.21, 6.45, 5.89, 7.32, 6.01],
              best: 5.21,
              average: 6.12,
              ranking: 1,
            },
            {
              id: 2,
              name: 'Max Park',
              times: [6.12, 5.98, 7.45, 6.33, 6.78],
              best: 5.98,
              average: 6.41,
              ranking: 2,
            },
            {
              id: 3,
              name: 'Tymon Kolasiński',
              times: [6.45, 7.12, 6.89, 6.54, 7.01],
              best: 6.45,
              average: 6.81,
              ranking: 3,
            },
            {
              id: 4,
              name: 'Tymon Kolasiński',
              times: [6.45, 7.12, 6.89, 6.54, 7.01],
              best: 6.30,
              average: 6.90,
              ranking: 4,
            },
            {
              id: 5,
              name: 'Tymon Kolasiński',
              times: [6.45, 7.12, 6.89, 6.54, 7.01],
              best: 6.30,
              average: 6.90,
              ranking: 5,
            },
          ],
        },
        {
          roundNumber: 2,
          format: 'ao5',
          participants: [
            {
              id: 1,
              name: 'Feliks Zemdegs',
              times: [5.45, 6.12, 5.67, 6.89, 5.98],
              best: 5.45,
              average: 5.92,
              ranking: 1,
            },
            {
              id: 2,
              name: 'Max Park',
              times: [6.01, 6.45, 5.89, 6.78, 6.32],
              best: 5.89,
              average: 6.37,
              ranking: 2,
            },
          ],
        },
      ],
    },
    {
      id: 2,
      name: '2x2',
      rounds: [
        {
          roundNumber: 1,
          format: 'ao5',
          participants: [
            {
              id: 4,
              name: 'Martin Egdal',
              times: [1.45, 1.89, 2.12, 1.67, 1.98],
              best: 1.45,
              average: 1.85,
              ranking: 1,
            },
            {
              id: 5,
              name: 'Zayn Khanani',
              times: [1.67, 2.01, 1.89, 1.78, 2.45],
              best: 1.67,
              average: 1.89,
              ranking: 2,
            },
          ],
        },
      ],
    },
    {
      id: 3,
      name: '4x4',
      rounds: [
        {
          roundNumber: 1,
          format: 'ao5',
          participants: [
            {
              id: 6,
              name: 'Max Park',
              times: [18.45, 21.12, 19.89, 20.54, 22.01],
              best: 18.45,
              average: 20.52,
              ranking: 1,
            },
            {
              id: 7,
              name: 'Sebastian Weyer',
              times: [22.45, 24.12, 20.89, 23.54, 21.01],
              best: 20.89,
              average: 22.33,
              ranking: 2,
            },
          ],
        },
      ],
    },
  ];

  const [selectedCategory, setSelectedCategory] = useState<number>(categories[0].id);
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [isMobileView, setIsMobileView] = useState(false);

  // Detectar tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Obtener datos actuales
  const currentCategory = categories.find((c) => c.id === selectedCategory);
  const currentRound = currentCategory?.rounds.find((r) => r.roundNumber === selectedRound);

  // Ordenar participantes por ranking si existe, sino por promedio
  const sortedParticipants = currentRound?.participants.sort((a, b) => {
    if (a.ranking !== undefined && b.ranking !== undefined) {
      return a.ranking - b.ranking;
    }
    return a.average - b.average;
  });

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
                setSelectedCategory(parseInt(e.target.value));
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
        {currentRound ? (
          <div className="bg-gray-800 rounded-xl overflow-hidden shadow-lg">
            {isMobileView ? (
              // Vista móvil - Tarjetas
              <div className="space-y-3 p-3">
                {sortedParticipants?.map((participant) => (
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
                          Best: {participant.best.toFixed(2)}
                        </span>
                        <span className="text-xs bg-green-600 px-2 py-1 rounded">
                          Avg: {participant.average.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {participant.times.map((time, index) => (
                        <div key={index} className="flex flex-col items-center">
                          <label className="text-xs text-gray-400">T{index + 1}</label>
                          <div className={`w-full text-center py-1 rounded text-sm ${
                            time === participant.best ? 'bg-green-900/50 text-green-300' : 'bg-gray-700'
                          }`}>
                            {time.toFixed(2)}
                          </div>
                        </div>
                      ))}
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
                  {sortedParticipants?.map((participant) => (
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
                      {participant.times.map((time, index) => (
                        <td 
                          key={index} 
                          className={`px-2 py-3 text-center ${
                            time === participant.best ? 'text-green-400 font-bold' : 'text-gray-300'
                          }`}
                        >
                          {time.toFixed(2)}
                        </td>
                      ))}
                      <td className="px-3 py-3 text-center font-bold text-blue-400">
                        {participant.best.toFixed(2)}
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-green-400">
                        {participant.average.toFixed(2)}
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
        <p className="mt-1">© {new Date().getFullYear()} Torneo de Cubos Rubik</p>
      </footer>
    </div>
  );
};

export default ResultsViewWCA;