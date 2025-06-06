import React, { useState } from "react";

const TableTournament = () => {
  const [tournamentData, setTournamentData] = useState([
    {
      category: "3x3",
      rounds: "Final directa",
      mode: "WCA",
      avg_mode: "ao5",
    },
  ]);

  const options = {
    category: ["3x3", "4x4", "3x3 OH", "2x2", "Pyraminx", "Megaminx"],
    rounds: ["Final directa", "Ronda única", "3 Rondas", "5 Rondas"],
    mode: ["WCA", "Red Bull", "Personalizado"],
    avg_modes: ["ao5", "mo3", "bo1", "bo3"],
  };

  const handleAddRow = () => {
    setTournamentData([
      ...tournamentData,
      {
        category: options.category[0],
        rounds: options.rounds[0],
        mode: options.mode[0],
        avg_mode: options.avg_modes[0],
      },
    ]);
  };

  const handleChange = (index, field, value) => {
    const updatedData = [...tournamentData];
    updatedData[index][field] = value;
    setTournamentData(updatedData);
  };

  const handleRemoveRow = (index) => {
    if (tournamentData.length > 1) {
      const updatedData = tournamentData.filter((_, i) => i !== index);
      setTournamentData(updatedData);
    }
  };

  return (
    <div className="w-full rounded-lg border border-gray-700 bg-gray-800 p-4 shadow sm:p-6">
      <div className="overflow-x-auto">
        {/* Encabezados de la tabla */}
        <div className="grid min-w-[600px] grid-cols-4 rounded-t-lg bg-gray-800">
          <div className="p-3 text-center">
            <h5 className="text-sm font-medium uppercase text-white sm:text-base">
              Categorías
            </h5>
          </div>
          <div className="p-3 text-center">
            <h5 className="text-sm font-medium uppercase text-white sm:text-base">
              Rondas
            </h5>
          </div>
          <div className="p-3 text-center">
            <h5 className="text-sm font-medium uppercase text-white sm:text-base">
              Formato
            </h5>
          </div>
          <div className="p-3 text-center">
            <h5 className="text-sm font-medium uppercase text-white sm:text-base">
              AVG
            </h5>
          </div>
        </div>

        {/* Filas de la tabla */}
        {tournamentData.map((tournament, index) => (
          <div
            key={index}
            className="grid min-w-[600px] grid-cols-4 border-b border-gray-700 last:rounded-b-lg"
          >
            {/* Categoría */}
            <div className="flex items-center justify-center p-3">
              <select
                value={tournament.category}
                onChange={(e) => handleChange(index, "category", e.target.value)}
                className="w-full rounded border border-gray-600 bg-gray-800 p-2 text-white focus:border-blue-500 focus:outline-none"
              >
                {options.category.map((option, i) => (
                  <option key={i} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* Rondas */}
            <div className="flex items-center justify-center p-3">
              <select
                value={tournament.rounds}
                onChange={(e) => handleChange(index, "rounds", e.target.value)}
                className="w-full rounded border border-gray-600 bg-gray-800 p-2 text-white focus:border-blue-500 focus:outline-none"
              >
                {options.rounds.map((option, i) => (
                  <option key={i} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* Formato */}
            <div className="flex items-center justify-center p-3">
              <select
                value={tournament.mode}
                onChange={(e) => handleChange(index, "mode", e.target.value)}
                className="w-full rounded border border-gray-600 bg-gray-800 p-2 text-white focus:border-blue-500 focus:outline-none"
              >
                {options.mode.map((option, i) => (
                  <option key={i} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* AVG */}
            <div className="flex items-center justify-center p-3">
              <select
                value={tournament.avg_mode}
                onChange={(e) => handleChange(index, "avg_mode", e.target.value)}
                className="w-full rounded border border-gray-600 bg-gray-800 p-2 text-white focus:border-blue-500 focus:outline-none"
              >
                {options.avg_modes.map((option, i) => (
                  <option key={i} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>

      {/* Botones de acción */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={handleAddRow}
          className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          <span className="ml-2">Añadir categoría</span>
        </button>

        {tournamentData.length > 1 && (
          <button
            onClick={() => handleRemoveRow(tournamentData.length - 1)}
            className="flex items-center rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="ml-2">Eliminar última</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default TableTournament;