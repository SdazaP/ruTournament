import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaSearch, FaTrash, FaEdit, FaTimes, FaCheck, FaArrowLeft, FaExclamationTriangle, FaLock, FaUsers, FaSave, FaUndo, FaPlus } from 'react-icons/fa';
import { db } from '../../common/db';
import { isDuplicateName } from '../../common/validation';
import CategoryToggle from '../../components/CategoryToggle';
import { useTournamentStatus } from '../../hooks/useTournamentStatus';

type Participant = {
  id: string;
  name: string;
  categories: string[];
};

const Participants = () => {
  const { id: tournamentId } = useParams();
  const navigate = useNavigate();
  const { isFinalized } = useTournamentStatus(tournamentId);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [tournament, setTournament] = useState<any>(null);
  const [categories, setCategories] = useState<string[]>([]);
  
  const [newParticipant, setNewParticipant] = useState({
    name: '',
    category: ''
  });

  const [editMode, setEditMode] = useState(false);
  const [originalParticipants, setOriginalParticipants] = useState<Participant[]>([]);
  const [showExitModal, setShowExitModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [participantToDelete, setParticipantToDelete] = useState<Participant | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [editNameError, setEditNameError] = useState<string | null>(null);
  const [categoryToRemove, setCategoryToRemove] = useState<{participantId: string, categoryId: string, participantName: string, categoryName: string} | null>(null);

  // Cargar datos del torneo
  useEffect(() => {
    if (tournamentId) {
      db.tournaments.get(tournamentId).then(currentTournament => {
        if (currentTournament) {
          setTournament(currentTournament);
          setParticipants((currentTournament.competitors as Participant[]) || []);
          
          // Obtener categorías disponibles del torneo
          const tournamentCategories = currentTournament.categories?.map((cat: any) => cat.name) || [];
          setCategories(tournamentCategories);
          
          // Establecer primera categoría como predeterminada
          if (tournamentCategories.length > 0) {
            setNewParticipant(prev => ({...prev, category: tournamentCategories[0]}));
          }
        }
      });
    }
  }, [tournamentId]);

  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = participant.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === '' || participant.categories.some(catId => {
      const cat = tournament?.categories?.find((c: any) => c.id === catId);
      return cat?.name === categoryFilter;
    });
    return matchesSearch && matchesCategory;
  });

  const handleAdd = async () => {
    if (newParticipant.name.trim() === '' || !newParticipant.category || !tournamentId) return;

    const names = participants.map((p) => p.name);
    if (isDuplicateName(newParticipant.name, names)) {
      setNameError('Ya existe un competidor con ese nombre');
      return;
    }
    setNameError(null);
    
    const selectedCategory = tournament.categories.find((cat: any) => cat.name === newParticipant.category);
    if (!selectedCategory) return;
    
    const newParticipantObj: Participant = {
      id: Date.now().toString(),
      name: newParticipant.name,
      categories: [selectedCategory.id],
    };
    
    if (!editMode) {
      const currentTournament = await db.tournaments.get(tournamentId);
      if (currentTournament) {
        currentTournament.competitors = [...(currentTournament.competitors || []), newParticipantObj];
        await db.tournaments.put(currentTournament as any);
      }
    }
    
    setParticipants([...participants, newParticipantObj]);
    setNewParticipant({ name: '', category: categories[0] || '' });
  };

  const handleDelete = async (id: string) => {
    if (!tournamentId) return;
    
    if (!editMode) {
      const currentTournament = await db.tournaments.get(tournamentId);
      if (currentTournament) {
        currentTournament.competitors = (currentTournament.competitors || []).filter((p: any) => p.id !== id);
        await db.tournaments.put(currentTournament as any);
      }
    }
    
    setParticipants(participants.filter(p => p.id !== id));
    setParticipantToDelete(null);
  };

  const handleAddCategory = async (participantId: string, categoryName: string) => {
    if (!editMode || !tournamentId) return;
    
    const selectedCategory = tournament.categories.find((cat: any) => cat.name === categoryName);
    if (!selectedCategory) return;
    
    if (!editMode) {
      const currentTournament = await db.tournaments.get(tournamentId);
      if (currentTournament) {
        currentTournament.competitors = (currentTournament.competitors || []).map((p: any) => {
          if (p.id === participantId && !p.categories.includes(selectedCategory.id)) {
            return { ...p, categories: [...p.categories, selectedCategory.id] };
          }
          return p;
        });
        await db.tournaments.put(currentTournament as any);
      }
    }
    
    setParticipants(participants.map(p => {
      if (p.id === participantId && !p.categories.includes(selectedCategory.id)) {
        return { ...p, categories: [...p.categories, selectedCategory.id] };
      }
      return p;
    }));
  };

  const handleRemoveCategoryClick = (participantId: string, categoryId: string, participantName: string, categoryName: string) => {
    setCategoryToRemove({ participantId, categoryId, participantName, categoryName });
  };

  const confirmRemoveCategory = async () => {
    if (!editMode || !tournamentId || !categoryToRemove) return;
    const { participantId, categoryId } = categoryToRemove;
    
    if (!editMode) {
      const currentTournament = await db.tournaments.get(tournamentId);
      if (currentTournament) {
        currentTournament.competitors = (currentTournament.competitors || []).map((p: any) => {
          if (p.id === participantId) {
            return { 
              ...p, 
              categories: (p.categories || []).filter((c: string) => c !== categoryId) 
            };
          }
          return p;
        });
        await db.tournaments.put(currentTournament as any);
      }
    }
    
    setParticipants(participants.map(p => 
      p.id === participantId ? { ...p, categories: p.categories.filter(c => c !== categoryId) } : p
    ));
    setCategoryToRemove(null);
  };

  const handleNameChange = async (participantId: string, newName: string) => {
    if (!editMode || !tournamentId) return;

    const names = participants.map((p) => p.name);
    const idx = participants.findIndex((p) => p.id === participantId);
    if (isDuplicateName(newName, names, idx)) {
      setEditNameError('Ya existe un competidor con ese nombre');
      return;
    }
    setEditNameError(null);
    
    if (!editMode) {
      const currentTournament = await db.tournaments.get(tournamentId);
      if (currentTournament) {
        currentTournament.competitors = (currentTournament.competitors || []).map((p: any) => {
          if (p.id === participantId) {
            return { ...p, name: newName };
          }
          return p;
        });
        await db.tournaments.put(currentTournament as any);
      }
    }
    
    setParticipants(participants.map(p => 
      p.id === participantId ? { ...p, name: newName } : p
    ));
  };

  const getCategoryName = (categoryId: string) => {
    const category = tournament?.categories?.find((c: any) => c.id === categoryId);
    return category?.name || categoryId;
  };

  const changedCount = !editMode ? 0 : participants.length !== originalParticipants.length ? Math.abs(participants.length - originalParticipants.length) : participants.filter((p) => {
    const orig = originalParticipants.find((o) => o.id === p.id);
    if (!orig) return true;
    return p.name !== orig.name || JSON.stringify(p.categories) !== JSON.stringify(orig.categories);
  }).length;

  const handleToggleEditMode = () => {
    if (isFinalized) return;
    if (editMode) {
      if (changedCount > 0) {
        setShowExitModal(true);
      } else {
        setEditMode(false);
        setOriginalParticipants([]);
      }
    } else {
      setOriginalParticipants(JSON.parse(JSON.stringify(participants)));
      setEditMode(true);
    }
  };

  const handleSaveAll = async () => {
    if (!tournamentId) return;
    const t = await db.tournaments.get(tournamentId);
    if (t) {
      t.competitors = participants as any;
      await db.tournaments.put(t as any);
    }
    setEditMode(false);
    setShowExitModal(false);
    setOriginalParticipants([]);
  };

  const handleDiscardAll = () => {
    setParticipants(JSON.parse(JSON.stringify(originalParticipants)));
    setEditMode(false);
    setShowExitModal(false);
    setOriginalParticipants([]);
  };

  return (
    <div className="min-h-screen text-white p-4 sm:p-6 relative">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <FaUsers className="text-blue-400" /> Competidores
          </h2>
          {!isFinalized && (
            <Link
              to={`/dashboard/tournament/${tournamentId}/categories`}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors border border-gray-600"
              title="Añadir categoría"
            >
              <FaPlus size={12} /> <span className="hidden sm:inline">Añadir categoría</span>
            </Link>
          )}
        </div>
        <button
          onClick={handleToggleEditMode}
          disabled={isFinalized}
          title={isFinalized ? 'El torneo está Finalizado. No se pueden realizar modificaciones.' : ''}
          className={`px-4 py-2 w-full sm:w-auto rounded-lg transition-colors flex items-center justify-center gap-2 ${
            isFinalized
              ? 'bg-gray-700 opacity-50 cursor-not-allowed text-white'
              : editMode
              ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isFinalized ? <FaLock /> : editMode ? <FaTimes /> : <FaEdit />}
          {isFinalized ? 'Bloqueado' : editMode ? 'Desactivar Edición' : 'Activar Edición'}
        </button>
      </div>

      {/* Banner de torneo finalizado */}
      {isFinalized && (
        <div className="mb-6 bg-gray-700/40 border border-gray-600 rounded-lg px-4 py-3 flex items-center gap-3 text-gray-300 text-sm">
          <FaLock className="text-gray-400 flex-shrink-0" />
          <span><strong className="text-white">Torneo Finalizado.</strong> No se pueden agregar, editar ni eliminar competidores. Reactiva el torneo desde el Panel.</span>
        </div>
      )}
      
      {/* Filtros y búsqueda */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Todas las categorías</option>
          {categories.map((category, index) => (
            <option key={index} value={category}>{category}</option>
          ))}
        </select>
        
        <div className="text-sm text-gray-400 flex items-center">
          {filteredParticipants.length} {filteredParticipants.length === 1 ? 'competidor' : 'competidores'} encontrados
        </div>
      </div>

      {/* Formulario para agregar nuevo competidor */}
      {categories.length > 0 && !isFinalized && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Nombre del competidor"
              value={newParticipant.name}
              onChange={(e) => {
                setNewParticipant({...newParticipant, name: e.target.value});
                if (nameError) setNameError(null);
              }}
              className={`w-full bg-gray-700 border rounded-lg px-4 py-2 focus:outline-none focus:ring-1 ${nameError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-600 focus:border-blue-500 focus:ring-blue-500'}`}
            />
            {nameError && (
              <p className="text-red-400 text-xs mt-1">{nameError}</p>
            )}
          </div>
          
          <div className="flex-1 flex flex-col gap-2">
            <CategoryToggle
              categories={categories}
              selected={newParticipant.category ? [newParticipant.category] : []}
              onToggle={(cat) => setNewParticipant({ ...newParticipant, category: newParticipant.category === cat ? '' : cat })}
            />
          </div>
          
          <button
            onClick={handleAdd}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <FaCheck /> Agregar
          </button>
        </div>
      )}

      {/* Tabla de competidores */}
      <div className="overflow-x-auto rounded-lg border border-gray-700 mb-8">
        <table className="w-full">
          <thead className="bg-gray-750">
            <tr>
              <th className="p-3 text-left w-2/5">Nombre</th>
              <th className="p-3 text-left w-2/5">Categorías</th>
              {editMode && <th className="p-3 text-right w-1/5">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filteredParticipants.length > 0 ? (
              filteredParticipants.map((participant) => (
                <tr key={participant.id} className="hover:bg-gray-750">
                  <td className="p-3">
                    {editMode ? (
                      <div>
                        <input
                          type="text"
                          value={participant.name}
                          onChange={(e) => {
                            handleNameChange(participant.id, e.target.value);
                            if (editNameError) setEditNameError(null);
                          }}
                          onFocus={() => setEditNameError(null)}
                          className={`w-full bg-gray-700 border rounded px-3 py-2 focus:outline-none focus:ring-1 ${editNameError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-600 focus:border-blue-500 focus:ring-blue-500'}`}
                        />
                        {editNameError && (
                          <p className="text-red-400 text-xs mt-1">{editNameError}</p>
                        )}
                      </div>
                    ) : (
                      <span className="px-3 py-2 block">{participant.name}</span>
                    )}
                  </td>
                  <td className="p-3">
                    <CategoryToggle
                      categories={categories}
                      selected={participant.categories.map((catId) => getCategoryName(catId))}
                      onToggle={(catName) => {
                        if (!editMode) return;
                        const cat = tournament.categories.find((c: any) => c.name === catName);
                        if (!cat) return;
                        if (participant.categories.includes(cat.id)) {
                          handleRemoveCategoryClick(participant.id, cat.id, participant.name, catName);
                        } else {
                          handleAddCategory(participant.id, catName);
                        }
                      }}
                    />
                  </td>
                  {editMode && (
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setParticipantToDelete(participant)}
                        className="text-red-500 hover:text-red-400 px-3 py-1 rounded hover:bg-gray-700 transition-colors flex items-center gap-1 mx-auto"
                        title="Eliminar competidor"
                      >
                        <FaTrash /> Eliminar
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={editMode ? 3 : 2} className="p-4 text-center text-gray-400">
                  No se encontraron competidores
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de confirmación para eliminar competidor */}
      {participantToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
          <div className="bg-boxdark rounded-lg shadow-xl w-full max-w-md border border-gray-600 overflow-hidden transform transition-all">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/20 text-red-500 mb-4 mx-auto">
                <FaTrash size={20} />
              </div>
              <h3 className="text-xl font-bold text-center text-white mb-2">Eliminar Competidor</h3>
              <p className="text-gray-400 text-center text-sm mb-4">
                ¿Estás seguro que deseas expulsar del torneo a <span className="font-semibold">{participantToDelete.name}</span>? Perderá todos sus registros.
              </p>
              {tournament?.categories?.some((cat: any) => cat.rounds?.some((r: any) => r.results?.some((res: any) => res.idCompetitor === participantToDelete.id))) && (
                <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 text-xs text-red-400 mb-4 flex items-start gap-2">
                  <FaExclamationTriangle className="mt-0.5 flex-shrink-0" />
                  <span><strong>Este competidor tiene resultados registrados.</strong> Al eliminarlo se perderán definitivamente sus tiempos en todas las rondas.</span>
                </div>
              )}
              <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-3 text-xs text-yellow-400 mb-6 flex items-start gap-2">
                <FaExclamationTriangle className="mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Nota:</strong> Si este competidor ya tenía lugar en los Horarios/Grupos, su nombre aparecerá temporalmente como "Desconocido". Recuerda <strong>re-generar los horarios</strong> de sus categorías para equilibrar nuevamente.
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setParticipantToDelete(null)}
                  className="flex-1 py-2.5 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(participantToDelete.id)}
                  className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm flex justify-center"
                >
                  Sí, Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para remover categoría */}
      {categoryToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
          <div className="bg-boxdark rounded-lg shadow-xl w-full max-w-md border border-gray-600 overflow-hidden transform transition-all">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/20 text-red-500 mb-4 mx-auto">
                <FaTrash size={20} />
              </div>
              <h3 className="text-xl font-bold text-center text-white mb-2">Remover Categoría</h3>
              <p className="text-gray-400 text-center text-sm mb-4">
                ¿Seguro que deseas retirar la categoría de <strong>{categoryToRemove.categoryName}</strong> al competidor <span className="font-semibold">{categoryToRemove.participantName}</span>?
              </p>
              <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-3 text-xs text-yellow-400 mb-6 flex items-start gap-2">
                <FaExclamationTriangle className="mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Atención:</strong> Dejará un hueco como "Desconocido" en cualquier horario previamente generado de esta categoría. Se recomienda regenerar los grupos.
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setCategoryToRemove(null)}
                  className="flex-1 py-2.5 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmRemoveCategory}
                  className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm flex justify-center"
                >
                  Sí, Retirar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de salida */}
      {showExitModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-boxdark rounded-lg shadow-xl w-full max-w-md border border-gray-600 overflow-hidden transform transition-all">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-500/20 text-yellow-500 mb-4 mx-auto">
                <FaSave size={22} />
              </div>
              <h3 className="text-xl font-bold text-center text-white mb-2">Guardar Cambios</h3>
              <p className="text-gray-400 text-center text-sm mb-6">
                Se modificaron <strong className="text-white">{changedCount}</strong> {changedCount === 1 ? 'competidor' : 'competidores'}. ¿Qué deseas hacer con los cambios?
              </p>
              <div className="flex flex-col gap-2">
                <button onClick={handleSaveAll} className="w-full py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2">
                  <FaCheck /> Guardar Cambios
                </button>
                <button onClick={handleDiscardAll} className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2">
                  <FaUndo /> Descartar Cambios
                </button>
                <button onClick={() => setShowExitModal(false)} className="w-full py-2.5 px-4 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors font-medium text-sm">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notificación del modo edición */}
      {editMode && (
        <div className="fixed bottom-4 right-4 bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-bounce">
          <FaEdit /> Modo edición activado
        </div>
      )}

      {/* Footer Area */}
      <div className="mt-12 pt-6 border-t border-gray-700 pb-8">
        <div className="bg-gray-800/50 rounded-lg p-5 mb-6 text-sm text-gray-400">
          <h4 className="font-semibold text-gray-300 mb-2">¿Cómo funciona esta sección?</h4>
          <p>
            Desde aquí puedes gestionar a todos los competidores de tu torneo. 
            Utiliza el botón <strong>Activar Edición</strong> en la parte superior para habilitar modificaciones en los nombres de los competidores o gestionar las categorías en las que participan. 
            Estando en el modo de edición, haz clic en la 'x' junto al nombre de una categoría para dar de baja a un competidor de ella, o presiona el botón "Eliminar" de su fila si deseas retirarlo por completo del torneo.
          </p>
        </div>
        <div className="text-center text-xs text-gray-500">
          © 2026 ruTournament - Sebastian Daza Pérez
        </div>
      </div>

    </div>
  );
};

export default Participants;
