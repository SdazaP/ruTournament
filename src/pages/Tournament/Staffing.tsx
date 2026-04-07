import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { FaUserShield, FaInfoCircle, FaExclamationTriangle, FaEdit, FaTimes, FaGavel, FaRunning, FaRandom } from 'react-icons/fa';
import { MdCategory } from 'react-icons/md';
import { db } from '../../common/db';

type Round = {
  roundNumber: number;
  format: 'ao3' | 'ao5';
  isFinal?: boolean;
};

type Category = {
  id: string;
  name: string;
  format: string;
  rounds: Round[];
};

type Competitor = {
  id: string;
  name: string;
  categories: string[];
  roles?: string[];
  assignedRoles?: Record<string, string[]>;
};

const AVAILABLE_ROLES = ['judge', 'runner', 'scrambler'];

const Staffing = () => {
  const { id } = useParams<{ id: string }>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [editMode, setEditMode] = useState(false);

  // Estado para el modal de confirmación
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    competitorId: string;
    role: string;
    competitorName: string;
  } | null>(null);

  // Cargar datos
  useEffect(() => {
    if (!id) return;
    db.tournaments.get(id).then((t) => {
      if (!t) return;

      const formattedCategories: Category[] = (t.categories || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        format: c.format,
        rounds: (c.rounds ?? []).map((r: any) => ({
          roundNumber: r.num || r.roundNumber,
          format: r.format as 'ao3' | 'ao5',
          isFinal: r.isFinal ?? false,
        })),
      }));

      setCategories(formattedCategories);

      if (formattedCategories.length > 0) {
        setSelectedCategory(formattedCategories[0].id);
      }

      setCompetitors((t.competitors as Competitor[]) || []);
    });
  }, [id]);

  const handleToggleClick = (competitor: Competitor, role: string) => {
    if (!editMode) return;
    
    const isAssigned = (competitor.assignedRoles?.[selectedCategory] || []).includes(role);
    const hasGlobalRole = (competitor.roles || []).includes(role);

    // Si vamos a asignarlo localmente pero no tiene la habilidad global, mostramos modal
    if (!isAssigned && !hasGlobalRole) {
      setConfirmModal({
        isOpen: true,
        competitorId: competitor.id,
        role,
        competitorName: competitor.name
      });
      return;
    }

    // Si ya lo tiene o solo lo estamos quitando, lo ejecutamos directamente
    executeToggleRole(competitor.id, role);
  };

  const executeToggleRole = async (competitorId: string, role: string) => {
    if (!id || !selectedCategory) return;

    const currentTournament = await db.tournaments.get(id);
    if (!currentTournament) return;

    let updatedCompetitors = [...competitors];

    updatedCompetitors = updatedCompetitors.map(comp => {
      if (comp.id === competitorId) {
        const currentAssigned = comp.assignedRoles || {};
        const rolesForCategory = currentAssigned[selectedCategory] || [];

        let newRolesForCategory;
        let newGlobalRoles = comp.roles || [];

        if (rolesForCategory.includes(role)) {
          newRolesForCategory = rolesForCategory.filter(r => r !== role);
        } else {
          newRolesForCategory = [...rolesForCategory, role];
          // Si le activamos localmente un rol que no tiene a nivel global, se lo asignamos también a nivel global
          if (!newGlobalRoles.includes(role)) {
            newGlobalRoles = [...newGlobalRoles, role];
          }
        }

        return {
          ...comp,
          roles: newGlobalRoles,
          assignedRoles: {
            ...currentAssigned,
            [selectedCategory]: newRolesForCategory
          }
        };
      }
      return comp;
    });

    // Actualizar Base de Datos Local
    currentTournament.competitors = updatedCompetitors as any;
    await db.tournaments.put(currentTournament as any);

    // Actualizar Estado
    setCompetitors(updatedCompetitors);
  };



  // Ordenar competidores: los que tienen roles primero, los que no, al fondo.
  const sortedCompetitors = useMemo(() => {
    return [...competitors].sort((a, b) => {
      const aHasRoles = (a.roles && a.roles.length > 0) ? 1 : 0;
      const bHasRoles = (b.roles && b.roles.length > 0) ? 1 : 0;
      return bHasRoles - aHasRoles; // Descendente: 1 primero, 0 después
    });
  }, [competitors]);

  return (
    <div className="text-white p-4 md:p-6 lg:p-8">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <FaUserShield className="text-blue-400" /> Asignación de Roles / Staff
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
          {/* Botón de Edición */}
          <button
            onClick={() => setEditMode(!editMode)}
            className={`px-4 py-2 w-full sm:w-auto rounded-lg transition-colors flex items-center justify-center gap-2 ${
              editMode 
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {editMode ? <FaTimes /> : <FaEdit />}
            {editMode ? 'Desactivar Edición' : 'Activar Edición'}
          </button>

          {/* Selector de Categoría */}
          <div className="w-full sm:w-auto min-w-[200px]">
            <label className="block text-xs sm:text-sm text-gray-400 mb-1 flex items-center gap-1">
              <MdCategory size={14} /> Categoría
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-16 text-gray-400 flex flex-col items-center gap-3">
          <FaInfoCircle size={32} />
          <p>No hay categorías registradas en este torneo.</p>
        </div>
      ) : competitors.length === 0 ? (
        <div className="text-center py-16 text-gray-400 flex flex-col items-center gap-3">
          <FaInfoCircle size={32} />
          <p>Aún no hay competidores registrados.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 border border-gray-700 text-gray-300 text-xs sm:text-sm p-4 rounded-lg">

            {/* Bloque Rojo - Error Crítico */}
            <div className="flex items-start gap-3">
              <FaExclamationTriangle className="mt-0.5 flex-shrink-0 text-red-500" />
              <p className="font-semibold text-red-400">
                Los competidores marcados en rojo no
                tienen <strong>ningún</strong> rol global asignado.
              </p>
            </div>

            {/* Bloque Amarillo - Advertencia/Info */}
            <div className="flex items-start gap-3">
              <FaExclamationTriangle className="mt-0.5 flex-shrink-0 text-yellow-500" />
              <p className="font-semibold text-yellow-400">
                Si seleccionas algún rol, se añadirá automáticamente a sus capacidades globales.
              </p>
            </div>

          </div>

          {/* Leyenda de Roles */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 mb-2">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <FaInfoCircle /> Significado de los roles de Staff
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex bg-gray-750 p-3 rounded-lg border border-gray-600 items-start gap-3">
                <div className="bg-blue-900/50 text-blue-400 p-2 rounded-full flex-shrink-0">
                  <FaGavel size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-blue-300 capitalize">Judge (Juez)</h4>
                  <p className="text-xs text-gray-400 mt-1">Llama al competidor, supervisa que siga las normas de inspección/resolución y firma los tiempos oficiales.</p>
                </div>
              </div>
              <div className="flex bg-gray-750 p-3 rounded-lg border border-gray-600 items-start gap-3">
                <div className="bg-green-900/50 text-green-400 p-2 rounded-full flex-shrink-0">
                  <FaRunning size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-green-300 capitalize">Runner (Corredor)</h4>
                  <p className="text-xs text-gray-400 mt-1">Lleva los cubos revueltos desde la mesa de Scramblers a las estaciones de los Jueces.</p>
                </div>
              </div>
              <div className="flex bg-gray-750 p-3 rounded-lg border border-gray-600 items-start gap-3">
                <div className="bg-purple-900/50 text-purple-400 p-2 rounded-full flex-shrink-0">
                  <FaRandom size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-purple-300 capitalize">Scrambler (Mezclador)</h4>
                  <p className="text-xs text-gray-400 mt-1">Aplica las mezclas oficiales a cada cubo usando un cover, asegurando que no se filtre información.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="p-4 text-left font-semibold text-gray-300">Competidor</th>
                    <th className="p-4 text-center font-semibold text-gray-300">¿Compite en esta categoría?</th>
                    <th className="p-4 text-left font-semibold text-gray-300">Asignación de Roles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {sortedCompetitors.map((competitor) => {
                    const isCompetingHere = competitor.categories.includes(selectedCategory);
                    const globalRoles = competitor.roles || [];
                    const assignedHere = competitor.assignedRoles?.[selectedCategory] || [];
                    const hasNoGlobalRoles = globalRoles.length === 0;

                    return (
                      <tr key={competitor.id} className="hover:bg-gray-750/50 transition-colors">
                        <td className="p-4">
                          <span className={`font-medium block flex items-center gap-2 ${hasNoGlobalRoles ? 'text-red-400' : 'text-white'}`}>
                            {competitor.name}
                            {hasNoGlobalRoles && <FaExclamationTriangle size={12} title="Sin roles globales" className="text-red-500" />}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {isCompetingHere ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-200">
                              Sí
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                              No
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          {isCompetingHere ? (
                            <div className="flex flex-wrap gap-4">
                              {AVAILABLE_ROLES.map((role) => {
                                const isAssigned = assignedHere.includes(role);
                                const hasGlobalRole = globalRoles.includes(role);
                                const roleTextColor = isAssigned
                                  ? 'text-white font-medium'
                                  : (hasGlobalRole ? 'text-gray-400' : 'text-yellow-500');

                                return (
                                  <label
                                    key={role}
                                    className={`flex items-center gap-2 transition-opacity ${
                                      editMode ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                                    } ${isAssigned ? 'opacity-100' : (editMode ? 'opacity-60 hover:opacity-100' : '')}`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isAssigned}
                                      disabled={!editMode}
                                      onChange={() => handleToggleClick(competitor, role)}
                                      className={`w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 ${editMode ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                                    />
                                    <span className={`capitalize text-sm ${roleTextColor}`}>
                                      {role}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-gray-500 text-xs italic bg-gray-700/30 px-3 py-1 rounded-md">No participa en esta categoría</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Notificación del modo edición */}
      {editMode && (
        <div className="fixed bottom-4 right-4 z-[90] bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-bounce">
          <FaEdit /> Modo edición activado
        </div>
      )}

      {/* Footer / Info */}
      <div className="mt-12 pt-6 border-t border-gray-700 pb-8">
        <div className="bg-gray-800/50 rounded-lg p-5 mb-6 text-sm text-gray-400">
          <h4 className="font-semibold text-gray-300 mb-2 flex items-center gap-2">
            <FaInfoCircle className="text-blue-400" />
            ¿Cómo funciona esta sección?
          </h4>
          <p>
            Aquí puedes designar qué rol ocupará cada miembro del personal <strong>para una categoría en específico</strong>.
            Todos los competidores tienen las casillas disponibles para agilizar la asignación. Al activar un rol aquí,
            el competidor adquiere ese rol a nivel general permanentemente.
            Esta matriz servirá posteriormente para crear y administrar los grupos y horarios de la competencia.
          </p>
        </div>
      </div>

      {/* Modal de Confirmación para nuevos roles globales */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-800 rounded-xl max-w-sm w-full p-6 shadow-2xl border border-gray-700">
            <div className="flex items-center gap-3 text-yellow-500 mb-4">
              <FaExclamationTriangle size={24} />
              <h3 className="text-lg font-bold text-white">Confirmar Asignación</h3>
            </div>
            <p className="text-sm text-gray-300 mb-6 leading-relaxed">
              El competidor <span className="font-semibold text-white">{confirmModal.competitorName}</span> no tiene el rol de <span className="font-semibold text-yellow-400 capitalize">{confirmModal.role}</span> a nivel global.
              <br /><br />
              ¿Estás seguro de que quieres asignárselo? Esto añadirá permanentemente este rol a sus habilidades globales en todas las categorías.
            </p>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  executeToggleRole(confirmModal.competitorId, confirmModal.role);
                  setConfirmModal(null);
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Asignar Rol
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Staffing;
