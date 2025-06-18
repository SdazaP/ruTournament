import React, { useState } from 'react';
import { FaSearch, FaTrash, FaEdit, FaTimes, FaCheck } from 'react-icons/fa';

type Participant = {
  id: number;
  name: string;
  categories: string[];
};

const Participants = () => {
  const [participants, setParticipants] = useState<Participant[]>([
    { id: 1, name: 'Juan Pérez', categories: ['3x3', '4x4'] },
    { id: 2, name: 'María García', categories: ['3x3 OH'] },
    { id: 3, name: 'Carlos López', categories: ['4x4', 'Pyraminx'] },
  ]);

  const [newParticipant, setNewParticipant] = useState({
    name: '',
    category: '3x3'
  });

  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [participantToDelete, setParticipantToDelete] = useState<Participant | null>(null);

  const categories = ['3x3', '4x4', '3x3 OH', '2x2', 'Pyraminx', 'Megaminx', 'Skewb'];

  // Filtrar participantes
  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = participant.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === '' || participant.categories.includes(categoryFilter);
    return matchesSearch && matchesCategory;
  });

  const handleAdd = () => {
    if (newParticipant.name.trim() === '') return;
    
    setParticipants([
      ...participants,
      {
        id: Date.now(),
        name: newParticipant.name,
        categories: [newParticipant.category]
      }
    ]);
    
    setNewParticipant({ name: '', category: '3x3' });
  };

  const handleDelete = (id: number) => {
    setParticipants(participants.filter(participant => participant.id !== id));
    setParticipantToDelete(null);
  };

  const handleAddCategory = (id: number, category: string) => {
    if (!editMode) return;
    
    setParticipants(participants.map(participant => {
      if (participant.id === id && !participant.categories.includes(category)) {
        return { ...participant, categories: [...participant.categories, category] };
      }
      return participant;
    }));
  };

  const handleRemoveCategory = (id: number, category: string) => {
    if (!editMode) return;
    
    setParticipants(participants.map(participant => {
      if (participant.id === id) {
        return { 
          ...participant, 
          categories: participant.categories.filter(c => c !== category) 
        };
      }
      return participant;
    }));
  };

  const handleNameChange = (id: number, newName: string) => {
    if (!editMode) return;
    
    setParticipants(participants.map(participant => 
      participant.id === id ? { ...participant, name: newName } : participant
    ));
  };

  return (
    <div className="min-h-screen text-white p-4 sm:p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Participantes</h2>
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
                      {participant.categories.map((category) => (
                        <div key={category} className="flex items-center bg-gray-700 rounded-full px-3 py-1">
                          <span className="text-sm">{category}</span>
                          {editMode && (
                            <button 
                              onClick={() => handleRemoveCategory(participant.id, category)}
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
                          .filter(cat => !participant.categories.includes(cat))
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