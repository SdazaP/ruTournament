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
          <div className="flex items-center justify-center h-screen w-screen bg-gray-900">
            <div className="p-10 w-full h-full flex flex-col items-center justify-center">
              <h1 className="text-6xl font-bold mb-10 text-white">
                Bienvenido
              </h1>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 w-3/4 max-w-4xl">
                <div className="flex flex-col items-center gap-6">
                  <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center text-lg text-white">
                    Logo
                  </div>
                  <label className="text-lg font-medium text-white">
                    Ingresa el nombre del torneo
                  </label>
                  <input
                    type="text"
                    placeholder="Ingrese el nombre"
                    className="w-full rounded-lg border border-gray-600 py-3 px-5 text-white bg-gray-800 outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-4">
                  <label className="text-lg font-medium text-white">
                    Descripción del Torneo
                  </label>
                  <textarea
                    rows={6}
                    placeholder="Ingrese la descripción"
                    className="w-full rounded-lg border border-gray-600 py-3 px-5 text-white bg-gray-800 outline-none focus:border-blue-500"
                  ></textarea>
                </div>
              </div>
              <div className="flex space-x-4 mt-10">
                <button
                  className="px-8 py-3 bg-blue-500 text-white text-lg rounded shadow-md hover:bg-blue-600"
                  onClick={() => setCurrentStep(2)}
                >
                  Siguiente
                </button>
                <Link to="/">
                  <button className="px-8 py-3 bg-red-500 text-white text-lg rounded shadow-md hover:bg-red-700">
                    Cancelar
                  </button>
                </Link>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="flex items-center justify-center h-screen w-screen bg-gray-900">
            <div className="p-10 w-full h-full flex flex-col items-center justify-center">
              <div className="flex items-center justify-center space-x-4 m-4">
                <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center text-lg text-white">
                  Logo
                </div>
                <h1 className="text-6xl font-bold text-white">
                  Nombre del Torneo
                </h1>
              </div>
              <h2 className="text-4xl font-bold text-gray-400 m-4">
                Categorías
              </h2>
              <TableTournament />
              <div className="flex space-x-4 mt-10">
                <button
                  className="px-8 py-3 bg-gray-500 text-white text-lg rounded shadow-md hover:bg-gray-600"
                  onClick={() => setCurrentStep(1)}
                >
                  Anterior
                </button>
                <button
                  className="px-8 py-3 bg-blue-500 text-white text-lg rounded shadow-md hover:bg-blue-600"
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
          <div className="flex items-center justify-center h-screen w-screen bg-gray-900">
            <div className="p-10 w-full h-full flex flex-col items-center justify-center">
              <div className="flex items-center justify-center space-x-4 m-4">
                <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center text-lg text-white">
                  Logo
                </div>
                <h1 className="text-6xl font-bold text-white">
                  Nombre del Torneo
                </h1>
              </div>
              <h2 className="text-4xl font-bold text-gray-400 m-4">
                Lista de competidores
              </h2>
              <TableCompetitors></TableCompetitors>
              <div className="flex space-x-4 mt-10">
                <button
                  className="px-8 py-3 bg-gray-500 text-white text-lg rounded shadow-md hover:bg-gray-600"
                  onClick={() => setCurrentStep(2)}
                >
                  Anterior
                </button>
                <button
                  className="px-8 py-3 bg-blue-500 text-white text-lg rounded shadow-md hover:bg-blue-600"
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
