import React, { useState } from 'react';

type Category = {
  id: number;
  name: string;
  icon: string;
  startTime: string;
  endTime: string;
  participants: number;
  format: 'WCA' | 'RedBull';
  rounds?: {
    roundNumber: number;
    format: 'ao3' | 'ao5';
  }[];
};

const Categories = () => {
  // Estado para las categorías
  const [categories, setCategories] = useState<Category[]>([
    {
      id: 1,
      name: '3x3',
      icon: '3x3',
      startTime: '09:00',
      endTime: '10:30',
      participants: 15,
      format: 'WCA',
      rounds: [
        { roundNumber: 1, format: 'ao5' },
        { roundNumber: 2, format: 'ao5' },
      ],
    },
    {
      id: 2,
      name: '4x4',
      icon: '4x4',
      startTime: '11:00',
      endTime: '12:30',
      participants: 8,
      format: 'RedBull',
    },
    {
      id: 3,
      name: '3x3 OH',
      icon: 'OH',
      startTime: '14:00',
      endTime: '15:30',
      participants: 12,
      format: 'WCA',
      rounds: [
        { roundNumber: 1, format: 'ao5' },
      ],
    },
    {
      id: 4,
      name: '2x2',
      icon: '2x2',
      startTime: '16:00',
      endTime: '17:00',
      participants: 10,
      format: 'WCA',
      rounds: [
        { roundNumber: 1, format: 'ao3' },
        { roundNumber: 2, format: 'ao5' },
      ],
    },
  ]);

  // Estado para nueva categoría
  const [newCategory, setNewCategory] = useState({
    name: '',
    icon: '',
    startTime: '10:00',
    endTime: '11:00',
    participants: 0,
    format: 'WCA' as 'WCA' | 'RedBull',
    rounds: [{ roundNumber: 1, format: 'ao5' as 'ao3' | 'ao5' }],
  });

  // Iconos disponibles
  const icons = ['3x3', '4x4', 'OH', '2x2', 'Pyr', 'Mega', 'Sq1', 'Skewb'];

  // Agregar nueva categoría
  const handleAddCategory = () => {
    if (newCategory.name.trim() === '') return;

    const categoryToAdd: Category = {
      id: Date.now(),
      name: newCategory.name,
      icon: newCategory.icon || newCategory.name.substring(0, 3),
      startTime: newCategory.startTime,
      endTime: newCategory.endTime,
      participants: 0,
      format: newCategory.format,
    };

    if (newCategory.format === 'WCA') {
      categoryToAdd.rounds = [...newCategory.rounds];
    }

    setCategories([...categories, categoryToAdd]);

    setNewCategory({
      name: '',
      icon: '',
      startTime: '10:00',
      endTime: '11:00',
      participants: 0,
      format: 'WCA',
      rounds: [{ roundNumber: 1, format: 'ao5' }],
    });
  };

  // Eliminar categoría
  const handleDeleteCategory = (id: number) => {
    setCategories(categories.filter((category) => category.id !== id));
  };

  // Actualizar horario
  const handleUpdateSchedule = (
    id: number,
    field: 'startTime' | 'endTime',
    value: string,
  ) => {
    setCategories(
      categories.map((category) => {
        if (category.id === id) {
          return { ...category, [field]: value };
        }
        return category;
      }),
    );
  };

  // Actualizar formato de categoría
  const handleUpdateFormat = (id: number, format: 'WCA' | 'RedBull') => {
    setCategories(
      categories.map((category) => {
        if (category.id === id) {
          const updatedCategory = { ...category, format };
          if (format === 'RedBull') {
            delete updatedCategory.rounds;
          } else if (!updatedCategory.rounds) {
            updatedCategory.rounds = [{ roundNumber: 1, format: 'ao5' }];
          }
          return updatedCategory;
        }
        return category;
      }),
    );
  };

  // Agregar ronda
  const handleAddRound = (id: number) => {
    setCategories(
      categories.map((category) => {
        if (category.id === id && category.format === 'WCA') {
          const lastRound = category.rounds?.[category.rounds.length - 1];
          const newRoundNumber = lastRound ? lastRound.roundNumber + 1 : 1;
          return {
            ...category,
            rounds: [
              ...(category.rounds || []),
              { roundNumber: newRoundNumber, format: 'ao5' },
            ],
          };
        }
        return category;
      }),
    );
  };

  // Eliminar ronda
  const handleDeleteRound = (id: number, roundNumber: number) => {
    setCategories(
      categories.map((category) => {
        if (category.id === id && category.format === 'WCA' && category.rounds) {
          const filteredRounds = category.rounds.filter(
            (round) => round.roundNumber !== roundNumber,
          );
          return { ...category, rounds: filteredRounds };
        }
        return category;
      }),
    );
  };

  // Actualizar formato de ronda
  const handleUpdateRoundFormat = (
    id: number,
    roundNumber: number,
    format: 'ao3' | 'ao5',
  ) => {
    setCategories(
      categories.map((category) => {
        if (category.id === id && category.format === 'WCA' && category.rounds) {
          return {
            ...category,
            rounds: category.rounds.map((round) =>
              round.roundNumber === roundNumber ? { ...round, format } : round,
            ),
          };
        }
        return category;
      }),
    );
  };

  return (
    <div className="min-h-screen bg-gray-800 text-white p-4 sm:p-6">
      <h2 className="text-2xl font-bold mb-6">Categorías del Torneo</h2>

      {/* Formulario para agregar nueva categoría */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="Nombre categoría"
            value={newCategory.name}
            onChange={(e) =>
              setNewCategory({ ...newCategory, name: e.target.value })
            }
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />

          <select
            value={newCategory.icon}
            onChange={(e) =>
              setNewCategory({ ...newCategory, icon: e.target.value })
            }
            className="flex-1 md:max-w-[200px] bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Seleccionar icono...</option>
            {icons.map((icon, index) => (
              <option key={index} value={icon}>
                {icon}
              </option>
            ))}
          </select>

          <select
            value={newCategory.format}
            onChange={(e) =>
              setNewCategory({
                ...newCategory,
                format: e.target.value as 'WCA' | 'RedBull',
              })
            }
            className="flex-1 md:max-w-[150px] bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="WCA">Formato WCA</option>
            <option value="RedBull">Formato RedBull</option>
          </select>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2">
            <input
              type="time"
              value={newCategory.startTime}
              onChange={(e) =>
                setNewCategory({ ...newCategory, startTime: e.target.value })
              }
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-gray-300">a</span>
            <input
              type="time"
              value={newCategory.endTime}
              onChange={(e) =>
                setNewCategory({ ...newCategory, endTime: e.target.value })
              }
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {newCategory.format === 'WCA' && (
            <div className="flex-1 flex flex-col gap-2">
              {newCategory.rounds.map((round, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-sm">Ronda {round.roundNumber}:</span>
                  <select
                    value={round.format}
                    onChange={(e) => {
                      const newRounds = [...newCategory.rounds];
                      newRounds[index].format = e.target.value as 'ao3' | 'ao5';
                      setNewCategory({ ...newCategory, rounds: newRounds });
                    }}
                    className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm"
                  >
                    <option value="ao5">AO5</option>
                    <option value="ao3">AO3</option>
                  </select>
                  {index === newCategory.rounds.length - 1 && (
                    <button
                      onClick={() =>
                        setNewCategory({
                          ...newCategory,
                          rounds: [
                            ...newCategory.rounds,
                            {
                              roundNumber: round.roundNumber + 1,
                              format: 'ao5',
                            },
                          ],
                        })
                      }
                      className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded"
                    >
                      +
                    </button>
                  )}
                  {newCategory.rounds.length > 1 && (
                    <button
                      onClick={() => {
                        const newRounds = newCategory.rounds.filter(
                          (_, i) => i !== index,
                        );
                        setNewCategory({ ...newCategory, rounds: newRounds });
                      }}
                      className="text-xs bg-red-600 hover:bg-red-700 px-2 py-1 rounded"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleAddCategory}
            className="flex-1 md:flex-none md:w-[150px] bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
          >
            Agregar
          </button>
        </div>
      </div>

      {/* Lista de categorías */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className="bg-gray-750 rounded-lg p-4 hover:bg-gray-700 transition-colors"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                  {category.icon}
                </div>
                <div>
                  <h3 className="font-medium">{category.name}</h3>
                  <span className="text-xs text-gray-400">
                    {category.format}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleDeleteCategory(category.id)}
                className="text-gray-400 hover:text-red-400"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Horario
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={category.startTime}
                    onChange={(e) =>
                      handleUpdateSchedule(
                        category.id,
                        'startTime',
                        e.target.value,
                      )
                    }
                    className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm"
                  />
                  <span>a</span>
                  <input
                    type="time"
                    value={category.endTime}
                    onChange={(e) =>
                      handleUpdateSchedule(
                        category.id,
                        'endTime',
                        e.target.value,
                      )
                    }
                    className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Formato
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateFormat(category.id, 'WCA')}
                    className={`px-3 py-1 rounded text-sm ${
                      category.format === 'WCA'
                        ? 'bg-blue-600'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    WCA
                  </button>
                  <button
                    onClick={() => handleUpdateFormat(category.id, 'RedBull')}
                    className={`px-3 py-1 rounded text-sm ${
                      category.format === 'RedBull'
                        ? 'bg-blue-600'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    RedBull
                  </button>
                </div>
              </div>

              {category.format === 'WCA' && category.rounds && (
                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    Rondas
                  </label>
                  <div className="space-y-2">
                    {category.rounds.map((round) => (
                      <div
                        key={round.roundNumber}
                        className="flex items-center gap-2"
                      >
                        <span className="text-sm">
                          Ronda {round.roundNumber}:
                        </span>
                        <select
                          value={round.format}
                          onChange={(e) =>
                            handleUpdateRoundFormat(
                              category.id,
                              round.roundNumber,
                              e.target.value as 'ao3' | 'ao5',
                            )
                          }
                          className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm"
                        >
                          <option value="ao5">AO5</option>
                          <option value="ao3">AO3</option>
                        </select>
                        {category.rounds && category.rounds.length > 1 && (
                          <button
                            onClick={() =>
                              handleDeleteRound(category.id, round.roundNumber)
                            }
                            className="text-xs bg-red-600 hover:bg-red-700 px-2 py-1 rounded"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => handleAddRound(category.id)}
                      className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded"
                    >
                      + Añadir ronda
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">
                  {category.participants}{' '}
                  {category.participants === 1
                    ? 'participante'
                    : 'participantes'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mensaje cuando no hay categorías */}
      {categories.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No hay categorías registradas aún
        </div>
      )}
    </div>
  );
};

export default Categories;