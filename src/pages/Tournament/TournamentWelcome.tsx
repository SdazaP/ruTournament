import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  FaEdit,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUpload,
  FaTimes,
  FaSave,
  FaTrash,
  FaLock,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
} from 'react-icons/fa';
import { MdCategory, MdPeople } from 'react-icons/md';
import { db } from '../../common/db';

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
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInputName, setDeleteInputName] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<Tournament['status'] | null>(null);

  // Cargar datos del torneo
  useEffect(() => {
    if (id) {
      db.tournaments.get(id).then(foundTournament => {
        if (foundTournament) {
          setTournamentData(foundTournament as unknown as Tournament);
        }
        setLoading(false);
      });
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
  const saveChanges = async () => {
    if (!tournament) return;
    await db.tournaments.put(tournament as any);
    setEditMode(false);
  };

  // Solicitar cambio de estado (abre modal de confirmación)
  const requestStatusChange = (newStatus: Tournament['status']) => {
    if (newStatus === tournament?.status) return;
    setPendingStatus(newStatus);
    setShowStatusModal(true);
  };

  // Confirmar y persistir cambio de estado
  const confirmStatusChange = async () => {
    if (!tournament || !pendingStatus || !id) return;
    const updated = { ...tournament, status: pendingStatus };
    await db.tournaments.put(updated as any);
    setTournament(updated);
    setShowStatusModal(false);
    setPendingStatus(null);
  };

  // Helpers de estado
  const isFinalized = tournament?.status === 'finalizado';

  // Eliminar el torneo actual
  const handleDeleteTournament = async () => {
    if (!id || deleteInputName !== tournament?.name) return;
    await db.tournaments.delete(id);
    navigate('/dashboard/tournaments');
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
            <>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition"
                title="Eliminar este torneo permanentemente"
              >
                <FaTrash /> Eliminar
              </button>
              <button
                onClick={saveChanges}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 transition"
              >
                <FaSave /> Guardar
              </button>
            </>
          )}
          <button
            onClick={() => !isFinalized && setEditMode(!editMode)}
            disabled={isFinalized}
            title={isFinalized ? 'El torneo está finalizado. Reactívalo para editar.' : ''}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isFinalized
                ? 'bg-gray-700 opacity-50 cursor-not-allowed'
                : editMode
                ? 'bg-yellow-600 hover:bg-yellow-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isFinalized ? <FaLock /> : editMode ? <FaTimes /> : <FaEdit />}
            {isFinalized ? 'Bloqueado' : editMode ? 'Cancelar' : 'Editar'}
          </button>
        </div>
      </div>

      {/* Banner de estado del torneo */}
      {tournament.status === 'finalizado' && (
        <div className="mb-6 bg-gray-700/50 border border-gray-600 rounded-lg px-5 py-3 flex items-center gap-3 text-gray-300">
          <FaLock className="text-gray-400 flex-shrink-0" />
          <span className="text-sm">
            Este torneo está <strong className="text-white">Finalizado</strong>. No se pueden realizar modificaciones. Para editar, cambia el estado a <strong>Activo</strong>.
          </span>
        </div>
      )}
      {tournament.status === 'proximamente' && (
        <div className="mb-6 bg-blue-900/20 border border-blue-700/40 rounded-lg px-5 py-3 flex items-center gap-3 text-blue-300">
          <FaClock className="flex-shrink-0" />
          <span className="text-sm">
            Torneo en estado <strong className="text-white">Próximamente</strong>. Puedes editar la información general pero <strong>no subir resultados</strong>.
          </span>
        </div>
      )}

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
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Estado del Evento
              </label>
              <div className="flex flex-wrap gap-3">
                {([
                  { key: 'proximamente', label: 'Próximamente', icon: FaClock, activeColor: 'bg-blue-600', desc: 'Editable, sin resultados' },
                  { key: 'activo',       label: 'Activo',        icon: FaCheckCircle, activeColor: 'bg-green-600', desc: 'Edición completa' },
                  { key: 'finalizado',  label: 'Finalizado',    icon: FaLock, activeColor: 'bg-gray-600', desc: 'Solo lectura' },
                ] as const).map(({ key, label, icon: Icon, activeColor, desc }) => {
                  const isCurrent = tournament.status === key;
                  return (
                    <button
                      key={key}
                      onClick={() => requestStatusChange(key)}
                      className={`flex-1 min-w-[110px] flex flex-col items-center gap-1 px-3 py-3 rounded-lg text-sm transition-all border-2 ${
                        isCurrent
                          ? `${activeColor} border-transparent text-white shadow-lg scale-105`
                          : 'bg-gray-700 border-gray-600 hover:border-gray-500 text-gray-300'
                      }`}
                    >
                      <Icon size={16} />
                      <span className="font-semibold">{label}</span>
                      <span className="text-xs opacity-70">{desc}</span>
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
              className={`px-4 py-2 bg-blue-600 rounded-lg text-sm transition-all flex items-center gap-2 ${
                editMode 
                  ? 'opacity-50 pointer-events-none cursor-not-allowed grayscale' 
                  : 'hover:bg-blue-700'
              }`}
            >
              + Gestionar categorías
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/dashboard/tournament/${id}/view/resultsWCA/${category.id}`}
                className={`flex flex-col items-center p-3 rounded-lg transition-colors bg-gray-750 ${
                  editMode 
                    ? 'opacity-50 pointer-events-none cursor-not-allowed' 
                    : 'hover:bg-gray-700'
                }`}
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
              className={`px-4 py-2 bg-blue-600 rounded-lg text-sm transition-all flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start ${
                editMode 
                  ? 'opacity-50 pointer-events-none cursor-not-allowed grayscale' 
                  : 'hover:bg-blue-700'
              }`}
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

      {/* Modal para eliminar torneo con confirmación textual */}
      {showDeleteModal && tournament && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
              <FaTrash className="text-red-500" /> Confirmar Eliminación
            </h3>
            <p className="text-gray-300 mb-4 text-sm">
              Esta acción no se puede deshacer. Se eliminarán permanentemente el torneo, junto con todas sus categorías, horarios y competidores asociados.
            </p>
            <p className="text-gray-400 mb-2 text-sm">
              Para proceder, escribe con exactitud el nombre del torneo:
            </p>
            <div className="bg-gray-900 rounded-lg px-3 py-2 text-center select-all font-mono mb-4 text-gray-300 font-semibold border border-gray-700">
              {tournament.name}
            </div>
            <input
              type="text"
              value={deleteInputName}
              onChange={(e) => setDeleteInputName(e.target.value)}
              placeholder="Escribe el nombre aquí..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 mb-6 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all font-mono text-center"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteInputName('');
                }}
                className="px-5 py-2.5 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteTournament}
                disabled={deleteInputName !== tournament.name}
                className={`px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all ${
                  deleteInputName === tournament.name
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-red-900/40 text-red-300/40 cursor-not-allowed'
                }`}
              >
                Eliminar Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Cambio de Estado */}
      {showStatusModal && pendingStatus && tournament && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-500/20 text-yellow-500 mb-4 mx-auto">
              <FaExclamationTriangle size={22} />
            </div>
            <h3 className="text-xl font-bold text-center text-white mb-2">Cambiar Estado del Torneo</h3>
            <p className="text-gray-400 text-center text-sm mb-4">
              ¿Estás seguro de que deseas cambiar el estado de{' '}
              <strong className="text-white">"{tournament.name}"</strong>{' '}
              de <strong>{tournament.status}</strong> a{' '}
              <strong className={`${
                pendingStatus === 'activo' ? 'text-green-400' :
                pendingStatus === 'finalizado' ? 'text-gray-300' : 'text-blue-400'
              }`}>{pendingStatus}</strong>?
            </p>
            {pendingStatus === 'finalizado' && (
              <div className="bg-red-900/20 border border-red-700/40 rounded-lg p-3 text-xs text-red-300 mb-4 flex items-start gap-2">
                <FaLock className="mt-0.5 flex-shrink-0" />
                <span>El torneo quedará en <strong>solo lectura</strong>. No se podrán realizar ningún tipo de modificaciones hasta que lo reactives.</span>
              </div>
            )}
            {pendingStatus === 'proximamente' && (
              <div className="bg-blue-900/20 border border-blue-700/40 rounded-lg p-3 text-xs text-blue-300 mb-4 flex items-start gap-2">
                <FaClock className="mt-0.5 flex-shrink-0" />
                <span>Podrás editar la información del torneo pero <strong>no podrás subir resultados</strong> hasta que lo actives.</span>
              </div>
            )}
            {pendingStatus === 'activo' && (
              <div className="bg-green-900/20 border border-green-700/40 rounded-lg p-3 text-xs text-green-300 mb-4 flex items-start gap-2">
                <FaCheckCircle className="mt-0.5 flex-shrink-0" />
                <span>El torneo quedará completamente editable, incluyendo la carga de resultados.</span>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowStatusModal(false); setPendingStatus(null); }}
                className="flex-1 py-2.5 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={confirmStatusChange}
                className={`flex-1 py-2.5 px-4 text-white rounded-lg transition-colors font-medium text-sm ${
                  pendingStatus === 'activo' ? 'bg-green-600 hover:bg-green-700' :
                  pendingStatus === 'finalizado' ? 'bg-gray-600 hover:bg-gray-500' :
                  'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Sí, Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentWelcome;