import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  FaEdit,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUpload,
  FaTimes,
  FaSave,
} from 'react-icons/fa';
import { MdCategory, MdPeople } from 'react-icons/md';
import { getTournaments, setTournaments } from '../../utils/localStorage';

type Tournament = {
  id: string;
  name: string;
  description: string;
  date: string;
  location: string;
  status: 'activo' | 'finalizado' | 'proximamente';
  logo?: string;
  categories: {
    id: string;
    name: string;
    format: string;
    rounds: any[];
  }[];
  competitors: {
    id: string;
    name: string;
    categories: string[];
  }[];
};

type Participant = {
  id: string;
  name: string;
  category: string;
  categoryId: string;
};

type Category = {
  id: string;
  name: string;
  participants: number;
};

const TournamentWelcome = () => {
  const { id } = useParams();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cargar datos del torneo
  useEffect(() => {
    if (id) {
      const tournaments = getTournaments();
      const foundTournament = tournaments.find(t => t.id === id);
      
      if (foundTournament) {
        setTournamentData(foundTournament);
      }
      setLoading(false);
    }
  }, [id]);

  const setTournamentData = (tournamentData: Tournament) => {
    setTournament(tournamentData);
    
    // Procesar participantes
    const processedParticipants = tournamentData.competitors.map(comp => {
      const firstCategoryId = comp.categories.length > 0 ? comp.categories[0] : '';
      const categoryName = tournamentData.categories.find(cat => cat.id === firstCategoryId)?.name || 'Sin categoría';
      
      return {
        id: comp.id,
        name: comp.name,
        category: categoryName,
        categoryId: firstCategoryId
      };
    });
    setParticipants(processedParticipants);
    
    // Procesar categorías
    const processedCategories = tournamentData.categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      participants: tournamentData.competitors.filter(comp => 
        comp.categories.includes(cat.id)
      ).length
    }));
    setCategories(processedCategories);
  };

  // Manejar cambio de logo
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editMode || !tournament) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && tournament) {
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
    if (!editMode || !tournament) return;
    setTournament({
      ...tournament,
      [field]: value,
    });
  };

  // Guardar cambios en el torneo
  const saveChanges = () => {
    if (!tournament) return;
    
    const allTournaments = getTournaments();
    const updatedTournaments = allTournaments.map(t => 
      t.id === tournament.id ? tournament : t
    );
    
    setTournaments(updatedTournaments);
    setEditMode(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen text-white p-6 mx-auto flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen text-white p-6 mx-auto flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Torneo no encontrado</h1>
          <p className="text-gray-400">El torneo solicitado no existe o no se pudo cargar.</p>
          <Link 
            to="/dashboard/tournaments" 
            className="mt-4 inline-block px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Volver a torneos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white p-6 mx-auto">
      {/* Encabezado con botones */}
      <div className="flex justify-between items-center mt-6 mb-4">
        <h1 className="text-3xl font-bold">Panel del Torneo</h1>
        <div className="flex items-center gap-2">
          {editMode && (
            <button
              onClick={saveChanges}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700"
            >
              <FaSave /> Guardar
            </button>
          )}
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
                <FaTimes /> Cancelar
              </>
            ) : (
              <>
                <FaEdit /> Editar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notificación del modo edición */}
      {editMode && (
        <div className="fixed bottom-4 right-4 bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-bounce">
          <FaEdit /> Modo edición activado
        </div>
      )}

      {/* Sección principal en 3 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Columna 1: Logo */}
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
                disabled={!editMode}
              />
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
                {['activo', 'proximamente', 'finalizado'].map((status) => {
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
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <FaCalendarAlt /> Fecha
              </label>
              <input
                type="date"
                value={tournament.date}
                onChange={(e) =>
                  handleTournamentChange('date', e.target.value)
                }
                className={`w-full bg-gray-700 border border-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition [color-scheme:dark] ${
                  !editMode ? 'cursor-not-allowed opacity-70' : ''
                }`}
                disabled={!editMode}
              />
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
                disabled={!editMode}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sección de categorías y participantes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Categorías */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <MdCategory /> Categorías ({categories.length})
            </h2>
            <Link
              to={`/dashboard/tournament/${id}/categories`}
              className="px-4 py-2 bg-blue-600 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2"
            >
              + Gestionar categorías
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/dashboard/tournament/${id}/categories/${category.id}`}
                className={`flex flex-col items-center p-3 rounded-lg transition-colors hover:bg-gray-700 bg-gray-750`}
              >
                <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mb-2 text-sm">
                  {category.name.substring(0, 2)}
                </div>
                <span className="text-sm font-medium">{category.name}</span>
                <span className="text-xs text-gray-400 mt-1">
                  {category.participants}{' '}
                  {category.participants === 1 ? 'participante' : 'participantes'}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Participantes */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 whitespace-nowrap">
              <MdPeople className="text-lg sm:text-xl" /> Participantes ({participants.length})
            </h2>
            <Link
              to={`/dashboard/tournament/${id}/competitors`}
              className="px-4 py-2 bg-blue-600 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start"
            >
              + Gestionar participantes
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-750">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-medium">Nombre</th>
                  <th className="py-3 px-4 text-left text-sm font-medium">Categoría</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {participants.slice(0, 5).map((participant) => (
                  <tr key={participant.id} className="hover:bg-gray-750">
                    <td className="py-3 px-4">
                      {participant.name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block bg-gray-700 rounded-full px-3 py-1 text-xs">
                        {participant.category}
                      </span>
                    </td>
                  </tr>
                ))}
                {participants.length > 5 && (
                  <tr>
                    <td colSpan={2} className="py-3 px-4 text-center text-sm text-gray-400">
                      + {participants.length - 5} participantes más
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentWelcome;