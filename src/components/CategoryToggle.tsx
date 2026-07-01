import React from 'react';
import { FaCheck } from 'react-icons/fa';
import { WCA_EVENT_CONFIG } from '../common/wcaEvents';

interface CategoryToggleProps {
  categories: string[];
  selected: string[];
  onToggle: (name: string) => void;
}

const CategoryToggle: React.FC<CategoryToggleProps> = ({ categories, selected, onToggle }) => {
  return (
    <div className="flex flex-wrap gap-1.5">
      {categories.map((cat) => {
        const config = WCA_EVENT_CONFIG[cat];
        const isSelected = selected.includes(cat);
        return (
          <button
            key={cat}
            onClick={() => onToggle(cat)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-all ${
              isSelected
                ? `${config?.bg || 'bg-blue-600'} text-white border-transparent`
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 border-gray-600 hover:border-gray-500 hover:text-gray-300'
            }`}
          >
            {isSelected && <FaCheck size={8} />}
            {config?.abbr || cat}
          </button>
        );
      })}
    </div>
  );
};

export default CategoryToggle;
