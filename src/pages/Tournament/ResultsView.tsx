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
    <div className="min-h-screen text-white p-4 sm:p-6">
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('WCA')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            tab === 'WCA'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          }`}
        >
          <FaCube size={14} /> WCA
        </button>
        <button
          onClick={() => setTab('RedBull')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            tab === 'RedBull'
              ? 'bg-red-600 text-white'
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
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
