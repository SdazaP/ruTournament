import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaEdit,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUpload,
  FaTimes,
} from 'react-icons/fa';
import { MdCategory, MdPeople } from 'react-icons/md';

type Tournament = {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  logo: string | null;
  status: 'Activo' | 'Próximamente' | 'Finalizado';
};

type Participant = {
  id: number;
  name: string;
  category: string;
};

type Category = {
  name: string;
  icon: string;
  participants: number;
};

const TournamentWelcome = () => {
  // Estado del torneo
  const [tournament, setTournament] = useState<Tournament>({
    name: 'Torneo Nacional de Cubos 2023',
    description: 'El mayor evento de speedcubing del año',
    startDate: '2023-11-15',
    endDate: '2023-11-17',
    location: 'Centro de Convenciones, Ciudad',
    logo: null,
    status: 'Próximamente',
  });

  // Participantes
  const [participants, setParticipants] = useState<Participant[]>([
    { id: 1, name: 'Juan Pérez', category: '3x3' },
    { id: 2, name: 'María García', category: '3x3 OH' },
    { id: 3, name: 'Carlos López', category: '4x4' },
    { id: 4, name: 'Ana Martínez', category: '3x3' },
    { id: 5, name: 'Luis Rodríguez', category: '2x2' },
  ]);

  // Categorías
  const [categories, setCategories] = useState<Category[]>([
    { name: '3x3', icon: '3x3', participants: 2 },
    { name: '4x4', icon: '4x4', participants: 1 },
    { name: '3x3 OH', icon: 'OH', participants: 1 },
    { name: '2x2', icon: '2x2', participants: 1 },
    { name: 'Pyraminx', icon: 'Pyr', participants: 0 },
  ]);

  // Estado del modo edición
  const [editMode, setEditMode] = useState(false);
  const [editingParticipant, setEditingParticipant] =
    useState<Participant | null>(null);

  // Manejar cambio de logo
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editMode) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setTournament({
            ...tournament,
            logo: event.target.result as string,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Manejar cambios en los campos del torneo
  const handleTournamentChange = (field: keyof Tournament, value: string) => {
    if (!editMode) return;
    setTournament({
      ...tournament,
      [field]: value,
    });
  };

  return (
    <div className="min-h-screen text-white p-6 mx-auto">
      {/* Encabezado con botón de edición */}
      <div className="flex justify-between items-center mt-6 mb-4">
        <h1 className="text-3xl font-bold">Panel del Torneo</h1>
        <button
          onClick={() => setEditMode(!editMode)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            editMode
              ? 'bg-yellow-600 hover:bg-yellow-700'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {editMode ? (
            <>
              <FaTimes /> Salir de edición
            </>
          ) : (
            <>
              <FaEdit /> Modo edición
            </>
          )}
        </button>
      </div>

      {/* Notificación del modo edición */}
      {editMode && (
        <div className="fixed bottom-4 right-4 bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-bounce">
          <FaEdit /> Modo edición activado
        </div>
      )}

      {/* Encabezado en 3 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Columna 1: Logo con funcionalidad de carga */}
        <div className="flex flex-col items-center justify-center">
          <div
            className={`relative group w-40 h-40 mb-4 ${
              editMode ? 'cursor-pointer' : ''
            }`}
          >
            <div className="w-full h-full bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
              {tournament.logo ? (
                <img
                  src={tournament.logo}
                  alt="Logo del torneo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-400 text-xl">Logo</span>
              )}
            </div>
            {editMode && (
              <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <div className="text-center p-2">
                  <FaUpload className="w-6 h-6 mx-auto mb-1" />
                  <span className="text-xs">
                    {tournament.logo ? 'Cambiar' : 'Subir'} logo
                  </span>
                </div>
              </label>
            )}
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-1">Logo del Torneo</h3>
            <p className="text-sm text-gray-400">Recomendado: 400×400 px</p>
          </div>
        </div>

        {/* Columna 2: Información General */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FaEdit /> Información General
            </h2>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nombre del Torneo
              </label>
              <input
                type="text"
                value={tournament.name}
                onChange={(e) => handleTournamentChange('name', e.target.value)}
                className={`w-full bg-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                  !editMode ? 'cursor-not-allowed opacity-70' : ''
                }`}
                placeholder="Ej: Torneo Nacional de Cubos 2023"
                disabled={!editMode}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Descripción
              </label>
              <textarea
                value={tournament.description}
                onChange={(e) =>
                  handleTournamentChange('description', e.target.value)
                }
                className={`w-full bg-gray-700 rounded-lg px-4 py-3 h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                  !editMode ? 'cursor-not-allowed opacity-70' : ''
                }`}
                placeholder="Describe el propósito y detalles del torneo..."
                disabled={!editMode}
              />
              <p className="text-xs text-gray-500 mt-1">
                Máximo 500 caracteres
              </p>
            </div>
          </div>
        </div>

        {/* Columna 3: Detalles del Evento */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FaCalendarAlt /> Detalles del Evento
            </h2>
          </div>
          <div className="space-y-5">
            {/* Estado del Evento */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Estado del Evento
              </label>
              <div className="flex flex-wrap gap-3">
                {['Activo', 'Próximamente', 'Finalizado'].map((status) => {
                  const isCurrent = tournament.status === status;
                  return (
                    <button
                      key={status}
                      onClick={() =>
                        editMode && handleTournamentChange('status', status)
                      }
                      className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                        isCurrent
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 hover:bg-gray-600'
                      } ${
                        !editMode
                          ? 'cursor-not-allowed opacity-70'
                          : 'cursor-pointer'
                      }`}
                      disabled={!editMode}
                    >
                      {status}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Fecha de Inicio
                </label>
                <input
                  type="date"
                  value={tournament.startDate}
                  onChange={(e) =>
                    handleTournamentChange('startDate', e.target.value)
                  }
                  className={`w-full bg-gray-700 border border-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition [color-scheme:dark] ${
                    !editMode ? 'cursor-not-allowed opacity-70' : ''
                  }`}
                  disabled={!editMode}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Fecha de Fin
                </label>
                <input
                  type="date"
                  value={tournament.endDate}
                  onChange={(e) =>
                    handleTournamentChange('endDate', e.target.value)
                  }
                  className={`w-full bg-gray-700 border border-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition [color-scheme:dark] ${
                    !editMode ? 'cursor-not-allowed opacity-70' : ''
                  }`}
                  disabled={!editMode}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <FaMapMarkerAlt /> Ubicación
              </label>
              <input
                type="text"
                value={tournament.location}
                onChange={(e) =>
                  handleTournamentChange('location', e.target.value)
                }
                className={`w-full bg-gray-700 border border-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                  !editMode ? 'cursor-not-allowed opacity-70' : ''
                }`}
                placeholder="Ej: Centro de Convenciones, Bogotá"
                disabled={!editMode}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sección de categorías y participantes en 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Columna de categorías */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <MdCategory /> Categorías
            </h2>
            <Link
              to="categories"
              className="px-4 py-2 bg-blue-600 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2"
            >
              + Añadir categoría
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div
                key={category.name}
                className={`flex flex-col items-center p-3 rounded-lg transition-colors ${
                  editMode
                    ? 'bg-gray-750 hover:bg-gray-700 cursor-pointer'
                    : 'bg-gray-750'
                }`}
              >
                <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mb-2 text-sm">
                  {category.icon}
                </div>
                <span className="text-sm font-medium">{category.name}</span>
                <span className="text-xs text-gray-400 mt-1">
                  {category.participants}{' '}
                  {category.participants === 1
                    ? 'participante'
                    : 'participantes'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Columna de participantes */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 whitespace-nowrap">
              <MdPeople className="text-lg sm:text-xl" /> Participantes
            </h2>
            <Link
              to="competitors"
              className="px-4 py-2 bg-blue-600 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start"
            >
              + Añadir participante
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-750">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-medium">
                    Nombre
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-medium">
                    Categoría
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {participants.map((participant) => (
                  <tr key={participant.id} className="hover:bg-gray-750">
                    <td className="py-3 px-4">
                      {editingParticipant?.id === participant.id ? (
                        <input
                          type="text"
                          value={editingParticipant.name}
                          onChange={(e) =>
                            setEditingParticipant({
                              ...editingParticipant,
                              name: e.target.value,
                            })
                          }
                          className="w-full bg-gray-700 rounded px-2 py-1"
                        />
                      ) : (
                        participant.name
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {editingParticipant?.id === participant.id ? (
                        <select
                          value={editingParticipant.category}
                          onChange={(e) =>
                            setEditingParticipant({
                              ...editingParticipant,
                              category: e.target.value,
                            })
                          }
                          className="bg-gray-700 rounded px-2 py-1 text-sm"
                        >
                          {categories.map((cat) => (
                            <option key={cat.name} value={cat.name}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="inline-block bg-gray-700 rounded-full px-3 py-1 text-xs">
                          {participant.category}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentWelcome;
