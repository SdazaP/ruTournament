import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaSearch,
  FaTrash,
  FaEdit,
  FaTimes,
  FaCheck,
  FaArrowLeft,
} from 'react-icons/fa';
import { db } from '../../common/db';

type Round = {
  roundNumber: number;
  format: 'ao3' | 'ao5';
  competitorsToAdvance: number | 'all';
  isFinal: boolean;
};

type Category = {
  id: string;
  name: string;
  icon: string;
  startTime: string;
  endTime: string;
  participants: number;
  format: 'WCA' | 'RedBull';
  rounds?: Round[];
};

const Categories = () => {
  const { id: tournamentId } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tournament, setTournament] = useState<any>(null);

  const [newCategory, setNewCategory] = useState({
    name: '',
    icon: '',
    startTime: '10:00',
    endTime: '11:00',
    participants: 0,
    format: 'WCA' as 'WCA' | 'RedBull',
    rounds: [{ 
      roundNumber: 1, 
      format: 'ao5' as 'ao3' | 'ao5',
      competitorsToAdvance: 'all',
      isFinal: false 
    }],
  });

  const [editMode, setEditMode] = useState(false);
  const icons = ['3x3', '4x4', 'OH', '2x2', 'Pyr', 'Mega', 'Sq1', 'Skewb'];

  // Cargar datos del torneo
  useEffect(() => {
    if (tournamentId) {
      db.tournaments.get(tournamentId).then(currentTournament => {
        if (currentTournament) {
          setTournament(currentTournament);
          // Convertir las categorías del torneo al formato que espera el componente
          const formattedCategories =
            currentTournament.categories?.map((cat: any) => ({
              id: cat.id,
              name: cat.name,
              icon: cat.name.substring(0, 3),
              startTime: '10:00',
              endTime: '11:00',
              participants:
                currentTournament.competitors?.filter((comp: any) =>
                  comp.categories.includes(cat.id),
                ).length || 0,
              format: cat.format === 'wca' ? 'WCA' : 'RedBull',
              rounds: cat.rounds?.map((round: any, index: number, array: any[]) => ({
                roundNumber: round.num || index + 1,
                format: (round.format === 'ao5' ? 'ao5' : 'ao3') as 'ao5' | 'ao3',
                competitorsToAdvance: round.competitorsToAdvance || 0,
                isFinal: round.isFinal !== undefined ? round.isFinal : index === array.length - 1
              })),
            })) as Category[] || [];

          setCategories(formattedCategories);
        }
      });
    }
  }, [tournamentId]);

  const handleAddCategory = async () => {
    if (newCategory.name.trim() === '' || !tournamentId) return;

    const categoryToAdd: any = {
      id: Date.now().toString(),
      name: newCategory.name,
      format: newCategory.format.toLowerCase(),
    };

    if (newCategory.format === 'WCA') {
      categoryToAdd.rounds = newCategory.rounds?.map((round, index, array) => ({
        num: round.roundNumber,
        format: round.format,
        results: [],
        competitorsToAdvance: 'all',
        isFinal: index === array.length - 1
      }));
    }

    // Actualizar Dexie
    const currentTournament = await db.tournaments.get(tournamentId);
    if (currentTournament) {
      currentTournament.categories = [...(currentTournament.categories || []), categoryToAdd] as any;
      await db.tournaments.put(currentTournament as any);
    }

    // Actualizar estado local
    const formattedCategory: Category = {
      ...categoryToAdd,
      icon: newCategory.icon || newCategory.name.substring(0, 3),
      startTime: newCategory.startTime,
      endTime: newCategory.endTime,
      participants: 0,
      format: newCategory.format,
      rounds: newCategory.rounds?.map(round => ({
        ...round,
        competitorsToAdvance: 'all'
      })),
    };

    setCategories([...categories, formattedCategory]);
    setNewCategory({
      name: '',
      icon: '',
      startTime: '10:00',
      endTime: '11:00',
      participants: 0,
      format: 'WCA',
      rounds: [{ 
        roundNumber: 1, 
        format: 'ao5',
        competitorsToAdvance: 'all',
        isFinal: false 
      }],
    });
  };

  const handleDeleteCategory = async (id: string) => {
    if (!tournamentId) return;

    // Actualizar Dexie
    const currentTournament = await db.tournaments.get(tournamentId);
    if (currentTournament) {
      currentTournament.categories = currentTournament.categories.filter((cat: any) => cat.id !== id);
      if (currentTournament.competitors) {
        currentTournament.competitors = currentTournament.competitors.map((comp: any) => ({
          ...comp,
          categories: comp.categories.filter((catId: string) => catId !== id),
        }));
      }
      await db.tournaments.put(currentTournament as any);
    }

    setCategories(categories.filter((category) => category.id !== id));
  };

  const handleUpdateSchedule = (
    id: string,
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

  const handleUpdateFormat = async (id: string, format: 'WCA' | 'RedBull') => {
    if (!tournamentId) return;

    // Actualizar Dexie
    const currentTournament = await db.tournaments.get(tournamentId);
    if (currentTournament) {
      currentTournament.categories = currentTournament.categories.map((cat: any) => {
        if (cat.id === id) {
          return {
            ...cat,
            format: format.toLowerCase(),
            ...(format === 'WCA' && !cat.rounds
              ? { 
                  rounds: [{ 
                    num: 1, 
                    format: 'ao5',
                    results: [],
                    competitorsToAdvance: 'all',
                    isFinal: true 
                  }] 
                }
              : {}),
            ...(format === 'RedBull' ? { rounds: undefined } : {}),
          };
        }
        return cat;
      }) as any;
      await db.tournaments.put(currentTournament as any);
    }

    // Actualizar estado local
    setCategories(
      categories.map((category) => {
        if (category.id === id) {
          const updatedCategory = { ...category, format };
          if (format === 'RedBull') {
            delete updatedCategory.rounds;
          } else if (!updatedCategory.rounds) {
            updatedCategory.rounds = [{ 
              roundNumber: 1, 
              format: 'ao5',
              competitorsToAdvance: 'all',
              isFinal: true 
            }];
          }
          return updatedCategory;
        }
        return category;
      }),
    );
  };

  const handleUpdateCompetitorsToAdvance = async (
    id: string,
    roundNumber: number,
    value: number | 'all'
  ) => {
    if (!tournamentId) return;

    const currentTournament = await db.tournaments.get(tournamentId);
    if (currentTournament) {
      currentTournament.categories = currentTournament.categories.map((cat: any) => {
        if (cat.id === id && cat.rounds) {
          return {
            ...cat,
            rounds: cat.rounds.map((round: any) => 
              round.num === roundNumber 
                ? { ...round, competitorsToAdvance: value } 
                : round
            ),
          };
        }
        return cat;
      }) as any;
      await db.tournaments.put(currentTournament as any);
    }

    // Actualizar estado local
    setCategories(
      categories.map((category) => {
        if (category.id === id && category.rounds) {
          return {
            ...category,
            rounds: category.rounds.map((round) =>
              round.roundNumber === roundNumber
                ? { ...round, competitorsToAdvance: value }
                : round
            ),
          };
        }
        return category;
      })
    );
  };

  const handleAddRound = async (id: string) => {
    if (!tournamentId) return;

    const currentTournament = await db.tournaments.get(tournamentId);
    if (currentTournament) {
      currentTournament.categories = currentTournament.categories.map((cat: any) => {
        if (cat.id === id && cat.format === 'wca') {
          const lastRound = cat.rounds?.[cat.rounds.length - 1];
          const newRoundNumber = lastRound ? lastRound.num + 1 : 1;
          const isFinal = true;

          const updatedRounds = cat.rounds?.map((round: any) => ({
            ...round,
            isFinal: false
          })) || [];

          return {
            ...cat,
            rounds: [
              ...updatedRounds,
              {
                num: newRoundNumber,
                format: 'ao5',
                competitorsToAdvance: 0,
                isFinal,
                results: []
              },
            ],
          };
        }
        return cat;
      }) as any;
      await db.tournaments.put(currentTournament as any);
    }

    setCategories(
      categories.map((category) => {
        if (category.id === id && category.format === 'WCA') {
          const lastRound = category.rounds?.[category.rounds.length - 1];
          const newRoundNumber = lastRound ? lastRound.roundNumber + 1 : 1;
          const isFinal = true;

          const updatedRounds = category.rounds?.map(round => ({
            ...round,
            isFinal: false
          })) || [];

          return {
            ...category,
            rounds: [
              ...updatedRounds,
              {
                roundNumber: newRoundNumber,
                format: 'ao5',
                competitorsToAdvance: 0,
                isFinal,
              },
            ],
          };
        }
        return category;
      }),
    );
  };

  const handleDeleteRound = async (id: string, roundNumber: number) => {
    if (!tournamentId) return;

    const currentTournament = await db.tournaments.get(tournamentId);
    if (currentTournament) {
      currentTournament.categories = currentTournament.categories.map((cat: any) => {
        if (cat.id === id && cat.format === 'wca' && cat.rounds) {
          const filteredRounds = cat.rounds.filter(
            (round: any) => round.num !== roundNumber,
          );
          
          if (filteredRounds.length > 0) {
            filteredRounds[filteredRounds.length - 1].isFinal = true;
          }
          
          return {
            ...cat,
            rounds: filteredRounds
          };
        }
        return cat;
      }) as any;
      await db.tournaments.put(currentTournament as any);
    }

    // Actualizar estado local
    setCategories(
      categories.map((category) => {
        if (category.id === id && category.format === 'WCA' && category.rounds) {
          const filteredRounds = category.rounds.filter(
            (round) => round.roundNumber !== roundNumber,
          );
          
          if (filteredRounds.length > 0) {
            filteredRounds[filteredRounds.length - 1].isFinal = true;
          }
          
          return { ...category, rounds: filteredRounds };
        }
        return category;
      }),
    );
  };

  const handleUpdateRoundFormat = async (
    id: string,
    roundNumber: number,
    format: 'ao3' | 'ao5',
  ) => {
    if (!tournamentId) return;

    const currentTournament = await db.tournaments.get(tournamentId);
    if (currentTournament) {
      currentTournament.categories = currentTournament.categories.map((cat: any) => {
        if (cat.id === id && cat.format === 'wca' && cat.rounds) {
          return {
            ...cat,
            rounds: cat.rounds.map((round: any) =>
              round.num === roundNumber ? { ...round, format } : round,
            ),
          };
        }
        return cat;
      }) as any;
      await db.tournaments.put(currentTournament as any);
    }

    // Actualizar estado local
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

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  return (
    <div className="min-h-screen text-white p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          Categorías {tournament ? `- ${tournament.name}` : ''}
        </h2>
        <button
          onClick={toggleEditMode}
          className={`px-4 py-2 rounded-lg transition-colors ${
            editMode
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {editMode ? 'Desactivar Edición' : 'Activar Edición'}
        </button>
      </div>

      {/* Formulario para agregar nueva categoría (solo visible en modo edición) */}
      {editMode && (
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
              <option value="RedBull" disabled>RedBull (Próximamente)</option>
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
                        newRounds[index].format = e.target.value as
                          | 'ao3'
                          | 'ao5';
                        setNewCategory({ ...newCategory, rounds: newRounds });
                      }}
                      className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm"
                    >
                      <option value="ao5">AO5</option>
                      <option value="ao3">AO3</option>
                    </select>
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
      )}

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
              {editMode && (
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="text-gray-400 hover:text-red-400"
                >
                  ×
                </button>
              )}
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
                    className={`flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm ${
                      !editMode ? 'cursor-not-allowed opacity-50' : ''
                    }`}
                    disabled={!editMode}
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
                    className={`flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm ${
                      !editMode ? 'cursor-not-allowed opacity-50' : ''
                    }`}
                    disabled={!editMode}
                  />
                </div>
              </div>

              {editMode && (
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
                      disabled
                      title="Próximamente"
                      className={`px-3 py-1 rounded text-sm cursor-not-allowed opacity-50 ${
                        category.format === 'RedBull'
                          ? 'bg-blue-600'
                          : 'bg-gray-700'
                      }`}
                    >
                      RedBull (Próximamente)
                    </button>
                  </div>
                </div>
              )}

              {category.format === 'WCA' && category.rounds && (
                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    Rondas
                  </label>
                  <div className="space-y-2">
                    {category.rounds.map((round) => (
                      <div
                        key={round.roundNumber}
                        className="flex flex-col gap-2 p-2 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {round.isFinal
                              ? 'Final'
                              : `Ronda ${round.roundNumber}`}
                            :
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
                            className={`bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm ${
                              !editMode ? 'cursor-not-allowed opacity-50' : ''
                            }`}
                            disabled={!editMode}
                          >
                            <option value="ao5">AO5</option>
                            <option value="ao3">AO3</option>
                          </select>
                          {round.isFinal && (
                            <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">
                              Final
                            </span>
                          )}
                          {editMode &&
                            category.rounds &&
                            category.rounds.length > 1 && (
                              <button
                                onClick={() =>
                                  handleDeleteRound(
                                    category.id,
                                    round.roundNumber,
                                  )
                                }
                                className="text-xs bg-red-600 hover:bg-red-700 px-2 py-1 rounded ml-auto"
                              >
                                ×
                              </button>
                            )}
                        </div>

                        {/* Mostrar siempre la información de competidores que avanzan */}
                        {!round.isFinal && (
                          <div className="flex items-center gap-2 text-sm">
                            <span>Avanzan:</span>
                            {editMode ? (
                              <select
                                value={round.competitorsToAdvance}
                                onChange={(e) => {
                                  const newValue =
                                    e.target.value === 'all'
                                      ? 'all'
                                      : parseInt(e.target.value) || 0;
                                  handleUpdateCompetitorsToAdvance(
                                    category.id,
                                    round.roundNumber,
                                    newValue
                                  );
                                }}
                                className="bg-gray-700 border border-gray-600 rounded px-2 py-1"
                              >
                                <option value="0">Ninguno</option>
                                <option value="4">4 competidores</option>
                                <option value="8">8 competidores</option>
                                <option value="10">10 competidores</option>
                                <option value="12">12 competidores</option>
                                <option value="16">16 competidores</option>
                                <option value="all">Todos</option>
                              </select>
                            ) : (
                              <span className="bg-gray-700 px-2 py-1 rounded">
                                {round.competitorsToAdvance === 'all'
                                  ? 'Todos'
                                  : round.competitorsToAdvance > 0
                                  ? round.competitorsToAdvance
                                  : 'Ninguno'}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    {editMode && (
                      <button
                        onClick={() => handleAddRound(category.id)}
                        className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded"
                      >
                        + Añadir ronda
                      </button>
                    )}
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

      {categories.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No hay categorías registradas aún
        </div>
      )}
    </div>
  );
};

export default Categories;