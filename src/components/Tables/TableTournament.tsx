import React, { useState } from "react";

const TableTournament = () => {
  // Estado inicial de tournamentData
  const [tournamentData, setTournamentData] = useState([
    {
      category: "3x3", // Valor inicial seleccionado
      rounds: "Final directa", // Valor inicial seleccionado
      mode: "WCA", // Valor inicial seleccionado
      avg_mode: "ao5",
    },
  ]);

  // Opciones disponibles para cada campo
  const options = {
    category: ["3x3", "4x4", "3x3 OH"],
    rounds: ["Final directa", "Ronda única", "3 Rondas"],
    mode: ["WCA", "Red Bull"],
  };

  // Función para agregar una nueva fila
  const handleAddRow = () => {
    const newRow = {
      category: options.category[0], // Valor predeterminado
      rounds: options.rounds[0], // Valor predeterminado
      mode: options.mode[0], // Valor predeterminado
      avg_mode: "Nuevo AVG", // Puedes cambiar esto por un valor dinámico
    };

    // Actualiza el estado agregando la nueva fila
    setTournamentData([...tournamentData, newRow]);
  };

  // Función para manejar cambios en los dropdowns
  const handleChange = (index, field, value) => {
    const updatedData = [...tournamentData];
    updatedData[index][field] = value;
    setTournamentData(updatedData);
  };

  return (
    <div className="rounded-sm border border-stroke bg-gray-900 px-5 pt-6 pb-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-6">
      <div className="flex flex-col">
        {/* Encabezados de la tabla */}
        <div className="grid grid-cols-3 rounded-sm bg-gray-800 dark:bg-meta-4 sm:grid-cols-4">
          <div className="p-2.5 text-center xl:px-20">
            <h5 className="text-sm font-medium uppercase xsm:text-base text-white">
              Categorías
            </h5>
          </div>
          <div className="p-2.5 text-center xl:px-20">
            <h5 className="text-sm font-medium uppercase xsm:text-base text-white">
              Rondas
            </h5>
          </div>
          <div className="p-2.5 text-center xl:px-20">
            <h5 className="text-sm font-medium uppercase xsm:text-base text-white">
              Formato
            </h5>
          </div>
          <div className="p-2.5 text-center xl:px-20">
            <h5 className="text-sm font-medium uppercase xsm:text-base text-white">
              AVG
            </h5>
          </div>
        </div>

        {/* Filas de la tabla */}
        {tournamentData.map((tournament, index) => (
          <div
            key={index}
            className="grid grid-cols-3 sm:grid-cols-4 border-b border-gray-700 dark:border-strokedark"
          >
            {/* Dropdown para Categorías */}
            <div className="flex items-center gap-3 p-2.5 xl:p-5">
              <select
                value={tournament.category}
                onChange={(e) =>
                  handleChange(index, "category", e.target.value)
                }
                className="bg-gray-800 dark:bg-boxdark border border-gray-700 dark:border-strokedark rounded p-1 text-white"
              >
                {options.category.map((option, i) => (
                  <option key={i} value={option} className="text-white">
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* Dropdown para Rondas */}
            <div className="flex items-center justify-center p-2.5 xl:p-5">
              <select
                value={tournament.rounds}
                onChange={(e) =>
                  handleChange(index, "rounds", e.target.value)
                }
                className="bg-gray-800 dark:bg-boxdark border border-gray-700 dark:border-strokedark rounded p-1 text-white"
              >
                {options.rounds.map((option, i) => (
                  <option key={i} value={option} className="text-white">
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* Dropdown para Formato */}
            <div className="flex items-center justify-center p-2.5 xl:p-5">
              <select
                value={tournament.mode}
                onChange={(e) =>
                  handleChange(index, "mode", e.target.value)
                }
                className="bg-gray-800 dark:bg-boxdark border border-gray-700 dark:border-strokedark rounded p-1 text-white"
              >
                {options.mode.map((option, i) => (
                  <option key={i} value={option} className="text-white">
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* Campo AVG (puedes cambiarlo a un dropdown si es necesario) */}
            <div className="flex items-center justify-center p-2.5 xl:p-5">
              <p className="text-white">{tournament.avg_mode}</p>
            </div>
          </div>
        ))}

        {/* Botón agregar */}
        <div className="flex flex-col items-center justify-center">
          <button
            className="mt-10 px-8 py-3 bg-blue-500 text-white text-lg rounded shadow-md hover:bg-blue-600"
            onClick={handleAddRow}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableTournament;