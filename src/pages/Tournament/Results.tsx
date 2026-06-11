import React, { useState } from 'react';
import { FaCube, FaTrophy } from 'react-icons/fa';
import ResultsWCA from './ResultsWCA';
import ResultsRB from './ResultsRB';

const Results = () => {
  const [tab, setTab] = useState<'WCA' | 'RedBull'>('WCA');

  return (
    <div className="min-h-screen text-gray-900 dark:text-white p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <button
          onClick={() => setTab('WCA')}
          className={`px-4 py-2 w-full sm:w-auto rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            tab === 'WCA'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <FaCube size={14} /> Formato WCA
        </button>

        <button
          onClick={() => setTab('RedBull')}
          className={`px-4 py-2 w-full sm:w-auto rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            tab === 'RedBull'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <FaTrophy size={14} /> Red Bull
        </button>
      </div>

      {tab === 'WCA' ? <ResultsWCA /> : <ResultsRB />}
    </div>
  );
};

export default Results;