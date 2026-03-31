import React from "react";
import { FaTrash, FaPlus, FaMinus } from "react-icons/fa";

interface CategoryData {
  category: string;
  rounds: string;
  mode: string;
  avg_mode: string;
}

interface TableTournamentProps {
  tournamentData: CategoryData[];
  onAddRow: () => void;
  onChange: (index: number, field: keyof CategoryData, value: string) => void;
  onRemove: (index: number) => void;
}

const TableTournament: React.FC<TableTournamentProps> = ({ 
  tournamentData, 
  onAddRow, 
  onChange, 
  onRemove 
}) => {
  const options = {
    category: ["3x3", "4x4", "3x3 OH", "2x2", "Pyraminx", "Megaminx", "Skewb", "Square-1"],
    rounds: ["Final directa", "2 rondas", "3 Rondas", "4 Rondas", "5 Rondas"],
    mode: ["WCA"],
    avg_modes: ["ao5", "mo3"],
  };

  return (
    <div className="w-full bg-gray-800">
      <div className="overflow-x-auto rounded-t-lg border border-gray-700">
        {/* Encabezados de la tabla */}
        <div className="grid min-w-[600px] grid-cols-5 bg-gray-900/50 border-b border-gray-700">
          <div className="p-4 text-center">
            <h5 className="text-xs font-bold tracking-wider text-gray-400 uppercase">
              Categorías
            </h5>
          </div>
          <div className="p-4 text-center">
            <h5 className="text-xs font-bold tracking-wider text-gray-400 uppercase">
              Rondas
            </h5>
          </div>
          <div className="p-4 text-center">
            <h5 className="text-xs font-bold tracking-wider text-gray-400 uppercase">
              Formato
            </h5>
          </div>
          <div className="p-4 text-center">
            <h5 className="text-xs font-bold tracking-wider text-gray-400 uppercase">
              AVG
            </h5>
          </div>
          <div className="p-4 text-center">
            <h5 className="text-xs font-bold tracking-wider text-gray-400 uppercase">
              Acciones
            </h5>
          </div>
        </div>

        {/* Filas de la tabla */}
        {tournamentData.map((tournament, index) => (
          <div
            key={index}
            className="grid min-w-[600px] grid-cols-5 border-b border-gray-750 hover:bg-gray-750/30 transition-colors last:border-0"
          >
            {/* Categoría */}
            <div className="flex items-center justify-center p-3">
              <select
                value={tournament.category}
                onChange={(e) => onChange(index, "category", e.target.value)}
                className="w-full rounded-md border border-gray-600 bg-gray-700 p-2.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all cursor-pointer"
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
                onChange={(e) => onChange(index, "rounds", e.target.value)}
                className="w-full rounded-md border border-gray-600 bg-gray-700 p-2.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all cursor-pointer"
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
                onChange={(e) => onChange(index, "mode", e.target.value)}
                className="w-full rounded-md border border-gray-600 bg-gray-700 p-2.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all cursor-pointer"
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
                onChange={(e) => onChange(index, "avg_mode", e.target.value)}
                className="w-full rounded-md border border-gray-600 bg-gray-700 p-2.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all cursor-pointer"
              >
                {options.avg_modes.map((option, i) => (
                  <option key={i} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* Acciones */}
            <div className="flex items-center justify-center p-3 space-x-2">
              {tournamentData.length > 1 ? (
                <button
                  onClick={() => onRemove(index)}
                  className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Eliminar categoría"
                >
                  <FaTrash />
                </button>
              ) : (
                <span className="w-8 h-8 flex items-center justify-center text-gray-600">
                  -
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Botones de acción */}
      <div className="mt-4 flex flex-wrap items-center justify-end gap-3 p-2">
        <button
          onClick={onAddRow}
          className="flex items-center gap-2 rounded-lg bg-blue-500/10 border border-blue-500/30 px-4 py-2 text-sm text-blue-400 font-medium hover:bg-blue-600 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <FaPlus />
          Añadir Categoría
        </button>

        {tournamentData.length > 1 && (
          <button
            onClick={() => onRemove(tournamentData.length - 1)}
            className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-2 text-sm text-red-400 font-medium hover:bg-red-600 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <FaMinus />
            Eliminar Última
          </button>
        )}
      </div>
    </div>
  );
};

export default TableTournament;