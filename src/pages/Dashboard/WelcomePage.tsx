import { Link } from 'react-router-dom';

const WelcomePage = () => {
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
            <h3 className="text-xl font-semibold dark:text-white mb-2">Gestiona Participantes</h3>
            <p className="dark:text-gray-300 text-gray-600">
              Administra fácilmente a todos los participantes de tus torneos de rubik.
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

      {/* Latest Tournaments */}
      <div className="max-w-6xl mx-auto mb-16">
        <h2 className="text-2xl font-bold dark:text-white mb-6">Torneos Recientes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Tournament Card 1 */}
          <div className="dark:bg-gray-800 bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                T1
              </div>
              <h2 className="dark:text-white text-xl font-semibold">
                Torneo de Verano
              </h2>
            </div>
            <p className="dark:text-gray-300 mb-4">
              Competencia anual de verano con los mejores equipos de la región.
            </p>
            <Link 
              to="/tournaments/1" 
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Ver detalles →
            </Link>
          </div>

          {/* Tournament Card 2 */}
          <div className="dark:bg-gray-800 bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                T2
              </div>
              <h2 className="dark:text-white text-xl font-semibold">
                Campeonato Local
              </h2>
            </div>
            <p className="dark:text-gray-300 mb-4">
              Torneo clasificatorio para el campeonato nacional de este año.
            </p>
            <Link 
              to="/tournaments/2" 
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Ver detalles →
            </Link>
          </div>

          {/* Tournament Card 3 */}
          <div className="dark:bg-gray-800 bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                T3
              </div>
              <h2 className="dark:text-white text-xl font-semibold">
                Copa Amistad
              </h2>
            </div>
            <p className="dark:text-gray-300 mb-4">
              Evento amistoso para promover el deporte y la camaradería.
            </p>
            <Link 
              to="/tournaments/3" 
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Ver detalles →
            </Link>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center">
        <h2 className="text-2xl font-bold dark:text-white mb-6">¿Listo para comenzar?</h2>
        <Link to="new-tournament">
          <button className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors">
            Crear nuevo torneo +
          </button>
        </Link>
      </div>
    </div>
  );
};

export default WelcomePage;