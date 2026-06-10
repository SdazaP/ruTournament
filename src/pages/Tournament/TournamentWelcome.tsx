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
  FaTrophy,
  FaUndo,
  FaCheck,
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
  const [pendingStatus, setPendingStatus] = useState<
    Tournament['status'] | null
  >(null);
  const [originalTournament, setOriginalTournament] =
    useState<Tournament | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);

  // Cargar datos del torneo
  useEffect(() => {
    if (id) {
      db.tournaments.get(id).then((foundTournament) => {
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
    const processedParticipants = tournamentData.competitors.map((comp) => {
      const firstCategoryId =
        comp.categories.length > 0 ? comp.categories[0] : '';
      const categoryName =
        tournamentData.categories.find((cat) => cat.id === firstCategoryId)
          ?.name || 'Sin categoría';

      return {
        id: comp.id,
        name: comp.name,
        category: categoryName,
        categoryId: firstCategoryId,
      };
    });
    setParticipants(processedParticipants);

    // Procesar categorías
    const processedCategories = tournamentData.categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      participants: tournamentData.competitors.filter((comp) =>
        comp.categories.includes(cat.id),
      ).length,
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
    setOriginalTournament(null);
    setShowExitModal(false);
  };

  const handleDiscardChanges = () => {
    if (originalTournament) {
      setTournament(originalTournament);
    }
    setEditMode(false);
    setOriginalTournament(null);
    setShowExitModal(false);
  };

  // Manejar el toggle del botón Editar / Cancelar
  const handleEditToggle = () => {
    if (!editMode) {
      setOriginalTournament(JSON.parse(JSON.stringify(tournament)));
      setEditMode(true);
    } else {
      if (tournament && originalTournament) {
        const hasChanges =
          tournament.name !== originalTournament.name ||
          tournament.description !== originalTournament.description ||
          tournament.date !== originalTournament.date ||
          tournament.location !== originalTournament.location ||
          tournament.logo !== originalTournament.logo ||
          tournament.status !== originalTournament.status;
        if (hasChanges) {
          setShowExitModal(true);
          return;
        }
      }
      setEditMode(false);
      setOriginalTournament(null);
    }
  };

  // Solicitar cambio de estado: Siempre abre el modal para pedir confirmación
  const requestStatusChange = (newStatus: Tournament['status']) => {
    if (newStatus === tournament?.status) return;
    setPendingStatus(newStatus);
    setShowStatusModal(true);
  };

  // Confirmar cambio de estado (viene del modal)
  const confirmStatusChange = async () => {
    if (!tournament || !pendingStatus) return;

    // Aplicamos el nuevo estado localmente
    const updated = { ...tournament, status: pendingStatus };
    setTournament(updated);

    // Si NO estamos en modo edición, persistimos inmediatamente en la base de datos
    if (!editMode) {
      await db.tournaments.put(updated as any);
    }

    setShowStatusModal(false);
    setPendingStatus(null);
  };

  // Cancelar modal
  const cancelStatusChange = () => {
    setShowStatusModal(false);
    setPendingStatus(null);
  };

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
          <p className="text-gray-400">
            El torneo solicitado no existe o no se pudo cargar.
          </p>
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
    <div className="min-h-screen dark:text-white text-gray-900 p-6 mx-auto">
      {/* Encabezado con botones */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-6 mb-4 gap-4">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FaTrophy className="text-blue-400" /> Panel del Torneo
        </h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          {editMode && (
            <>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 text-white w-full sm:w-auto bg-red-600 rounded-lg hover:bg-red-700 transition"
                title="Eliminar este torneo permanentemente"
              >
                <FaTrash /> Eliminar
              </button>
              <button
                onClick={saveChanges}
                className="flex items-center justify-center gap-2 px-4 py-2 text-white w-full sm:w-auto bg-green-600 rounded-lg hover:bg-green-700 transition"
              >
                <FaSave /> Guardar
              </button>
            </>
          )}
          <button
            onClick={handleEditToggle}
            className={`flex items-center justify-center gap-2 px-4 py-2 w-full text-white sm:w-auto rounded-lg transition-colors ${
              editMode
                ? 'bg-yellow-600 hover:bg-yellow-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {editMode ? <FaTimes /> : <FaEdit />}
            {editMode ? 'Cancelar' : 'Editar'}
          </button>
        </div>
      </div>

      {/* Banner de estado del torneo */}
      {tournament.status === 'finalizado' && (
        <div className="mb-6 dark:bg-gray-700 bg-gray-100/50 border dark:border-gray-600 border-gray-300 rounded-lg px-5 py-3 flex items-center gap-3 text-gray-300">
          <FaLock className="text-gray-400 flex-shrink-0" />
          <span className="text-sm">
            Este torneo está <strong className="text-white">Finalizado</strong>.
            No se pueden realizar modificaciones. Para editar, cambia el estado
            a <strong>Activo</strong>.
          </span>
        </div>
      )}
      {tournament.status === 'proximamente' && (
        <div className="mb-6 bg-blue-900/20 border border-blue-700/40 rounded-lg px-5 py-3 flex items-center gap-3 text-blue-300">
          <FaClock className="flex-shrink-0" />
          <span className="text-sm">
            Torneo en estado{' '}
            <strong className="text-white">Próximamente</strong>. Puedes editar
            la información general pero <strong>no subir resultados</strong>.
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
            <div className="w-full h-full dark:bg-gray-700 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
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
        <div className="dark:bg-gray-800 bg-white rounded-xl p-6">
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
                className={`w-full dark:bg-gray-700 bg-gray-100 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
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
                className={`w-full dark:bg-gray-700 bg-gray-100 rounded-lg px-4 py-3 h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                  !editMode ? 'cursor-not-allowed opacity-70' : ''
                }`}
                disabled={!editMode}
              />
            </div>
          </div>
        </div>

        {/* Columna 3: Detalles del Evento */}
        <div className="dark:bg-gray-800 bg-white rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FaCalendarAlt /> Detalles del Evento
            </h2>
          </div>
          <div className="space-y-5">
            {/* Estado del Evento */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                Estado del Evento
              </label>
              <div className="flex gap-2">
                {(
                  [
                    {
                      key: 'proximamente',
                      label: 'Próx.',
                      icon: FaClock,
                      activeColor: 'bg-blue-600',
                      inactiveHover: 'hover:border-blue-500/60',
                    },
                    {
                      key: 'activo',
                      label: 'Activo',
                      icon: FaCheckCircle,
                      activeColor: 'bg-green-600',
                      inactiveHover: 'hover:border-green-500/60',
                    },
                    {
                      key: 'finalizado',
                      label: 'Final.',
                      icon: FaLock,
                      activeColor: 'bg-gray-500',
                      inactiveHover: 'hover:border-gray-400/60',
                    },
                  ] as const
                ).map(
                  ({ key, label, icon: Icon, activeColor, inactiveHover }) => {
                    const isCurrent = tournament.status === key;
                    return (
                      <button
                        key={key}
                        onClick={() => requestStatusChange(key)}
                        disabled={!editMode}
                        title={
                          !editMode
                            ? 'Activa el modo edición para cambiar el estado'
                            : label
                        }
                        className={`flex-1 flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg text-xs transition-all border ${
                          isCurrent
                            ? `${activeColor} border-transparent text-white shadow-md`
                            : `dark:bg-gray-700 bg-gray-100/70 dark:border-gray-600 border-gray-300 ${
                                editMode ? inactiveHover : ''
                              } text-gray-400 ${
                                editMode ? 'hover:text-white' : ''
                              }`
                        } ${!editMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <Icon size={13} />
                        <span className="font-medium leading-tight">
                          {label}
                        </span>
                      </button>
                    );
                  },
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <FaCalendarAlt /> Fecha
              </label>
              <input
                type="date"
                value={tournament.date}
                onChange={(e) => handleTournamentChange('date', e.target.value)}
                className={`w-full dark:bg-gray-700 bg-gray-100 border dark:border-gray-700 border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition [color-scheme:dark] ${
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
                className={`w-full dark:bg-gray-700 bg-gray-100 border dark:border-gray-700 border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
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
        <div className="dark:bg-gray-800 bg-white rounded-xl p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <MdCategory /> Categorías ({categories.length})
            </h2>
            <Link
              to={`/dashboard/tournament/${id}/categories`}
              className={`px-4 py-2 w-full sm:w-auto bg-blue-600 rounded-lg text-sm text-white transition-all flex items-center justify-center gap-2 ${
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
                to={`/dashboard/tournament/${id}/view/results?tab=wca&category=${category.id}`}
                className={`flex flex-col items-center p-3 rounded-lg transition-colors dark:bg-gray-800 bg-gray-50 ${
                  editMode
                    ? 'opacity-50 pointer-events-none cursor-not-allowed'
                    : 'hover:dark:bg-gray-700 bg-gray-100'
                }`}
              >
                <div className="w-12 h-12 dark:bg-gray-700 bg-gray-100 rounded-full flex items-center justify-center mb-2 text-sm">
                  {category.name.substring(0, 2)}
                </div>
                <span className="text-sm font-medium">{category.name}</span>
                <span className="text-xs text-gray-400 mt-1">
                  {category.participants}{' '}
                  {category.participants === 1 ? 'competidor' : 'competidores'}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Participantes */}
        <div className="dark:bg-gray-800 bg-white rounded-xl p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 whitespace-nowrap">
              <MdPeople className="text-lg sm:text-xl" /> Competidores (
              {participants.length})
            </h2>
            <Link
              to={`/dashboard/tournament/${id}/competitors`}
              className={`px-4 py-2 bg-blue-600 rounded-lg text-sm text-white transition-all flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start ${
                editMode
                  ? 'opacity-50 pointer-events-none cursor-not-allowed grayscale'
                  : 'hover:bg-blue-700'
              }`}
            >
              + Gestionar competidores
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-900 dark:text-gray-100">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="py-3 px-4 text-left font-medium">Nombre</th>
                  <th className="py-3 px-4 text-left font-medium">Categoría</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {participants.slice(0, 5).map((participant) => (
                  <tr
                    key={participant.id}
                    className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
                  >
                    <td className="py-3 px-4">{participant.name}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block rounded-full px-3 py-1 text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                        {participant.category}
                      </span>
                    </td>
                  </tr>
                ))}

                {participants.length > 5 && (
                  <tr className="bg-white dark:bg-gray-800">
                    <td
                      colSpan={2}
                      className="py-3 px-4 text-center text-sm text-gray-400 dark:text-gray-500"
                    >
                      + {participants.length - 5} competidores más
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
          <div className="dark:bg-gray-800 bg-white border dark:border-gray-700 border-gray-200 rounded-xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="text-xl font-bold mb-4  flex items-center gap-2">
              <FaTrash className="text-red-500" /> Confirmar Eliminación
            </h3>
            <p className="mb-4 text-sm">
              Esta acción no se puede deshacer. Se eliminarán permanentemente el
              torneo, junto con todas sus categorías, horarios y competidores
              asociados.
            </p>
            <p className="mb-2 text-sm">
              Para proceder, escribe con exactitud el nombre del torneo:
            </p>
            <div className="dark:bg-gray-900 bg-gray-50 rounded-lg px-3 py-2 text-center select-all font-mono mb-4 font-semibold border dark:border-gray-700 border-gray-200">
              {tournament.name}
            </div>
            <input
              type="text"
              value={deleteInputName}
              onChange={(e) => setDeleteInputName(e.target.value)}
              placeholder="Escribe el nombre aquí..."
              className="w-full dark:bg-gray-700 bg-gray-100 border dark:border-gray-600 border-gray-300 rounded-lg px-4 py-3 mb-6 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all font-mono text-center"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteInputName('');
                }}
                className="px-5 py-2.5 dark:bg-gray-700 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteTournament}
                disabled={deleteInputName !== tournament.name}
                className="px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed dark:disabled:bg-gray-700 dark:disabled:text-gray-500"
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
          <div className="dark:bg-gray-800 bg-white border dark:border-gray-700 border-gray-200 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-500/20 text-yellow-500 mb-4 mx-auto">
              <FaExclamationTriangle size={22} />
            </div>
            <h3 className="text-xl font-bold text-center mb-2">
              Cambiar Estado del Torneo
            </h3>
            <p className=" text-center text-sm mb-4">
              ¿Estás seguro de que deseas cambiar el estado de{' '}
              <strong className="bold">"{tournament.name}"</strong> de{' '}
              <strong>{tournament.status}</strong> a{' '}
              <strong
                className={`font-semibold ${
                  pendingStatus === 'activo'
                    ? 'text-green-700 dark:text-green-400'
                    : pendingStatus === 'finalizado'
                    ? 'text-gray-700 dark:text-gray-300'
                    : 'text-blue-700 dark:text-blue-400'
                }`}
              >
                {pendingStatus}
              </strong>
              ?
            </p>
            {pendingStatus === 'finalizado' && (
              <div className="bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-700/40 dark:text-red-300 rounded-lg p-3 text-xs mb-4 flex items-start gap-2">
                <FaLock className="mt-0.5 flex-shrink-0" />
                <span>
                  El torneo quedará en <strong>solo lectura</strong>. No se
                  podrán realizar ningún tipo de modificaciones hasta que lo
                  reactives.
                </span>
              </div>
            )}

            {pendingStatus === 'proximamente' && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-700/40 dark:text-blue-300 rounded-lg p-3 text-xs mb-4 flex items-start gap-2">
                <FaClock className="mt-0.5 flex-shrink-0" />
                <span>
                  Podrás editar la información del torneo pero{' '}
                  <strong>no podrás subir resultados</strong> hasta que lo
                  actives.
                </span>
              </div>
            )}

            {pendingStatus === 'activo' && (
              <div className="bg-green-50 border border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-700/40 dark:text-green-300 rounded-lg p-3 text-xs mb-4 flex items-start gap-2">
                <FaCheckCircle className="mt-0.5 flex-shrink-0" />
                <span>
                  El torneo quedará completamente editable, incluyendo la carga
                  de resultados.
                </span>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={cancelStatusChange}
                className="flex-1 py-2.5 px-4 dark:bg-gray-700 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={confirmStatusChange}
                className={`flex-1 py-2.5 px-4 text-white rounded-lg transition-colors font-medium text-sm ${
                  pendingStatus === 'activo'
                    ? 'bg-green-600 hover:bg-green-700'
                    : pendingStatus === 'finalizado'
                    ? 'bg-gray-600 hover:bg-gray-800'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Sí, Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de salida */}
      {showExitModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="dark:bg-gray-800 bg-white border dark:border-gray-700 border-gray-200 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-500/20 text-yellow-500 mb-4 mx-auto">
              <FaSave size={22} />
            </div>
            <h3 className="text-xl font-bold text-center mb-2">
              Guardar Cambios
            </h3>
            <p className="text-center text-sm mb-6">
              Tienes cambios sin guardar en la información del torneo. ¿Qué
              deseas hacer?
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={saveChanges}
                className="w-full py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2"
              >
                <FaCheck /> Guardar Cambios
              </button>
              <button
                onClick={handleDiscardChanges}
                className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2"
              >
                <FaUndo /> Descartar Cambios
              </button>
              <button
                onClick={() => setShowExitModal(false)}
                className="w-full py-2.5 px-4 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors font-medium text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentWelcome;
