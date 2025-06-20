import React, { useState, useEffect } from 'react';
import { FaEdit, FaSave, FaTimes, FaTrash, FaInfoCircle } from 'react-icons/fa';
import { MdOutlineTimer, MdLeaderboard, MdCategory, MdPeople } from 'react-icons/md';
import { BsTrophyFill, BsGraphUp } from 'react-icons/bs';

type Participant = {
  id: number;
  name: string;
  times: number[];
  best: number;
  average: number;
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

const ResultsWCA = () => {
  // Datos y estado
  const [categories, setCategories] = useState<Category[]>([
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
              name: 'Participante 1',
              times: [15.2, 14.8, 16.1, 7.45, 11.82],
              best: 7.45,
              average: 13.94,
            },
            {
              id: 2,
              name: 'Participante 2',
              times: [10.5, 12.3, 11.2, 8.9, 11.45],
              best: 8.9,
              average: 11.05,
            },
          ],
        },
        {
          roundNumber: 2,
          format: 'ao3',
          participants: [
            {
              id: 1,
              name: 'Participante 1',
              times: [10.5, 12.3, 11.2],
              best: 10.5,
              average: 11.33,
            },
            {
              id: 2,
              name: 'Participante 2',
              times: [15.2, 14.8, 16.1],
              best: 14.8,
              average: 15.37,
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
              id: 3,
              name: 'Participante 3',
              times: [3.2, 4.1, 2.9, 3.8, 4.5],
              best: 2.9,
              average: 3.7,
            },
          ],
        },
      ],
    },
  ]);

  const [selectedCategory, setSelectedCategory] = useState<number>(1);
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [isMobileView, setIsMobileView] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [tempTimes, setTempTimes] = useState<number[]>([]);

  // Efectos
  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Datos actuales
  const currentCategory = categories.find((c) => c.id === selectedCategory);
  const currentRound = currentCategory?.rounds.find(
    (r) => r.roundNumber === selectedRound,
  );

  // Funciones de ayuda
  const calculateStats = (times: number[], format: 'ao3' | 'ao5') => {
    const validTimes = times.filter((t) => t > 0);
    const best = validTimes.length > 0 ? Math.min(...validTimes) : 0;

    let average = 0;
    if (format === 'ao3' && validTimes.length >= 3) {
      average = validTimes.slice(0, 3).reduce((sum, t) => sum + t, 0) / 3;
    } else if (format === 'ao5' && validTimes.length >= 5) {
      const sorted = [...validTimes].sort((a, b) => a - b);
      average = sorted.slice(1, 4).reduce((sum, t) => sum + t, 0) / 3;
    }

    return { best, average };
  };

  // Manejo de edición
  const startEditing = (participant: Participant) => {
    setEditingParticipant(participant);
    setTempTimes([...participant.times]);
  };

  const handleTimeChange = (index: number, value: string) => {
    const newTimes = [...tempTimes];
    newTimes[index] = parseFloat(value) || 0;
    setTempTimes(newTimes);
  };

  const saveChanges = () => {
    if (!editingParticipant || !currentRound) return;

    const { best, average } = calculateStats(tempTimes, currentRound.format);

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
                return { ...p, times: tempTimes, best, average };
              }),
            };
          }),
        };
      }),
    );

    cancelEditing();
  };

  const cancelEditing = () => {
    setEditingParticipant(null);
    setTempTimes([]);
  };

  // Renderizado condicional
  const renderTimeCell = (
    participant: Participant,
    time: number,
    index: number,
  ) => {
    if (editMode && editingParticipant?.id === participant.id) {
      return (
        <input
          type="number"
          value={tempTimes[index] || ''}
          onChange={(e) => handleTimeChange(index, e.target.value)}
          className="w-full bg-gray-800 border border-blue-500 rounded px-1 py-1 text-center text-sm"
          step="0.01"
          min="0"
          autoFocus
        />
      );
    }

    return (
      <div
        className={`w-full py-1 text-center ${
          editMode ? 'cursor-pointer hover:bg-gray-700' : ''
        }`}
        onClick={() => editMode && startEditing(participant)}
      >
        {time > 0 ? time.toFixed(2) : '-'}
      </div>
    );
  };

  return (
    <div className="text-white p-4 md:p-6 lg:p-8">
      {/* Encabezado y controles */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <MdLeaderboard className="text-blue-400" /> Resultados
        </h2>

        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          {/* Botón de edición */}
          <button
            onClick={() => setEditMode(!editMode)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-2 ${
              editMode
                ? 'bg-yellow-600 hover:bg-yellow-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {editMode ? (
              <>
                <FaTimes /> Desactivar Edición
              </>
            ) : (
              <>
                <FaEdit /> Activar Edición
              </>
            )}
          </button>

          {/* Selectores */}
          <div className="flex flex-col md:flex-row gap-3 flex-1">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs sm:text-sm text-gray-400 mb-1 flex items-center gap-1">
                <MdCategory size={14} /> Categoría
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(parseInt(e.target.value));
                  setSelectedRound(1);
                  cancelEditing();
                }}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
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
              <label className="block text-xs sm:text-sm text-gray-400 mb-1 flex items-center gap-1">
                <MdOutlineTimer size={14} /> Ronda
              </label>
              <select
                value={selectedRound}
                onChange={(e) => {
                  setSelectedRound(parseInt(e.target.value));
                  cancelEditing();
                }}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
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

      {/* Controles de edición activa */}
      {editMode && editingParticipant && (
        <div className="flex flex-wrap gap-3 mb-4 p-3 bg-gray-700 rounded-lg items-center">
          <span className="font-medium flex items-center gap-2">
            <FaInfoCircle className="text-yellow-400" /> Editando: {editingParticipant.name}
          </span>
          <div className="flex gap-2">
            <button
              onClick={saveChanges}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm flex items-center gap-2"
            >
              <FaSave /> Guardar
            </button>
            <button
              onClick={cancelEditing}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm flex items-center gap-2"
            >
              <FaTimes /> Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Tabla de resultados */}
      {currentRound ? (
        <div className="overflow-x-auto">
          {isMobileView ? (
            // Vista móvil - Tarjetas
            <div className="space-y-3">
              {currentRound.participants.map((participant) => (
                <div
                  key={participant.id}
                  className={`bg-gray-750 rounded-lg p-3 ${
                    editMode ? 'border border-gray-600' : ''
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium truncate">{participant.name}</h3>
                    <div className="flex gap-2">
                      <span className="text-xs bg-blue-600 px-2 py-1 rounded flex items-center gap-1">
                        <BsTrophyFill size={10} />{' '}
                        {participant.best > 0
                          ? participant.best.toFixed(2)
                          : '-'}
                      </span>
                      <span className="text-xs bg-green-600 px-2 py-1 rounded flex items-center gap-1">
                        <BsGraphUp size={10} />{' '}
                        {participant.average > 0
                          ? participant.average.toFixed(2)
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
                    {participant.times
                      .slice(0, currentRound.format === 'ao5' ? 5 : 3)
                      .map((time, index) => (
                        <div key={index} className="flex flex-col items-center">
                          <label className="text-xs text-gray-400 flex items-center gap-1">
                            <MdOutlineTimer size={10} /> T{index + 1}
                          </label>
                          {renderTimeCell(participant, time, index)}
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Vista de escritorio - Tabla
            <table className="w-full bg-gray-750 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-700">
                  {/* Columna Participante */}
                  <th className="px-4 py-3 text-left min-w-[180px] w-1/4">
                    <div className="flex items-center gap-2">
                      <MdPeople className="text-blue-400" />
                      <span>Participante</span>
                    </div>
                  </th>
                  
                  {/* Columnas de tiempos */}
                  {Array.from({ 
                    length: currentRound.format === 'ao5' ? 5 : 3 
                  }).map((_, index) => (
                    <th 
                      key={`time-header-${index}`} 
                      className="px-2 py-3 text-center min-w-[80px]"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <MdOutlineTimer className="text-gray-300 mb-1" />
                        <span className="text-xs font-normal">T{index + 1}</span>
                      </div>
                    </th>
                  ))}
                  
                  {/* Columna Best */}
                  <th className="px-3 py-3 text-center min-w-[100px]">
                    <div className="flex flex-col items-center justify-center">
                      <BsTrophyFill className="text-yellow-400 mb-1" />
                      <span className="text-xs font-normal">Best</span>
                    </div>
                  </th>
                  
                  {/* Columna Avg */}
                  <th className="px-3 py-3 text-center min-w-[100px]">
                    <div className="flex flex-col items-center justify-center">
                      <BsGraphUp className="text-green-400 mb-1" />
                      <span className="text-xs font-normal">Avg</span>
                    </div>
                  </th>
                </tr>
              </thead>
              
              <tbody>
                {currentRound.participants.map((participant) => (
                  <tr
                    key={participant.id}
                    className={`border-b border-gray-700 ${
                      editMode ? 'hover:bg-gray-700/50' : ''
                    }`}
                  >
                    {/* Nombre del participante */}
                    <td className="px-4 py-3 truncate max-w-[180px] font-medium">
                      {participant.name}
                    </td>
                    
                    {/* Tiempos */}
                    {participant.times
                      .slice(0, currentRound.format === 'ao5' ? 5 : 3)
                      .map((time, index) => (
                        <td key={index} className="px-2 py-3">
                          {renderTimeCell(participant, time, index)}
                        </td>
                      ))}
                    
                    {/* Mejor tiempo */}
                    <td className="px-3 py-3 text-center font-medium text-blue-400">
                      {participant.best > 0 ? participant.best.toFixed(2) : '-'}
                    </td>
                    
                    {/* Promedio */}
                    <td className="px-3 py-3 text-center font-medium text-green-400">
                      {participant.average > 0 ? participant.average.toFixed(2) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400 flex flex-col items-center gap-2">
          <FaInfoCircle size={24} />
          No hay datos disponibles para mostrar
        </div>
      )}

      {/* Notificación del modo edición */}
      {editMode && !editingParticipant && (
        <div className="fixed bottom-4 right-4 bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in flex items-center gap-2">
          <FaEdit /> Modo edición activado
        </div>
      )}
    </div>
  );
};

export default ResultsWCA;