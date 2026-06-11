import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaCube, FaTrophy } from 'react-icons/fa';
import ResultsViewWCA from './Results/ResultsViewWCA';
import ResultsViewRB from './Results/ResultsViewRB';

const ResultsView = () => {
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'WCA' | 'RedBull') || 'WCA';
  const initialCategory = searchParams.get('category') || undefined;
  const [tab, setTab] = useState<'WCA' | 'RedBull'>(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get('tab') as 'WCA' | 'RedBull';
    if (tabParam && tabParam !== tab) {
      setTab(tabParam);
    }
  }, [searchParams, tab]);

  return (
    <div className="min-h-screen p-4 text-gray-900 dark:text-gray-100 sm:p-6">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row">
        <button
          onClick={() => setTab('WCA')}
          className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors sm:w-auto ${
            tab === 'WCA'
              ? 'bg-blue-600 text-white dark:bg-blue-500'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          <FaCube size={14} /> WCA
        </button>

        <button
          onClick={() => setTab('RedBull')}
          className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors sm:w-auto ${
            tab === 'RedBull'
              ? 'bg-red-600 text-white dark:bg-red-500'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          <FaTrophy size={14} /> Red Bull
        </button>
      </div>

      {tab === 'WCA' ? (
        <ResultsViewWCA initialCategoryId={initialCategory} />
      ) : (
        <ResultsViewRB />
      )}
    </div>
  );
};

export default ResultsView;