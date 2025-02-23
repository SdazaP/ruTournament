import { Link } from 'react-router-dom';
const Tournaments = () => {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
        <div className="dark:bg-gray-800 bg-white rounded-lg shadow-lg p-6 m-4 max-w-sm">
          <div className="flex items-center space-x-4">
            <img src="" alt="Logo" className="w-12 h-12" />
            <h2 className="dark:text-white text-xl font-semibold">
              Nombre del torneo
            </h2>
          </div>
          <p className="dark:text-gray-300 mt-4">
            Contenido de la tarjeta. Puedes agregar más detalles aquí.
          </p>
        </div>
        <div className="dark:bg-gray-800 bg-white rounded-lg shadow-lg p-6 m-4 max-w-sm">
          <div className="flex items-center space-x-4">
            <img src="" alt="Logo" className="w-12 h-12" />
            <h2 className="dark:text-white text-xl font-semibold">
              Nombre del torneo
            </h2>
          </div>
          <p className="dark:text-gray-300 mt-4">
            Contenido de la tarjeta. Puedes agregar más detalles aquí.
          </p>
        </div>
        <div className="dark:bg-gray-800 bg-white rounded-lg shadow-lg p-6 m-4 max-w-sm">
          <div className="flex items-center space-x-4">
            <img src="" alt="Logo" className="w-12 h-12" />
            <h2 className="dark:text-white text-xl font-semibold">
              Nombre del torneo
            </h2>
          </div>
          <p className="dark:text-gray-300 mt-4">
            Contenido de la tarjeta. Puedes agregar más detalles aquí.
          </p>
        </div>
      </div>
      {/* boton de nuevo torneo */}
      <div className="flex items-center justify-center mt-8">
      <Link to="/creation">
        <button className="px-8 py-3 bg-blue-500 text-white text-lg rounded shadow-md hover:bg-blue-600">
          Nuevo torneo +
        </button>
      </Link>
      </div>
    </>
  );
};

export default Tournaments;
