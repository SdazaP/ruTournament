import React, { useState } from 'react';

type Participant = {
  id: number;
  name: string;
  categories: string[];
};

const Participants = () => {
  // Estado para los participantes
  const [participants, setParticipants] = useState<Participant[]>([
    { id: 1, name: 'Juan Pérez', categories: ['3x3', '4x4'] },
    { id: 2, name: 'María García', categories: ['3x3 OH'] },
    { id: 3, name: 'Carlos López', categories: ['4x4', 'Pyraminx'] },
  ]);

  // Estado para el nuevo participante
  const [newParticipant, setNewParticipant] = useState({
    name: '',
    category: '3x3'
  });

  // Estado para el modo edición
  const [editMode, setEditMode] = useState(false);

  // Categorías disponibles
  const categories = ['3x3', '4x4', '3x3 OH', '2x2', 'Pyraminx', 'Megaminx', 'Skewb'];

  // Agregar nuevo participante
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

  // Eliminar participante con confirmación
  const handleDelete = (id: number, name: string) => {
    if (!editMode) return;
    
    const confirmDelete = window.confirm(`¿Estás seguro que deseas eliminar a ${name}?`);
    if (confirmDelete) {
      setParticipants(participants.filter(participant => participant.id !== id));
    }
  };

  // Agregar categoría a participante
  const handleAddCategory = (id: number, category: string) => {
    if (!editMode) return;
    
    setParticipants(participants.map(participant => {
      if (participant.id === id && !participant.categories.includes(category)) {
        return { ...participant, categories: [...participant.categories, category] };
      }
      return participant;
    }));
  };

  // Eliminar categoría de participante
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

  // Actualizar nombre de participante
  const handleNameChange = (id: number, newName: string) => {
    if (!editMode) return;
    
    setParticipants(participants.map(participant => 
      participant.id === id ? { ...participant, name: newName } : participant
    ));
  };

  return (
    <div className="min-h-screen text-white p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Participantes</h2>
        <button
          onClick={() => setEditMode(!editMode)}
          className={`px-4 py-2 rounded-lg transition-colors ${
            editMode 
              ? 'bg-yellow-600 hover:bg-yellow-700' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {editMode ? 'Desactivar Edición' : 'Activar Edición'}
        </button>
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
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
        >
          Agregar
        </button>
      </div>

      {/* Tabla de participantes */}
      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="w-full">
          <thead className="bg-gray-750">
            <tr>
              <th className="p-3 text-left">Nombre</th>
              <th className="p-3 text-left">Categorías</th>
              {editMode && <th className="p-3 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {participants.map((participant) => (
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
                      onClick={() => handleDelete(participant.id, participant.name)}
                      className="text-red-500 hover:text-red-400 px-3 py-1 rounded hover:bg-gray-700 transition-colors"
                    >
                      Eliminar
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mensaje cuando no hay participantes */}
      {participants.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No hay participantes registrados aún
        </div>
      )}

      {/* Notificación del modo edición */}
      {editMode && (
        <div className="fixed bottom-4 right-4 bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg">
          Modo edición activado
        </div>
      )}
    </div>
  );
};

export default Participants;