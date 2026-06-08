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
    <div className="w-full bg-gray-800">
      <div className="overflow-x-auto rounded-t-lg border border-gray-700">
        {/* Encabezados de la tabla */}
        <div className="grid min-w-[500px] grid-cols-3 bg-gray-900/50 border-b border-gray-700">
          <div className="p-4 text-center">
            <h5 className="text-xs font-bold tracking-wider text-gray-400 uppercase">
              Competidores
            </h5>
          </div>
          <div className="p-4 text-center">
            <h5 className="text-xs font-bold tracking-wider text-gray-400 uppercase">
              Categorías
            </h5>
          </div>
          <div className="p-4 text-center">
            <h5 className="text-xs font-bold tracking-wider text-gray-400 uppercase">
              Acciones
            </h5>
          </div>
        </div>

        {/* Filas de la tabla */}
        {competitors.map((competitor, index) => (
          <div 
            key={index} 
            className="grid min-w-[500px] grid-cols-3 border-b border-gray-750 hover:bg-gray-750/30 transition-colors last:border-0"
          >
            {/* Input para el nombre del competidor */}
            <div className="flex flex-col justify-center p-3">
              <input
                type="text"
                placeholder="Nombre del competidor"
                value={competitor.name}
                onChange={(e) => onChange(index, 'name', e.target.value)}
                onBlur={() => onNameBlur?.(index)}
                className={`w-full rounded-md border bg-gray-900 p-2.5 text-sm text-white focus:outline-none transition-all placeholder-gray-500 ${nameErrors[index] ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}`}
              />
              {nameErrors[index] && (
                <p className="text-red-400 text-xs mt-1">{nameErrors[index]}</p>
              )}
            </div>

            {/* Categorías (Multiple) */}
            <div className="flex items-center p-3">
              <CategoryToggle
                categories={categories}
                selected={competitor.categories}
                onToggle={(cat) => {
                  if (competitor.categories.includes(cat)) {
                    onChange(index, 'categories', competitor.categories.filter((c: string) => c !== cat));
                  } else {
                    onChange(index, 'categories', [...competitor.categories, cat]);
                  }
                }}
              />
            </div>

            {/* Acciones */}
            <div className="flex items-center justify-center p-3 space-x-2">
              {competitors.length > 1 ? (
                <button
                  onClick={() => onRemove(index)}
                  className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Eliminar competidor"
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
          Añadir Competidor
        </button>

        {competitors.length > 1 && (
          <button
            onClick={() => onRemove(competitors.length - 1)}
            className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-2 text-sm text-red-400 font-medium hover:bg-red-600 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-red-500"
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