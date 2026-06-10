import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../common/db';
import { FaSearch } from 'react-icons/fa';

const Tournaments = () => {
  const tournaments = useLiveQuery(() => db.tournaments.toArray());
  const loading = tournaments === undefined;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const allCategories = useMemo(() => {
    if (!tournaments) return [];
    const cats = new Set<string>();
    tournaments.forEach((t) => t.categories?.forEach((c: any) => cats.add(c.name)));
    return [...cats].sort();
  }, [tournaments]);

  const filteredTournaments = useMemo(() => {
    if (!tournaments) return [];
    return tournaments.filter((t) => {
      const matchName = !searchTerm || t.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchCategory = categoryFilter === 'all' || t.categories?.some((c: any) => c.name === categoryFilter);
      return matchName && matchStatus && matchCategory;
    });
  }, [tournaments, searchTerm, statusFilter, categoryFilter]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'activo':
        return 'bg-green-500';
      case 'finalizado':
        return 'bg-gray-500';
      case 'proximamente':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold dark:text-white mb-6">
          Torneos
        </h1>
        <p>Cargando torneos...</p>
      </div>
    );
  }

  if (tournaments.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold dark:text-white mb-6">
          Torneos
        </h1>
        <p>No hay torneos disponibles.</p>

        <div className="flex justify-center mt-8">
          <Link to="/dashboard/new-tournament">
            <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-lg rounded-lg shadow-md transition-colors flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Crear primer torneo
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold dark:text-white mb-6">
        Torneos
      </h1>

      {tournaments.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar torneo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 dark:bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="dark:bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
            >
              <option value="all">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="proximamente">Próximamente</option>
              <option value="finalizado">Finalizado</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="dark:bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
            >
              <option value="all">Todas las categorías</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            {filteredTournaments.length} de {tournaments.length} {tournaments.length === 1 ? 'torneo encontrado' : 'torneos encontrados'}
          </p>
        </>
      )}

      {filteredTournaments.length === 0 && tournaments.length > 0 && (
        <div className="text-center py-8 text-gray-400">
          <p>No se encontraron torneos con esos filtros.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTournaments.map((tournament) => (
          <Link
            to={`/dashboard/tournament/${tournament.id}`}
            key={tournament.id}
            className="block"
          >
            <div className="dark:bg-gray-800 bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-gray-500 dark:text-gray-400 text-lg font-bold">
                      {tournament.name.charAt(0)}
                    </span>
                  </div>
                  <h2 className="dark:text-white text-xl font-semibold">
                    {tournament.name}
                  </h2>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <span
                  className={`${getStatusColor(
                    tournament.status,
                  )} text-white text-xs px-2 py-1 rounded-full`}
                >
                  {tournament.status.toUpperCase()}
                </span>
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>
                    {new Date(tournament.date).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span>{tournament.location}</span>
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <span>
                    {tournament.competitors?.length || 0} competidores
                  </span>
                </div>
                <div className="mt-3">
                  <h3 className="text-sm font-medium dark:text-gray-300 mb-1">
                    Categorías:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {tournament.categories?.map((category, index) => (
                      <span
                        key={category.id || index}
                        className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded"
                      >
                        {category.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="flex justify-center mt-8">
        <Link to="/dashboard/new-tournament">
          <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-lg rounded-lg shadow-md transition-colors flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Nuevo torneo
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Tournaments;
