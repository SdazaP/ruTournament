import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaSearch, FaTrash, FaEdit, FaTimes, FaCheck, FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa';
import { db } from '../../common/db';

type Participant = {
  id: string;
  name: string;
  categories: string[];
  roles?: string[];
};

const AVAILABLE_ROLES = ['judge', 'runner', 'scrambler'];

const Participants = () => {
  const { id: tournamentId } = useParams();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [tournament, setTournament] = useState<any>(null);
  const [categories, setCategories] = useState<string[]>([]);
  
  const [newParticipant, setNewParticipant] = useState({
    name: '',
    category: ''
  });

  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [participantToDelete, setParticipantToDelete] = useState<Participant | null>(null);
  const [categoryToRemove, setCategoryToRemove] = useState<{participantId: string, categoryId: string, participantName: string, categoryName: string} | null>(null);
  const [roleToRemove, setRoleToRemove] = useState<{participantId: string, role: string, participantName: string} | null>(null);

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

  // Filtrar participantes
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
    
    // Encontrar el ID de la categoría seleccionada
    const selectedCategory = tournament.categories.find((cat: any) => cat.name === newParticipant.category);
    if (!selectedCategory) return;
    
    const newParticipantObj: Participant = {
      id: Date.now().toString(),
      name: newParticipant.name,
      categories: [selectedCategory.id],
      roles: []
    };
    
    // Actualizar Dexie
    const currentTournament = await db.tournaments.get(tournamentId);
    if (currentTournament) {
      currentTournament.competitors = [...(currentTournament.competitors || []), newParticipantObj];
      await db.tournaments.put(currentTournament as any);
    }
    
    setParticipants([...participants, newParticipantObj]);
    setNewParticipant({ name: '', category: categories[0] || '' });
  };

  const handleDelete = async (id: string) => {
    if (!tournamentId) return;
    
    // Actualizar Dexie
    const currentTournament = await db.tournaments.get(tournamentId);
    if (currentTournament) {
      currentTournament.competitors = (currentTournament.competitors || []).filter((p: any) => p.id !== id);
      await db.tournaments.put(currentTournament as any);
    }
    
    setParticipants(participants.filter(p => p.id !== id));
    setParticipantToDelete(null);
  };

  const handleAddCategory = async (participantId: string, categoryName: string) => {
    if (!editMode || !tournamentId) return;
    
    // Encontrar el ID de la categoría seleccionada
    const selectedCategory = tournament.categories.find((cat: any) => cat.name === categoryName);
    if (!selectedCategory) return;
    
    // Actualizar Dexie
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
    
    // Actualizar Dexie
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
    
    setParticipants(participants.map(p => 
      p.id === participantId ? { ...p, categories: p.categories.filter(c => c !== categoryId) } : p
    ));
    setCategoryToRemove(null);
  };

  const handleAddRole = async (participantId: string, role: string) => {
    if (!editMode || !tournamentId) return;
    
    const currentTournament = await db.tournaments.get(tournamentId);
    if (currentTournament) {
      currentTournament.competitors = (currentTournament.competitors || []).map((p: any) => {
        if (p.id === participantId) {
          return { ...p, roles: [...(p.roles || []), role] };
        }
        return p;
      });
      await db.tournaments.put(currentTournament as any);
    }
    
    setParticipants(participants.map(p => 
      p.id === participantId ? { ...p, roles: [...(p.roles || []), role] } : p
    ));
  };

  const handleRemoveRoleClick = (participantId: string, role: string, participantName: string) => {
    setRoleToRemove({ participantId, role, participantName });
  };

  const confirmRemoveRole = async () => {
    if (!editMode || !tournamentId || !roleToRemove) return;
    const { participantId, role } = roleToRemove;
    
    const currentTournament = await db.tournaments.get(tournamentId);
    if (currentTournament) {
      currentTournament.competitors = (currentTournament.competitors || []).map((p: any) => {
        if (p.id === participantId) {
          return { ...p, roles: (p.roles || []).filter((r:string) => r !== role) };
        }
        return p;
      });
      await db.tournaments.put(currentTournament as any);
    }
    
    setParticipants(participants.map(p => 
      p.id === participantId ? { ...p, roles: (p.roles || []).filter(r => r !== role) } : p
    ));
    setRoleToRemove(null);
  };

  const handleNameChange = async (participantId: string, newName: string) => {
    if (!editMode || !tournamentId) return;
    
    // Actualizar Dexie
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
    
    setParticipants(participants.map(p => 
      p.id === participantId ? { ...p, name: newName } : p
    ));
  };

  const getCategoryName = (categoryId: string) => {
    const category = tournament?.categories?.find((c: any) => c.id === categoryId);
    return category?.name || categoryId;
  };

  return (
    <div className="min-h-screen text-white p-4 sm:p-6 relative">

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          Participantes {tournament ? `de "${tournament.name}` : ''}"
        </h2>
        <button
          onClick={() => setEditMode(!editMode)}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            editMode 
              ? 'bg-yellow-600 hover:bg-yellow-700' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {editMode ? <FaTimes /> : <FaEdit />}
          {editMode ? 'Desactivar Edición' : 'Activar Edición'}
        </button>
      </div>
      
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
          {filteredParticipants.length} {filteredParticipants.length === 1 ? 'participante' : 'participantes'} encontrados
        </div>
      </div>

      {/* Formulario para agregar nuevo participante */}
      {categories.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Nombre del participante"
            value={newParticipant.name}
            onChange={(e) => setNewParticipant({...newParticipant, name: e.target.value})}
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          
          <select
            value={newParticipant.category}
            onChange={(e) => setNewParticipant({...newParticipant, category: e.target.value})}
            className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {categories.map((category, index) => (
              <option key={index} value={category}>{category}</option>
            ))}
          </select>
          
          <button
            onClick={handleAdd}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <FaCheck /> Agregar
          </button>
        </div>
      )}

      {/* Tabla de participantes */}
      <div className="overflow-x-auto rounded-lg border border-gray-700 mb-8">
        <table className="w-full">
          <thead className="bg-gray-750">
            <tr>
              <th className="p-3 text-left w-1/4">Nombre</th>
              <th className="p-3 text-left w-1/3">Categorías</th>
              <th className="p-3 text-left w-1/4">Roles</th>
              {editMode && <th className="p-3 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filteredParticipants.length > 0 ? (
              filteredParticipants.map((participant) => (
                <tr key={participant.id} className="hover:bg-gray-750">
                  <td className="p-3">
                    {editMode ? (
                      <input
                        type="text"
                        value={participant.name}
                        onChange={(e) => handleNameChange(participant.id, e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="px-3 py-2 block">{participant.name}</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {participant.categories.map((categoryId) => (
                        <div key={categoryId} className="flex items-center bg-gray-700 rounded-full px-3 py-1">
                          <span className="text-sm">{getCategoryName(categoryId)}</span>
                          {editMode && (
                            <button 
                              onClick={() => handleRemoveCategoryClick(participant.id, categoryId, participant.name, getCategoryName(categoryId))}
                              className="ml-2 text-gray-400 hover:text-red-400 text-xs"
                              title="Eliminar categoría"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {editMode && (
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddCategory(participant.id, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        title="Añadir categoría"
                      >
                        <option value="">Añadir categoría...</option>
                        {categories
                          .filter(catName => {
                            const cat = tournament.categories.find((c: any) => c.name === catName);
                            return cat && !participant.categories.includes(cat.id);
                          })
                          .map((category, index) => (
                            <option key={index} value={category}>{category}</option>
                          ))}
                      </select>
                    )}
                  </td>
                  <td className="p-3 align-top">
                    <div className="flex flex-wrap gap-2 mb-2">
                       {(participant.roles || []).map((role) => (
                        <div key={role} className="flex items-center bg-blue-900/50 text-blue-300 border border-blue-700/50 rounded-full px-3 py-1">
                          <span className="text-sm capitalize">{role}</span>
                          {editMode && (
                            <button 
                              onClick={() => handleRemoveRoleClick(participant.id, role, participant.name)}
                              className="ml-2 text-blue-400 hover:text-red-400 text-xs"
                              title="Eliminar rol"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {editMode && (
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddRole(participant.id, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        title="Añadir rol"
                      >
                        <option value="">Añadir rol...</option>
                        {AVAILABLE_ROLES
                          .filter(role => !(participant.roles || []).includes(role))
                          .map((role) => (
                            <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                          ))}
                      </select>
                    )}
                  </td>
                  {editMode && (
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setParticipantToDelete(participant)}
                        className="text-red-500 hover:text-red-400 px-3 py-1 rounded hover:bg-gray-700 transition-colors flex items-center gap-1 mx-auto"
                        title="Eliminar participante"
                      >
                        <FaTrash /> Eliminar
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={editMode ? 4 : 3} className="p-4 text-center text-gray-400">
                  No se encontraron participantes
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
              <h3 className="text-xl font-bold text-center text-white mb-2">Eliminar Participante</h3>
              <p className="text-gray-400 text-center text-sm mb-4">
                ¿Estás seguro que deseas expulsar del torneo a <span className="font-semibold">{participantToDelete.name}</span>? Perderá todos sus registros y roles de staff en los grupos seleccionados.
              </p>
              <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-3 text-xs text-yellow-400 mb-6 flex items-start gap-2">
                <FaExclamationTriangle className="mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Nota:</strong> Si este participante ya tenía lugar en los Horarios/Grupos, su nombre aparecerá temporalmente como "Desconocido". Recuerda <strong>re-generar los horarios</strong> de sus categorías para equilibrar nuevamente.
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

      {/* Modal de confirmación para remover rol */}
      {roleToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
          <div className="bg-boxdark rounded-lg shadow-xl w-full max-w-md border border-gray-600 overflow-hidden transform transition-all">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/20 text-red-500 mb-4 mx-auto">
                <FaTrash size={20} />
              </div>
              <h3 className="text-xl font-bold text-center text-white mb-2">Remover Rol de WCA</h3>
              <p className="text-gray-400 text-center text-sm mb-4">
                ¿Confirmas que deseas quitarle el rol de <strong>{roleToRemove.role}</strong> a la persona <span className="font-semibold">{roleToRemove.participantName}</span>? Ya no será tomado en cuenta para futuros sorteos.
              </p>
              <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-3 text-xs text-yellow-400 mb-6 flex items-start gap-2">
                <FaExclamationTriangle className="mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Importante:</strong> Si se le había asignado para ser staff en un horario generado, aparecerá como "Desconocido". Para ajustar y asignar a alguien más será necesario regenerar tu distribución.
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setRoleToRemove(null)}
                  className="flex-1 py-2.5 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmRemoveRole}
                  className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm flex justify-center"
                >
                  Sí, Retirar
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
          <h4 className="font-semibold text-gray-300 mb-2">💡 ¿Cómo funciona esta sección?</h4>
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