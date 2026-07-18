'use client';

import { useState } from 'react';

interface FilterButtonsProps {
  currentFilter: 'ALL' | 'OPEN' | 'RESOLVED';
  onFilterChange: (filter: 'ALL' | 'OPEN' | 'RESOLVED') => void;
}

export function FilterButtons({ currentFilter, onFilterChange }: FilterButtonsProps) {
  const [showIssuesDropdown, setShowIssuesDropdown] = useState(false);
  
  const isIssuesActive = currentFilter === 'OPEN' || currentFilter === 'RESOLVED';

  return (
    <div className="flex gap-2 mb-6">
      <button
        onClick={() => onFilterChange('ALL')}
        className={`px-6 py-2.5 rounded-lg border-none cursor-pointer font-semibold shadow-sm transition-all ${
          currentFilter === 'ALL'
            ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
            : 'bg-white text-gray-700 hover:text-[rgb(var(--orange))] hover:bg-orange-50'
        }`}
      >
        All
      </button>
      
      <div className="relative">
        <button
          onClick={() => setShowIssuesDropdown(!showIssuesDropdown)}
          className={`px-6 py-2.5 rounded-lg border-none cursor-pointer font-semibold shadow-sm transition-all flex items-center gap-2 ${
            isIssuesActive
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
              : 'bg-white text-gray-700 hover:text-[rgb(var(--orange))] hover:bg-orange-50'
          }`}
        >
          Issues
          <svg className={`w-4 h-4 transition-transform ${showIssuesDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showIssuesDropdown && (
          <div className="absolute top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-10 min-w-[140px]">
            <button
              onClick={() => {
                onFilterChange('OPEN');
                setShowIssuesDropdown(false);
              }}
              className={`w-full px-4 py-2.5 text-left font-medium transition-colors ${
                currentFilter === 'OPEN'
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Open
            </button>
            <button
              onClick={() => {
                onFilterChange('RESOLVED');
                setShowIssuesDropdown(false);
              }}
              className={`w-full px-4 py-2.5 text-left font-medium transition-colors ${
                currentFilter === 'RESOLVED'
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Resolved
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
