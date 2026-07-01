import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBook } from 'react-icons/fa';
import { db } from '../../common/db';

const WelcomePage = () => {
  const [tournaments, setTournaments] = useState<any[]>([]);

  useEffect(() => {
    db.tournaments.toArray().then((all) => {
      setTournaments(all.sort((a, b) => Number(b.id) - Number(a.id)).slice(0, 3));
    });
  }, []);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold dark:text-white text-gray-900 mb-4">
          Bienvenido a Rubiks Tournaments
        </h1>
        <p className="text-xl dark:text-gray-300 text-gray-600 max-w-2xl mx-auto">
          La plataforma definitiva para organizar y gestionar tus torneos de Speedcubing
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 max-w-6xl mx-auto">
        {/* Feature 1 */}
        <div className="dark:bg-gray-800 bg-white rounded-xl shadow-lg p-6 transition-transform hover:scale-105">
          <div className="flex flex-col items-center text-center">
            <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold dark:text-white mb-2">Organiza Torneos</h3>
            <p className="dark:text-gray-300 text-gray-600">
              Crea y gestiona torneos de manera sencilla con nuestra interfaz intuitiva.
            </p>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="dark:bg-gray-800 bg-white rounded-xl shadow-lg p-6 transition-transform hover:scale-105">
          <div className="flex flex-col items-center text-center">
            <div className="p-4 bg-green-100 dark:bg-green-900 rounded-full mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold dark:text-white mb-2">Gestiona Competidores</h3>
            <p className="dark:text-gray-300 text-gray-600">
              Administra fácilmente a todos los competidores de tus torneos de rubik.
            </p>
          </div>
        </div>

        {/* Feature 3 */}
        <div className="dark:bg-gray-800 bg-white rounded-xl shadow-lg p-6 transition-transform hover:scale-105">
          <div className="flex flex-col items-center text-center">
            <div className="p-4 bg-purple-100 dark:bg-purple-900 rounded-full mb-4">
              <svg className="w-8 h-8 text-purple-600 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold dark:text-white mb-2">Sigue Resultados</h3>
            <p className="dark:text-gray-300 text-gray-600">
              Mantén un registro actualizado de todos los resultados y estadísticas.
            </p>
          </div>
        </div>
      </div>

      {/* Torneos Recientes */}
      <div className="max-w-6xl mx-auto mb-16">
        <h2 className="text-2xl font-bold dark:text-white mb-6">Torneos Recientes</h2>
        {tournaments.length === 0 ? (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500 bg-gray-800/30 dark:bg-white/5 rounded-xl border border-dashed border-gray-700 dark:border-gray-300 p-8">
            <p className="mb-4">No hay torneos aún</p>
            <Link to="new-tournament" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">Crear primer torneo →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((t) => {
              const initials = t.name.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase();
              const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-amber-500', 'bg-red-500', 'bg-cyan-500'];
              const colorIdx = tournaments.indexOf(t) % colors.length;
              return (
                <Link to={`/dashboard/tournament/${t.id}`} key={t.id}
                  className="dark:bg-gray-800 bg-white rounded-lg shadow-lg p-6 hover:shadow-xl block transition-transform hover:scale-105 ">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className={`w-12 h-12 ${colors[colorIdx]} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="dark:text-white text-lg font-semibold truncate">{t.name}</h2>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        t.status === 'activo' ? 'bg-green-600/20 text-green-400' :
                        t.status === 'proximamente' ? 'bg-blue-600/20 text-blue-400' :
                        'bg-gray-600/20 text-gray-400'
                      }`}>{t.status === 'proximamente' ? 'próximamente' : t.status}</span>
                    </div>
                  </div>
                  <p className="dark:text-gray-300 text-sm mb-1">{t.date || 'Sin fecha'} · {t.location || 'Sin ubicación'}</p>
                  <p className="dark:text-gray-400 text-sm mb-4">
                    {(t.categories?.length || 0)} categorías · {(t.competitors?.length || 0)} competidores
                  </p>
                  <span className="text-blue-600 dark:text-blue-400 hover:underline text-sm">Entrar al panel →</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Call to Action */}
      <div className="text-center">
        <h2 className="text-2xl font-bold dark:text-white mb-6">¿Listo para comenzar?</h2>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link to="new-tournament">
            <button className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto transition-transform hover:scale-105">

              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="currentColor" stroke="currentColor" strokeWidth="0.7" strokeLinejoin="round">
                    <rect x="1" y="1" width="4.4" height="4.4" rx="0.5"/>
                    <rect x="6.8" y="1" width="4.4" height="4.4" rx="0.5"/>
                    <rect x="12.6" y="1" width="4.4" height="4.4" rx="0.5"/>
                    <rect x="1" y="6.8" width="4.4" height="4.4" rx="0.5"/>
                    <rect x="6.8" y="6.8" width="4.4" height="4.4" rx="0.5"/>
                    <rect x="12.6" y="6.8" width="4.4" height="4.4" rx="0.5"/>
                    <rect x="1" y="12.6" width="4.4" height="4.4" rx="0.5"/>
                    <rect x="6.8" y="12.6" width="4.4" height="4.4" rx="0.5"/>
                    <rect x="12.6" y="12.6" width="4.4" height="4.4" rx="0.5"/>
              </svg>

              Crear nuevo torneo 
            </button>
          </Link>
          <Link to="guide">
            <button className="px-8 py-4 bg-gray-500 dark:bg-gray-700 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto transition-transform hover:scale-105">
              <FaBook /> Guía de Uso del Sistema
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;