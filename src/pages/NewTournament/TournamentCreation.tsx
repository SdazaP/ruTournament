import { useState } from 'react';
import { Link } from 'react-router-dom';
import TableTournament from '../../components/Tables/TableTournament';
import TableCompetitors from '../../components/Tables/TableCompetitors';

export default function TournamentWelcome() {
  const [currentStep, setCurrentStep] = useState(1); // 1: Primera ventana, 2: Segunda ventana, 3: Tercera ventana

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="flex items-center justify-center w-full p-4 md:p-10">
            <div className="w-full max-w-6xl h-full flex flex-col items-center justify-center">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 md:mb-10 text-white text-center">
                Bienvenido
              </h1>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 w-full">
                <div className="flex flex-col items-center gap-4 md:gap-6">
                  <div className="w-20 h-20 md:w-32 md:h-32 bg-gray-700 rounded-full flex items-center justify-center text-lg text-white">
                    Logo
                  </div>
                  <label className="text-base md:text-lg font-medium text-white text-center">
                    Ingresa el nombre del torneo
                  </label>
                  <input
                    type="text"
                    placeholder="Ingrese el nombre"
                    className="w-full rounded-lg border border-gray-600 py-2 md:py-3 px-4 text-white bg-gray-800 outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-3 md:gap-4">
                  <label className="text-base md:text-lg font-medium text-white text-center lg:text-left">
                    Descripción del Torneo
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Ingrese la descripción"
                    className="w-full rounded-lg border border-gray-600 py-2 md:py-3 px-4 text-white bg-gray-800 outline-none focus:border-blue-500"
                  ></textarea>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mt-6 md:mt-10 w-full sm:w-auto">
                <button
                  className="px-6 py-2 md:px-8 md:py-3 bg-blue-500 text-white text-base md:text-lg rounded shadow-md hover:bg-blue-600"
                  onClick={() => setCurrentStep(2)}
                >
                  Siguiente
                </button>
                <Link to="/" className="w-full sm:w-auto">
                  <button className="w-full px-6 py-2 md:px-8 md:py-3 bg-red-500 text-white text-base md:text-lg rounded shadow-md hover:bg-red-700">
                    Cancelar
                  </button>
                </Link>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="flex items-center justify-center w-full  p-4 md:p-10">
            <div className="w-full max-w-6xl h-full flex flex-col items-center justify-center">
              <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-4 my-4">
                <div className="w-20 h-20 md:w-32 md:h-32 bg-gray-700 rounded-full flex items-center justify-center text-lg text-white">
                  Logo
                </div>
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white text-center">
                  Nombre del Torneo
                </h1>
              </div>
              <h2 className="text-2xl md:text-4xl font-bold text-gray-400 my-4 text-center">
                Categorías
              </h2>
              <div className="w-full overflow-x-auto">
                <TableTournament />
              </div>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mt-6 md:mt-10">
                <button
                  className="px-6 py-2 md:px-8 md:py-3 bg-gray-500 text-white text-base md:text-lg rounded shadow-md hover:bg-gray-600"
                  onClick={() => setCurrentStep(1)}
                >
                  Anterior
                </button>
                <button
                  className="px-6 py-2 md:px-8 md:py-3 bg-blue-500 text-white text-base md:text-lg rounded shadow-md hover:bg-blue-600"
                  onClick={() => setCurrentStep(3)}
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="flex items-center justify-center w-full p-4 md:p-10">
            <div className="w-full max-w-6xl h-full flex flex-col items-center justify-center">
              <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-4 my-4">
                <div className="w-20 h-20 md:w-32 md:h-32 bg-gray-700 rounded-full flex items-center justify-center text-lg text-white">
                  Logo
                </div>
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white text-center">
                  Nombre del Torneo
                </h1>
              </div>
              <h2 className="text-2xl md:text-4xl font-bold text-gray-400 my-4 text-center">
                Lista de competidores
              </h2>
              <div className="w-full overflow-x-auto">
                <TableCompetitors />
              </div>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mt-6 md:mt-10">
                <button
                  className="px-6 py-2 md:px-8 md:py-3 bg-gray-500 text-white text-base md:text-lg rounded shadow-md hover:bg-gray-600"
                  onClick={() => setCurrentStep(2)}
                >
                  Anterior
                </button>
                <button
                  className="px-6 py-2 md:px-8 md:py-3 bg-blue-500 text-white text-base md:text-lg rounded shadow-md hover:bg-blue-600"
                  onClick={() => alert('Proceso completado')}
                >
                  Finalizar
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return renderStep();
}