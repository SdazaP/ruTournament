import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaSearch, FaTrash, FaEdit, FaTimes, FaCheck, FaArrowLeft } from 'react-icons/fa';
import { getTournaments, setTournaments } from '../../utils/localStorage';

type Participant = {
  id: string;
  name: string;
  categories: string[];
};

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

  // Cargar datos del torneo
  useEffect(() => {
    if (tournamentId) {
      const tournaments = getTournaments();
      const currentTournament = tournaments.find(t => t.id === tournamentId);
      
      if (currentTournament) {
        setTournament(currentTournament);
        setParticipants(currentTournament.competitors || []);
        
        // Obtener categorías disponibles del torneo
        const tournamentCategories = currentTournament.categories?.map((cat: any) => cat.name) || [];
        setCategories(tournamentCategories);
        
        // Establecer primera categoría como predeterminada
        if (tournamentCategories.length > 0) {
          setNewParticipant(prev => ({...prev, category: tournamentCategories[0]}));
        }
      }
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

  const handleAdd = () => {
    if (newParticipant.name.trim() === '' || !newParticipant.category || !tournamentId) return;
    
    // Encontrar el ID de la categoría seleccionada
    const selectedCategory = tournament.categories.find((cat: any) => cat.name === newParticipant.category);
    if (!selectedCategory) return;
    
    const newParticipantObj = {
      id: Date.now().toString(),
      name: newParticipant.name,
      categories: [selectedCategory.id]
    };
    
    // Actualizar localStorage
    const tournaments = getTournaments();
    const updatedTournaments = tournaments.map(t => {
      if (t.id === tournamentId) {
        return {
          ...t,
          competitors: [...(t.competitors || []), newParticipantObj]
        };
      }
      return t;
    });
    
    setTournaments(updatedTournaments);
    setParticipants([...participants, newParticipantObj]);
    setNewParticipant({ name: '', category: categories[0] || '' });
  };

  const handleDelete = (id: string) => {
    if (!tournamentId) return;
    
    // Actualizar localStorage
    const tournaments = getTournaments();
    const updatedTournaments = tournaments.map(t => {
      if (t.id === tournamentId) {
        return {
          ...t,
          competitors: t.competitors.filter((p: any) => p.id !== id)
        };
      }
      return t;
    });
    
    setTournaments(updatedTournaments);
    setParticipants(participants.filter(p => p.id !== id));
    setParticipantToDelete(null);
  };

  const handleAddCategory = (participantId: string, categoryName: string) => {
    if (!editMode || !tournamentId) return;
    
    // Encontrar el ID de la categoría seleccionada
    const selectedCategory = tournament.categories.find((cat: any) => cat.name === categoryName);
    if (!selectedCategory) return;
    
    // Actualizar localStorage
    const tournaments = getTournaments();
    const updatedTournaments = tournaments.map(t => {
      if (t.id === tournamentId) {
        return {
          ...t,
          competitors: t.competitors.map((p: any) => {
            if (p.id === participantId && !p.categories.includes(selectedCategory.id)) {
              return { ...p, categories: [...p.categories, selectedCategory.id] };
            }
            return p;
          })
        };
      }
      return t;
    });
    
    setTournaments(updatedTournaments);
    setParticipants(participants.map(p => {
      if (p.id === participantId && !p.categories.includes(selectedCategory.id)) {
        return { ...p, categories: [...p.categories, selectedCategory.id] };
      }
      return p;
    }));
  };

  const handleRemoveCategory = (participantId: string, categoryId: string) => {
    if (!editMode || !tournamentId) return;
    
    // Actualizar localStorage
    const tournaments = getTournaments();
    const updatedTournaments = tournaments.map(t => {
      if (t.id === tournamentId) {
        return {
          ...t,
          competitors: t.competitors.map((p: any) => {
            if (p.id === participantId) {
              return { 
                ...p, 
                categories: p.categories.filter((c: string) => c !== categoryId) 
              };
            }
            return p;
          })
        };
      }
      return t;
    });
    
    setTournaments(updatedTournaments);
    setParticipants(participants.map(p => {
      if (p.id === participantId) {
        return { ...p, categories: p.categories.filter(c => c !== categoryId) };
      }
      return p;
    }));
  };

  const handleNameChange = (participantId: string, newName: string) => {
    if (!editMode || !tournamentId) return;
    
    // Actualizar localStorage
    const tournaments = getTournaments();
    const updatedTournaments = tournaments.map(t => {
      if (t.id === tournamentId) {
        return {
          ...t,
          competitors: t.competitors.map((p: any) => {
            if (p.id === participantId) {
              return { ...p, name: newName };
            }
            return p;
          })
        };
      }
      return t;
    });
    
    setTournaments(updatedTournaments);
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
              <th className="p-3 text-left">Nombre</th>
              <th className="p-3 text-left">Categorías</th>
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
                              onClick={() => handleRemoveCategory(participant.id, categoryId)}
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
                <td colSpan={editMode ? 3 : 2} className="p-4 text-center text-gray-400">
                  No se encontraron participantes
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de confirmación para eliminar */}
      {participantToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Confirmar eliminación</h3>
            <p className="mb-6">
              ¿Estás seguro que deseas eliminar al participante <span className="font-semibold">{participantToDelete.name}</span>?
              Esta acción no se puede deshacer.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setParticipantToDelete(null)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(participantToDelete.id)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <FaTrash /> Eliminar
              </button>
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
    </div>
  );
};

export default Participants;