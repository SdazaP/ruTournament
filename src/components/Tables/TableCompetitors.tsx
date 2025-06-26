import React from 'react';

interface CompetitorData {
  name: string;
  category: string;
}

interface TableCompetitorsProps {
  competitors: CompetitorData[];
  categories: string[];
  onAddRow: () => void;
  onChange: (index: number, field: keyof CompetitorData, value: string) => void;
  onRemove: (index: number) => void;
}

const TableCompetitors: React.FC<TableCompetitorsProps> = ({ 
  competitors, 
  categories, 
  onAddRow, 
  onChange, 
  onRemove 
}) => {
  return (
    <div className="w-full rounded-lg border border-gray-700 bg-gray-800 p-4 shadow sm:p-6">
      <div className="overflow-x-auto">
        {/* Encabezados de la tabla */}
        <div className="grid min-w-[500px] grid-cols-3 rounded-t-lg bg-gray-800">
          <div className="p-3 text-center">
            <h5 className="text-sm font-medium uppercase text-white sm:text-base">
              Competidores
            </h5>
          </div>
          <div className="p-3 text-center">
            <h5 className="text-sm font-medium uppercase text-white sm:text-base">
              Categorías
            </h5>
          </div>
          <div className="p-3 text-center">
            <h5 className="text-sm font-medium uppercase text-white sm:text-base">
              Acciones
            </h5>
          </div>
        </div>

        {/* Filas de la tabla */}
        {competitors.map((competitor, index) => (
          <div 
            key={index} 
            className="grid min-w-[500px] grid-cols-3 border-b border-gray-700 last:rounded-b-lg"
          >
            {/* Input para el nombre del competidor */}
            <div className="flex items-center justify-center p-3">
              <input
                type="text"
                placeholder="Nombre del competidor"
                value={competitor.name}
                onChange={(e) => onChange(index, 'name', e.target.value)}
                className="w-full rounded border border-gray-600 bg-gray-800 p-2 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Select para la categoría */}
            <div className="flex items-center justify-center p-3">
              <select
                value={competitor.category}
                onChange={(e) => onChange(index, 'category', e.target.value)}
                className="w-full rounded border border-gray-600 bg-gray-800 p-2 text-white focus:border-blue-500 focus:outline-none"
              >
                {categories.map((category, i) => (
                  <option key={i} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Acciones */}
            <div className="flex items-center justify-center p-3 space-x-2">
              {competitors.length > 1 && (
                <button
                  onClick={() => onRemove(index)}
                  className="p-1 text-red-500 hover:text-red-700"
                  title="Eliminar competidor"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Botones de acción */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={onAddRow}
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
          <span className="ml-2">Añadir competidor</span>
        </button>

        {competitors.length > 1 && (
          <button
            onClick={() => onRemove(competitors.length - 1)}
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
            <span className="ml-2">Eliminar último</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default TableCompetitors;