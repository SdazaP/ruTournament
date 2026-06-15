import React from 'react';
import { FaTrash, FaPlus, FaMinus } from 'react-icons/fa';
import CategoryToggle from '../CategoryToggle';

interface CompetitorData {
  name: string;
  categories: string[];
}

interface TableCompetitorsProps {
  competitors: CompetitorData[];
  categories: string[];
  onAddRow: () => void;
  onChange: (index: number, field: keyof CompetitorData, value: any) => void;
  onRemove: (index: number) => void;
  nameErrors?: Record<number, string>;
  onNameBlur?: (index: number) => void;
}

const TableCompetitors: React.FC<TableCompetitorsProps> = ({
  competitors,
  categories,
  onAddRow,
  onChange,
  onRemove,
  nameErrors = {},
  onNameBlur,
}) => {
  return (
    <div className="w-full rounded-xl bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">
      <div className="overflow-x-auto rounded-t-lg border border-gray-200 dark:border-gray-700">
        {/* Encabezados de la tabla */}
        <div className="grid min-w-[500px] grid-cols-3 border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50">
          <div className="p-4 text-center">
            <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Competidores
            </h5>
          </div>
          <div className="p-4 text-center">
            <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Categorías
            </h5>
          </div>
          <div className="p-4 text-center">
            <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Acciones
            </h5>
          </div>
        </div>

        {/* Filas de la tabla */}
        {competitors.map((competitor, index) => (
          <div
            key={index}
            className="grid min-w-[500px] grid-cols-3 border-b border-gray-200 transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/30"
          >
            {/* Input para el nombre del competidor */}
            <div className="flex flex-col justify-center p-3">
              <input
                type="text"
                placeholder="Nombre del competidor"
                value={competitor.name}
                onChange={(e) => onChange(index, 'name', e.target.value)}
                onBlur={() => onNameBlur?.(index)}
                className={`w-full rounded-md border p-2.5 text-sm transition-all placeholder-gray-400 focus:outline-none ${
                  nameErrors[index]
                    ? 'border-red-500 bg-red-50 text-gray-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:bg-red-500/10 dark:text-white dark:placeholder-gray-500'
                    : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500'
                }`}
              />
              {nameErrors[index] && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {nameErrors[index]}
                </p>
              )}
            </div>

            {/* Categorías (Multiple) */}
            <div className="flex items-center p-3">
              <CategoryToggle
                categories={categories}
                selected={competitor.categories}
                onToggle={(cat) => {
                  if (competitor.categories.includes(cat)) {
                    onChange(
                      index,
                      'categories',
                      competitor.categories.filter((c: string) => c !== cat)
                    );
                  } else {
                    onChange(index, 'categories', [
                      ...competitor.categories,
                      cat,
                    ]);
                  }
                }}
              />
            </div>

            {/* Acciones */}
            <div className="flex items-center justify-center space-x-2 p-3">
              {competitors.length > 1 ? (
                <button
                  onClick={() => onRemove(index)}
                  className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-gray-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                  title="Eliminar competidor"
                >
                  <FaTrash />
                </button>
              ) : (
                <span className="flex h-8 w-8 items-center justify-center text-gray-400 dark:text-gray-600">
                  -
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Botones de acción */}
      <div className="mt-4 flex flex-col items-stretch justify-end gap-3 p-2 sm:flex-row sm:items-center">
        <button
          onClick={onAddRow}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition-all hover:bg-blue-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400"
        >
          <FaPlus />
          Añadir Competidor
        </button>

        {competitors.length > 1 && (
          <button
            onClick={() => onRemove(competitors.length - 1)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-all hover:bg-red-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
          >
            <FaMinus />
            Eliminar Último
          </button>
        )}
      </div>
    </div>
  );
};

export default TableCompetitors;